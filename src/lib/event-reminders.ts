import "server-only";
import { prisma } from "@/lib/prisma";
import { EMAIL_LABEL, emailRegistration } from "@/lib/registration-notify";
import { daysUntilIST, REMINDER_DAYS } from "@/lib/reminder-schedule";

/**
 * Daily job: confirmed players of tournaments starting within REMINDER_DAYS
 * (IST calendar days) get the reminder email, once — a reminder already sent
 * for a registration is never repeated; a failed one is retried the next day.
 */
export async function sendEventReminders(now = new Date()) {
  const soon = await prisma.tournament.findMany({
    where: {
      startDate: {
        gt: new Date(now.getTime() - 24 * 60 * 60 * 1000),
        lt: new Date(now.getTime() + (REMINDER_DAYS + 1) * 24 * 60 * 60 * 1000),
      },
    },
    select: { id: true, startDate: true },
  });
  const due = soon.filter((t) => {
    const d = daysUntilIST(t.startDate, now);
    return d >= 1 && d <= REMINDER_DAYS;
  });
  if (due.length === 0) return { tournaments: 0, sent: 0, failed: 0 };

  const regs = await prisma.registration.findMany({
    where: {
      tournamentId: { in: due.map((t) => t.id) },
      status: { in: ["confirmed", "registered"] },
      NOT: { events: { some: { type: "email_sent", note: EMAIL_LABEL.reminder } } },
    },
    select: { id: true },
  });
  let sent = 0;
  for (const r of regs) {
    if (await emailRegistration(r.id, "reminder")) sent++;
  }
  return { tournaments: due.length, sent, failed: regs.length - sent };
}
