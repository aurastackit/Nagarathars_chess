import "server-only";
import { prisma } from "@/lib/prisma";
import { SEAT_HOLDING_STATUSES } from "@/lib/registration-status";
import { emailRegistration } from "@/lib/registration-notify";

/** Calendar day of a stored date (dates are kept at UTC midnight). */
export const dayOf = (d: Date) => d.toISOString().slice(0, 10);

/**
 * The tournament's start date has changed: remember the previous one, ask every
 * player holding a seat to confirm the new date (dateChangeResponse = pending),
 * and email each of them the Confirm / Withdraw links.
 */
export async function announceDateChange(tournamentId: string, previousStart: Date) {
  const regs = await prisma.registration.findMany({
    where: { tournamentId, status: { in: SEAT_HOLDING_STATUSES } },
    select: { id: true },
  });
  const ids = regs.map((r) => r.id);
  await prisma.$transaction([
    prisma.tournament.update({
      where: { id: tournamentId },
      data: { previousStartDate: previousStart, dateChangedAt: new Date() },
    }),
    prisma.registration.updateMany({
      where: { id: { in: ids } },
      data: { dateChangeResponse: "pending", dateChangeRespondedAt: null },
    }),
  ]);
  let sent = 0;
  for (const id of ids) {
    if (await emailRegistration(id, "date_changed")) sent++;
  }
  return { players: ids.length, sent, failed: ids.length - sent };
}
