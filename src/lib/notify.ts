import { buildTournamentIcs } from "@/lib/ics";
import { formatDateRange } from "@/lib/format";
import { SITE_URL } from "@/lib/site";
import { isSesConfigured, sendEmail } from "@/lib/ses";

// Stubbed for the trial phase: logs instead of sending a real email.
// Falls back to this when SES isn't configured — nothing else needs to
// change, since every call site already awaits this function and only
// cares that it resolves.
export async function notifyRegistration(params: {
  to: string;
  fullName: string;
  subject: string;
  context: string;
}) {
  console.log(
    `[notify:stub] Would email ${params.to} (${params.fullName}) — "${params.subject}" — ${params.context}`
  );
  return { status: "stubbed" as const };
}

/**
 * Sends the tournament registration confirmation, with a .ics calendar
 * invite attached. Falls back to the console.log stub when SES isn't
 * configured, so this is safe to call in every environment.
 */
export async function sendRegistrationConfirmationEmail(params: {
  to: string;
  fullName: string;
  registrationId: string;
  tournament: {
    slug: string;
    title: string;
    description: string;
    venue: string;
    city: string;
    startDate: Date;
    endDate: Date;
  };
}) {
  const statusUrl = `${SITE_URL}/registration/${params.registrationId}`;
  const subject = `Registered: ${params.tournament.title}`;

  if (!isSesConfigured()) {
    return notifyRegistration({
      to: params.to,
      fullName: params.fullName,
      subject,
      context: `Registration ${params.registrationId} for ${params.tournament.title} — ${statusUrl}`,
    });
  }

  const ics = buildTournamentIcs(params.tournament);

  const html = `
    <p>Hi ${params.fullName},</p>
    <p>You're registered for <strong>${params.tournament.title}</strong>.</p>
    <p>
      ${formatDateRange(params.tournament.startDate, params.tournament.endDate)}<br/>
      ${params.tournament.venue}, ${params.tournament.city}
    </p>
    <p>Your registration ID is <strong>${params.registrationId}</strong>.
      Track its status any time at <a href="${statusUrl}">${statusUrl}</a>.</p>
    <p>A calendar invite is attached to this email.</p>
  `;

  return sendEmail({
    to: params.to,
    subject,
    html,
    attachments: [
      {
        filename: `${params.tournament.slug}.ics`,
        contentBase64: Buffer.from(ics).toString("base64"),
        contentType: "text/calendar",
      },
    ],
  });
}

/** Sent when an admin confirms or rejects a registration. Falls back to the console.log stub, same as above. */
export async function sendRegistrationDecisionEmail(params: {
  to: string;
  fullName: string;
  registrationId: string;
  tournamentTitle: string;
  decision: "confirmed" | "rejected";
  reason?: string | null;
}) {
  const statusUrl = `${SITE_URL}/registration/${params.registrationId}`;
  const subject =
    params.decision === "confirmed"
      ? `Confirmed: ${params.tournamentTitle}`
      : `Update on your registration for ${params.tournamentTitle}`;

  if (!isSesConfigured()) {
    return notifyRegistration({
      to: params.to,
      fullName: params.fullName,
      subject,
      context: `Registration ${params.registrationId} for ${params.tournamentTitle} — ${params.decision}${
        params.reason ? ` (${params.reason})` : ""
      } — ${statusUrl}`,
    });
  }

  const html =
    params.decision === "confirmed"
      ? `
        <p>Hi ${params.fullName},</p>
        <p>Your registration for <strong>${params.tournamentTitle}</strong> has been confirmed. See you there!</p>
        <p>Track your registration at <a href="${statusUrl}">${statusUrl}</a>.</p>
      `
      : `
        <p>Hi ${params.fullName},</p>
        <p>We're sorry — your registration for <strong>${params.tournamentTitle}</strong> could not be confirmed.</p>
        ${params.reason ? `<p><strong>Reason:</strong> ${params.reason}</p>` : ""}
        <p>If you think this is a mistake, please get in touch with the organizers.</p>
      `;

  return sendEmail({ to: params.to, subject, html });
}
