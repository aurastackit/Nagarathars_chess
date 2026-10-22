import { prisma } from "@/lib/prisma";
import { sendRegistrationDecisionEmail } from "@/lib/notify";
import { sendRegistrationEmail } from "@/lib/registration-events";
import { StaleStatusError, changeRegistrationStatus } from "@/lib/registration-workflow";
import { CHANGES_EXPIRED_REASON, CHANGES_REQUESTED_DAYS } from "@/lib/registration-status";
import { revalidateTournamentSeats } from "@/lib/revalidate-public";

/**
 * Daily job: a registration that has been in changes_requested for more than
 * CHANGES_REQUESTED_DAYS without the player resubmitting is rejected, the
 * player gets the rejection email, and the seat is released.
 */
export async function expireChangesRequests(now = new Date()) {
  const cutoff = new Date(now.getTime() - CHANGES_REQUESTED_DAYS * 24 * 60 * 60 * 1000);
  const overdue = await prisma.registration.findMany({
    where: { status: "changes_requested", reviewedAt: { lte: cutoff } },
    select: { id: true },
  });

  const expired: string[] = [];
  for (const { id } of overdue) {
    let registration;
    try {
      registration = await changeRegistrationStatus({
        registrationId: id,
        to: "rejected",
        actor: { type: "system" },
        reason: CHANGES_EXPIRED_REASON,
      });
    } catch (err) {
      // The player resubmitted (or an admin acted) since the query: leave it.
      if (err instanceof StaleStatusError) continue;
      throw err;
    }
    expired.push(registration.registrationNo ?? registration.id);
    await sendRegistrationEmail(registration.id, "Rejection (no update within 7 days)", () =>
      sendRegistrationDecisionEmail({
        to: registration.email,
        fullName: registration.fullName,
        registrationId: registration.id,
        tournamentTitle: registration.tournament.title,
        decision: "rejected",
        reason: CHANGES_EXPIRED_REASON,
      })
    );
    revalidateTournamentSeats(registration.tournament.slug);
  }
  return { checked: overdue.length, expired };
}
