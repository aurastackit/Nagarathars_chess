import { Resend } from "resend";
import { buildTournamentIcs } from "@/lib/ics";
import { formatDateRange } from "@/lib/format";
import { SITE_URL } from "@/lib/site";

// Stubbed for the trial phase: logs instead of sending a real email.
// Swap the body of this function for a Resend call later — nothing else needs to change,
// since every call site already awaits this function and only cares that it resolves.
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

function isResendConfigured() {
  return Boolean(process.env.RESEND_API_KEY);
}

/**
 * Sends the tournament registration confirmation, with a .ics calendar
 * invite attached. Falls back to the console.log stub when RESEND_API_KEY
 * isn't set, so this is safe to call in every environment.
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

  if (!isResendConfigured()) {
    return notifyRegistration({
      to: params.to,
      fullName: params.fullName,
      subject,
      context: `Registration ${params.registrationId} for ${params.tournament.title} — ${statusUrl}`,
    });
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
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

  return resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL ?? "Nagarathar's Chess <registrations@example.com>",
    to: params.to,
    subject,
    html,
    attachments: [
      {
        filename: `${params.tournament.slug}.ics`,
        content: Buffer.from(ics).toString("base64"),
      },
    ],
  });
}
