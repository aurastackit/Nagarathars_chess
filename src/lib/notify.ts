import "server-only";
import { sendEmail, shouldStubEmail, type EmailAttachment } from "@/lib/ses";
import type { EmailContent } from "@/lib/email/render";
import { contactNotificationEmail, waitlistEmail } from "@/lib/email/templates";

/**
 * The organisers' inbox (ORGANISERS_EMAIL): it receives contact-form messages
 * and is the Reply-To on emails to players, so a player's reply reaches a person.
 */
export function organisersEmail() {
  return process.env.ORGANISERS_EMAIL?.trim() || null;
}

/**
 * Sends one email (HTML + plain text). Outside production without SES it logs
 * instead (see shouldStubEmail); in production a missing SES setting throws.
 */
export async function deliver(
  to: string,
  content: EmailContent,
  opts: { attachments?: EmailAttachment[]; replyTo?: string | null } = {}
) {
  const replyTo = opts.replyTo === undefined ? organisersEmail() : opts.replyTo;
  if (shouldStubEmail()) {
    const files = opts.attachments?.map((a) => a.filename).join(", ");
    console.log(
      `[email:stub] Would email ${to} — "${content.subject}"${files ? ` [${files}]` : ""}`
    );
    return { status: "stubbed" as const };
  }
  await sendEmail({ to, ...content, replyTo, attachments: opts.attachments });
  return { status: "sent" as const };
}

// Logs instead of sending a real email. Still used by class enrolment, which
// has no email of its own yet.
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

/** Sent when someone joins the online classes waitlist. */
export async function sendWaitlistConfirmationEmail(params: {
  to: string;
  interestLevel?: string | null;
}) {
  return deliver(params.to, waitlistEmail({ interestLevel: params.interestLevel }));
}

/**
 * A contact-form message, to the organisers, with Reply-To set to the sender.
 * Skipped (and logged) when ORGANISERS_EMAIL isn't set; the message is still in
 * the admin Messages page either way.
 */
export async function sendContactNotification(message: {
  name: string;
  email: string;
  message: string;
  createdAt: Date;
}) {
  const to = organisersEmail();
  if (!to) {
    console.warn("[contact] ORGANISERS_EMAIL is not set — message saved but nobody was emailed");
    return { status: "skipped" as const };
  }
  return deliver(to, contactNotificationEmail({ ...message, receivedAt: message.createdAt }), {
    replyTo: message.email,
  });
}
