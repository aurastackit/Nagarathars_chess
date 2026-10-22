"use server";

import { revalidatePath } from "next/cache";
import { requireAdminPage } from "@/lib/require-admin";
import { logAdminAction } from "@/lib/audit-log";
import { emailForStatusChange } from "@/lib/registration-notify";
import { StaleStatusError, changeRegistrationStatus } from "@/lib/registration-workflow";
import { InvalidTransitionError } from "@/lib/registration-status";
import { revalidateTournamentSeats } from "@/lib/revalidate-public";

export type BulkResult = { done: number; skipped: number; message: string } | null;

const MAX_BULK = 100;

/**
 * Applies one status change to many registrations. Each goes through the same
 * transition rules, timeline event and email as a single action; ones that
 * can't make the move (e.g. already confirmed) are skipped and counted.
 */
async function bulkChange(
  ids: string[],
  to: "confirmed" | "changes_requested",
  reason: string | null
): Promise<BulkResult> {
  const session = await requireAdminPage();
  const admin = session.user!.email!;
  const unique = [...new Set(ids)].slice(0, MAX_BULK);
  let done = 0;
  let skipped = 0;
  const slugs = new Set<string>();

  for (const registrationId of unique) {
    let r;
    try {
      r = await changeRegistrationStatus({
        registrationId,
        to,
        actor: { type: "admin", email: admin },
        reason,
        note: "Bulk action",
      });
    } catch (err) {
      if (err instanceof InvalidTransitionError || err instanceof StaleStatusError) {
        skipped++;
        continue;
      }
      throw err;
    }
    done++;
    slugs.add(r.tournament.slug);
    await emailForStatusChange(r.id, to, { reason });
  }

  const verb = to === "confirmed" ? "Approved" : "Asked for changes on";
  if (done > 0) {
    await logAdminAction({
      actorEmail: admin,
      action: "registration.bulk",
      targetType: "Registration",
      targetId: unique[0],
      summary: `${verb} ${done} registration(s) in bulk${reason ? ` — ${reason}` : ""}`,
    });
  }
  revalidatePath("/admin/registrations");
  revalidatePath("/admin");
  for (const slug of slugs) revalidateTournamentSeats(slug);

  const message =
    `${verb} ${done} registration${done === 1 ? "" : "s"}` +
    (skipped
      ? `; skipped ${skipped} that couldn't make that change from their current status.`
      : ".");
  return { done, skipped, message };
}

export async function bulkApprove(_state: BulkResult, formData: FormData): Promise<BulkResult> {
  return bulkChange(formData.getAll("ids").map(String), "confirmed", null);
}

export async function bulkRequestChanges(
  _state: BulkResult,
  formData: FormData
): Promise<BulkResult> {
  const reason = String(formData.get("reason") ?? "").trim();
  if (reason.length < 5) {
    return {
      done: 0,
      skipped: 0,
      message: "Write what the players need to change (at least a few words).",
    };
  }
  return bulkChange(formData.getAll("ids").map(String), "changes_requested", reason.slice(0, 500));
}
