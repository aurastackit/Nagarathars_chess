import "server-only";
import { prisma } from "@/lib/prisma";
import { deliver } from "@/lib/notify";
import { sendRegistrationEmail } from "@/lib/registration-events";
import { fixByDate, type RegistrationStatus } from "@/lib/registration-status";
import { buildTournamentIcs } from "@/lib/ics";
import { absoluteUrl } from "@/lib/site";
import { idCardPdf } from "@/lib/id-card/cards";
import { signActionQuery } from "@/lib/email/action-links";
import type { EmailAttachment } from "@/lib/ses";
import {
  applicationReceivedEmail,
  approvedEmail,
  changesRequestedEmail,
  dateChangedEmail,
  rejectedEmail,
  reminderEmail,
  reopenedEmail,
  withdrawnEmail,
  type EmailRegistration,
} from "@/lib/email/templates";

export type RegistrationEmailKind =
  | "received"
  | "approved"
  | "changes"
  | "rejected"
  | "reopened"
  | "withdrawn"
  | "date_changed"
  | "reminder";

/** The label on the timeline (email_sent / email_failed note). */
export const EMAIL_LABEL: Record<RegistrationEmailKind, string> = {
  received: "Application received",
  approved: "Confirmation",
  changes: "Changes requested",
  rejected: "Rejection",
  reopened: "Re-opened",
  withdrawn: "Withdrawal",
  date_changed: "Date change",
  reminder: "Event reminder",
};

function secret() {
  const s = process.env.AUTH_SECRET;
  if (!s) throw new Error("AUTH_SECRET is not set");
  return s;
}

/** Signed "I'll be there" / "Withdraw" links for the date-change email. */
export function dateChangeLinks(registrationId: string) {
  const base = absoluteUrl(`/registration/${registrationId}/respond`);
  return {
    confirmUrl: `${base}?${signActionQuery(registrationId, "confirm-date", secret())}`,
    withdrawUrl: `${base}?${signActionQuery(registrationId, "withdraw-date", secret())}`,
  };
}

/**
 * Emails a player about their registration and records email_sent /
 * email_failed on its timeline. Never throws (the change that triggered it has
 * already happened); returns whether it went out.
 */
export async function emailRegistration(
  registrationId: string,
  kind: RegistrationEmailKind,
  extra: { reason?: string | null; byPlayer?: boolean; label?: string } = {}
) {
  const r = await prisma.registration.findUnique({
    where: { id: registrationId },
    include: {
      tournament: {
        select: {
          slug: true,
          title: true,
          description: true,
          startDate: true,
          endDate: true,
          venue: true,
          city: true,
          previousStartDate: true,
        },
      },
    },
  });
  if (!r) return false;
  const reg: EmailRegistration = {
    id: r.id,
    fullName: r.fullName,
    registrationNo: r.registrationNo,
    tournament: r.tournament,
  };

  return sendRegistrationEmail(r.id, extra.label ?? EMAIL_LABEL[kind], async () => {
    const attachments: EmailAttachment[] = [];
    let content;
    switch (kind) {
      case "received":
        content = applicationReceivedEmail(reg);
        break;
      case "approved": {
        content = approvedEmail(reg);
        try {
          const { pdf } = await idCardPdf(r.id);
          attachments.push({
            filename: `${r.registrationNo ?? "player"}-id-card.pdf`,
            contentBase64: pdf.toString("base64"),
            contentType: "application/pdf",
          });
        } catch (err) {
          // The email still goes; the card can be downloaded from the link in it.
          console.error(`[email] ID card for ${r.id} not attached:`, err);
        }
        attachments.push({
          filename: `${r.tournament.slug}.ics`,
          contentBase64: Buffer.from(buildTournamentIcs(r.tournament)).toString("base64"),
          contentType: "text/calendar",
        });
        break;
      }
      case "changes":
        content = changesRequestedEmail(reg, {
          reason: extra.reason ?? r.rejectionReason ?? "",
          fixBy: fixByDate(r.reviewedAt ?? new Date()),
        });
        break;
      case "rejected":
        content = rejectedEmail(reg, { reason: extra.reason ?? r.rejectionReason });
        break;
      case "reopened":
        content = reopenedEmail(reg);
        break;
      case "withdrawn":
        content = withdrawnEmail(reg, {
          reason: extra.reason ?? r.withdrawReason,
          byPlayer: extra.byPlayer ?? false,
        });
        break;
      case "date_changed":
        content = dateChangedEmail(reg, {
          previousStart: r.tournament.previousStartDate ?? r.tournament.startDate,
          ...dateChangeLinks(r.id),
        });
        break;
      case "reminder":
        content = reminderEmail(reg);
        break;
    }
    await deliver(r.email, content, { attachments });
  });
}

/** The email for a status change, if there is one. Every admin/system/player change goes through here. */
export function emailForStatusChange(
  registrationId: string,
  to: RegistrationStatus,
  extra: { reason?: string | null; byPlayer?: boolean; label?: string } = {}
) {
  const kind: Record<RegistrationStatus, RegistrationEmailKind | null> = {
    confirmed: "approved",
    rejected: "rejected",
    changes_requested: "changes",
    // Back to pending: an admin re-opened it (a player's own resubmission is emailed as "received").
    pending: extra.byPlayer ? "received" : "reopened",
    withdrawn: "withdrawn",
  };
  const k = kind[to];
  return k ? emailRegistration(registrationId, k, extra) : Promise.resolve(null);
}
