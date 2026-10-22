"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdminPage } from "@/lib/require-admin";
import { logAdminAction, type AdminAction } from "@/lib/audit-log";
import { emailForStatusChange } from "@/lib/registration-notify";
import { StaleStatusError, changeRegistrationStatus } from "@/lib/registration-workflow";
import {
  InvalidTransitionError,
  REGISTRATION_STATUSES,
  type RegistrationStatus,
} from "@/lib/registration-status";
import {
  ACTION_TARGET,
  MAX_REASON,
  MIN_REASON,
  REASON_REQUIRED,
  type ReviewAction,
} from "@/lib/registration-review";
import { revalidateTournamentSeats } from "@/lib/revalidate-public";

export type ActionResult = { ok: boolean; message: string } | null;

const AUDIT: Record<ReviewAction, { action: AdminAction; verb: string }> = {
  approve: { action: "registration.confirm", verb: "Confirmed" },
  reject: { action: "registration.reject", verb: "Rejected" },
  changes: { action: "registration.changes", verb: "Asked for changes on" },
  reopen: { action: "registration.reopen", verb: "Re-opened" },
  withdraw: { action: "registration.withdraw", verb: "Withdrew" },
};

function revalidateRegistration(id: string, tournamentId: string) {
  revalidatePath(`/admin/registrations/${id}`);
  revalidatePath("/admin/registrations");
  revalidatePath("/admin");
  revalidatePath(`/admin/tournaments/${tournamentId}`);
  revalidatePath(`/registration/${id}`);
}

/** Approve, reject, request changes, re-open or withdraw one registration, then email the player where there's an email for it. */
export async function reviewRegistration(
  _state: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const session = await requireAdminPage();
  const admin = session.user!.email!;
  const id = String(formData.get("id") ?? "");
  const action = String(formData.get("action") ?? "") as ReviewAction;
  const from = String(formData.get("from") ?? "") as RegistrationStatus;
  const reason =
    String(formData.get("reason") ?? "")
      .trim()
      .slice(0, MAX_REASON) || null;

  if (!id || !(action in ACTION_TARGET) || !REGISTRATION_STATUSES.includes(from)) {
    return { ok: false, message: "Something was missing from the form. Reload and try again." };
  }
  if (REASON_REQUIRED.includes(action) && (reason?.length ?? 0) < MIN_REASON) {
    return {
      ok: false,
      message: "Write the reason the player will see (at least a few words).",
    };
  }

  let r;
  try {
    r = await changeRegistrationStatus({
      registrationId: id,
      to: ACTION_TARGET[action],
      actor: { type: "admin", email: admin },
      reason: action === "approve" || action === "reopen" ? null : reason,
      expectFrom: from,
    });
  } catch (err) {
    if (err instanceof StaleStatusError || err instanceof InvalidTransitionError) {
      revalidatePath(`/admin/registrations/${id}`);
      return {
        ok: false,
        message:
          "This registration was changed by someone else (or can't make that change now). The page shows its current status.",
      };
    }
    throw err;
  }

  const audit = AUDIT[action];
  await logAdminAction({
    actorEmail: admin,
    action: audit.action,
    targetType: "Registration",
    targetId: id,
    summary: `${audit.verb} ${r.fullName}'s registration (${r.registrationNo ?? id}) for "${r.tournament.title}"${reason && action !== "approve" && action !== "reopen" ? ` — ${reason}` : ""}`,
  });

  const emailed = await emailForStatusChange(r.id, ACTION_TARGET[action], { reason });

  revalidateRegistration(id, r.tournamentId);
  revalidateTournamentSeats(r.tournament.slug);

  const done = `${audit.verb} ${r.fullName}'s registration.`;
  const email = emailed
    ? " The player has been emailed."
    : " The email to the player failed — see the timeline.";
  return { ok: true, message: done + email };
}

/** Internal notes: for admins only, never shown to the player. */
export async function saveAdminNotes(
  _state: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const session = await requireAdminPage();
  const id = String(formData.get("id") ?? "");
  const notes = String(formData.get("notes") ?? "")
    .trim()
    .slice(0, 4000);
  const r = await prisma.registration.update({
    where: { id },
    data: { adminNotes: notes || null },
    select: { fullName: true, registrationNo: true },
  });
  await logAdminAction({
    actorEmail: session.user!.email!,
    action: "registration.notes",
    targetType: "Registration",
    targetId: id,
    summary: `Updated the internal notes on ${r.fullName}'s registration (${r.registrationNo ?? id})`,
  });
  revalidatePath(`/admin/registrations/${id}`);
  return { ok: true, message: "Notes saved." };
}

/**
 * Deletes a registration and its timeline for good. The admin must type the
 * registration number to confirm. (Its uploaded files stay in S3 until the
 * document clean-up in the privacy step.)
 */
export async function deleteRegistration(
  _state: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const session = await requireAdminPage();
  const id = String(formData.get("id") ?? "");
  const typed = String(formData.get("confirm") ?? "").trim();
  const r = await prisma.registration.findUnique({
    where: { id },
    select: {
      fullName: true,
      registrationNo: true,
      tournamentId: true,
      tournament: { select: { title: true, slug: true } },
    },
  });
  if (!r) return { ok: false, message: "This registration no longer exists." };
  const expected = r.registrationNo ?? "DELETE";
  if (typed.toUpperCase() !== expected.toUpperCase()) {
    return { ok: false, message: `Type ${expected} exactly to confirm.` };
  }

  await prisma.registration.delete({ where: { id } });
  await logAdminAction({
    actorEmail: session.user!.email!,
    action: "registration.delete",
    targetType: "Registration",
    targetId: id,
    summary: `Deleted ${r.fullName}'s registration (${expected}) for "${r.tournament.title}"`,
  });
  revalidateRegistration(id, r.tournamentId);
  revalidateTournamentSeats(r.tournament.slug);
  redirect(`/admin/registrations?deleted=${encodeURIComponent(expected)}`);
}
