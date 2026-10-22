import { buildTournamentIcs } from "@/lib/ics";
import { formatDateRange, formatDateTimeIST } from "@/lib/format";
import { SITE_URL } from "@/lib/site";
import { sendEmail, shouldStubEmail } from "@/lib/ses";
import { changesRequestedEmail, decisionEmail } from "@/lib/registration-emails";

// Logs instead of sending a real email. Used when SES isn't configured,
// which is only allowed outside production (see shouldStubEmail).
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
 * configured outside production.
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

  if (shouldStubEmail()) {
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

/**
 * Sent when an admin confirms or rejects a registration. The content comes from
 * src/lib/registration-emails.ts, which the admin page also uses for its preview.
 * Falls back to the console.log stub, same as above.
 */
export async function sendRegistrationDecisionEmail(params: {
  to: string;
  fullName: string;
  registrationId: string;
  tournamentTitle: string;
  decision: "confirmed" | "rejected";
  reason?: string | null;
}) {
  const { subject, html } = decisionEmail(params);
  if (shouldStubEmail()) {
    return notifyRegistration({
      to: params.to,
      fullName: params.fullName,
      subject,
      context: `Registration ${params.registrationId} for ${params.tournamentTitle} — ${params.decision}${
        params.reason ? ` (${params.reason})` : ""
      } — ${SITE_URL}/registration/${params.registrationId}`,
    });
  }
  return sendEmail({ to: params.to, subject, html });
}

/** Sent when an admin asks the player to fix something, with the date the seat is held until. */
export async function sendChangesRequestedEmail(params: {
  to: string;
  fullName: string;
  registrationId: string;
  tournamentTitle: string;
  reason: string;
  fixBy: Date;
}) {
  const { subject, html } = changesRequestedEmail(params);
  if (shouldStubEmail()) {
    return notifyRegistration({
      to: params.to,
      fullName: params.fullName,
      subject,
      context: `Changes requested (${params.reason}) — fix by ${formatDateTimeIST(params.fixBy)} IST — ${SITE_URL}/registration/${params.registrationId}`,
    });
  }
  return sendEmail({ to: params.to, subject, html });
}

const WAITLIST_LEVEL_LABEL: Record<string, string> = {
  beginner: "beginner",
  intermediate: "intermediate",
  advanced: "advanced",
};

/** Sent when someone joins the online classes waitlist. Falls back to the console.log stub, same as above. */
export async function sendWaitlistConfirmationEmail(params: {
  to: string;
  interestLevel?: string | null;
}) {
  const subject = "You're on the waitlist for Nagarathar's Chess online classes";
  const level = params.interestLevel ? WAITLIST_LEVEL_LABEL[params.interestLevel] : undefined;
  const classesUrl = `${SITE_URL}/classes`;

  if (shouldStubEmail()) {
    return notifyRegistration({
      to: params.to,
      fullName: params.to,
      subject,
      context: `Waitlist confirmation${level ? ` (${level})` : ""} — ${classesUrl}`,
    });
  }

  const html = `
    <p>Hi,</p>
    <p>Thanks for joining the waitlist for Nagarathar's Chess online classes.
      We'll email you as soon as classes open${level ? ` — we've noted that you're interested in ${level} classes` : ""}.</p>
    <p>See what's planned at <a href="${classesUrl}">${classesUrl}</a>.</p>
    <p>If you didn't sign up, you can ignore this email and we won't contact you again.</p>
  `;

  return sendEmail({ to: params.to, subject, html });
}
