import "server-only";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { deleteObjects } from "@/lib/s3";
import { logAdminAction } from "@/lib/audit-log";
import type { EventActor } from "@/lib/registration-events";
import { ageProofDeleteOn, ageProofRetentionDays, dueCutoff } from "@/lib/retention";

const DAY_MS = 24 * 60 * 60 * 1000;

/** Still holding an age proof: in S3, or inline from the old form. */
const HAS_AGE_PROOF: Prisma.RegistrationWhereInput = {
  OR: [{ ageProofKey: { not: null } }, { aadhaarImageData: { not: null } }],
};

const ROW = {
  id: true,
  registrationNo: true,
  fullName: true,
  ageProofKey: true,
  tournament: { select: { title: true, endDate: true } },
} satisfies Prisma.RegistrationSelect;

function rows(where: Prisma.TournamentWhereInput) {
  return prisma.registration.findMany({
    where: { ...HAS_AGE_PROOF, tournament: where },
    select: ROW,
    orderBy: [{ tournament: { endDate: "asc" } }, { registrationNo: "asc" }],
  });
}

/**
 * The admin report: age proofs due for deletion now, and those due in the
 * next `upcomingDays`, with the date each one goes.
 */
export async function ageProofRetentionReport(now = new Date(), upcomingDays = 30) {
  const days = ageProofRetentionDays();
  const cutoff = dueCutoff(days, now);
  const [due, upcoming] = await Promise.all([
    rows({ endDate: { lte: cutoff } }),
    rows({ endDate: { gt: cutoff, lte: new Date(cutoff.getTime() + upcomingDays * DAY_MS) } }),
  ]);
  const withDate = (r: (typeof due)[number]) => ({
    id: r.id,
    registrationNo: r.registrationNo,
    fullName: r.fullName,
    tournament: r.tournament.title,
    endedOn: r.tournament.endDate,
    deleteOn: ageProofDeleteOn(r.tournament.endDate, days),
  });
  return { days, due: due.map(withDate), upcoming: upcoming.map(withDate) };
}

/**
 * Deletes the age proofs whose tournament ended at least the retention period
 * ago (the daily job, or an admin from /admin/privacy): the file in S3, any
 * inline copy, and a "document deleted" entry on each timeline. A file S3
 * couldn't delete keeps its key, so the next run tries again.
 */
export async function deleteDueAgeProofs(actor: EventActor, now = new Date()) {
  const days = ageProofRetentionDays();
  const due = await rows({ endDate: { lte: dueCutoff(days, now) } });
  const { failed } = await deleteObjects(due.map((r) => r.ageProofKey ?? ""));
  const failedKeys = new Set(failed.map((f) => f.key));
  const done = due.filter((r) => !r.ageProofKey || !failedKeys.has(r.ageProofKey));
  const ids = done.map((r) => r.id);
  if (ids.length) {
    await prisma.$transaction([
      prisma.registration.updateMany({
        where: { id: { in: ids } },
        data: { ageProofKey: null, aadhaarImageData: null },
      }),
      prisma.registrationEvent.createMany({
        data: ids.map((registrationId) => ({
          registrationId,
          type: "document_deleted",
          actorType: actor.type,
          actor: actor.email?.toLowerCase() ?? null,
          note: `Age proof (kept ${days} days after the tournament)`,
        })),
      }),
    ]);
  }
  const deleted = done.map((r) => r.registrationNo ?? r.id);
  const listed =
    deleted.length > 20
      ? `${deleted.slice(0, 20).join(", ")} and ${deleted.length - 20} more`
      : deleted.join(", ");
  await logAdminAction({
    actorEmail: actor.email ?? "Daily job",
    action: "retention.age_proofs",
    targetType: "Registration",
    targetId: ids[0] ?? "none",
    summary:
      `${deleted.length ? `Deleted ${deleted.length} age proof(s): ${listed}` : "No age proofs due"} (kept ${days} days after the tournament)` +
      (failed.length
        ? `; ${failed.length} couldn't be deleted and will be retried: ${failed.map((f) => `${f.key} (${f.error})`).join(", ")}`
        : ""),
  });
  return { days, deleted, failed };
}
