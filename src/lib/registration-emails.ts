import { formatDateTimeIST } from "@/lib/format";
import { SITE_URL } from "@/lib/site";

/**
 * Subject and HTML for the emails an admin's decision sends. Pure (no server
 * imports), so the admin page can preview exactly what the player will get
 * before the button is pressed; src/lib/notify.ts sends the same output.
 * Everything the player or admin typed is escaped.
 */

export const escapeHtml = (s: string) =>
  s.replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!
  );

export type EmailContent = { subject: string; html: string };

const statusUrl = (registrationId: string) => `${SITE_URL}/registration/${registrationId}`;

export function decisionEmail(params: {
  fullName: string;
  registrationId: string;
  tournamentTitle: string;
  decision: "confirmed" | "rejected";
  reason?: string | null;
}): EmailContent {
  const name = escapeHtml(params.fullName);
  const title = escapeHtml(params.tournamentTitle);
  const url = statusUrl(params.registrationId);
  if (params.decision === "confirmed") {
    return {
      subject: `Confirmed: ${params.tournamentTitle}`,
      html: `
        <p>Hi ${name},</p>
        <p>Your registration for <strong>${title}</strong> has been confirmed. See you there!</p>
        <p>Track your registration at <a href="${url}">${url}</a>.</p>
      `,
    };
  }
  const reason = params.reason?.trim();
  return {
    subject: `Update on your registration for ${params.tournamentTitle}`,
    html: `
        <p>Hi ${name},</p>
        <p>We're sorry — your registration for <strong>${title}</strong> could not be confirmed.</p>
        ${reason ? `<p><strong>Reason:</strong> ${escapeHtml(reason)}</p>` : ""}
        <p>If you think this is a mistake, please get in touch with the organizers.</p>
      `,
  };
}

export function changesRequestedEmail(params: {
  fullName: string;
  registrationId: string;
  tournamentTitle: string;
  reason: string;
  fixBy: Date;
}): EmailContent {
  const url = statusUrl(params.registrationId);
  const fixBy = `${formatDateTimeIST(params.fixBy)} IST`;
  return {
    subject: `Action needed by ${formatDateTimeIST(params.fixBy)}: ${params.tournamentTitle}`,
    html: `
    <p>Hi ${escapeHtml(params.fullName)},</p>
    <p>Your application for <strong>${escapeHtml(params.tournamentTitle)}</strong> needs a change before it can be confirmed:</p>
    <p><strong>${escapeHtml(params.reason)}</strong></p>
    <p>Please update it by <strong>${fixBy}</strong>. Your seat is held until then; after that the application is rejected automatically.</p>
    <p>See your application at <a href="${url}">${url}</a>.</p>
  `,
  };
}
