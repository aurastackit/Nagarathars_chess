import "server-only";
import { SESClient, SendEmailCommand, SendRawEmailCommand } from "@aws-sdk/client-ses";
import { buildRawEmail, type MimeAttachment } from "@/lib/email/mime";

/** Every variable sending email needs. All four must be set in the Amplify console. */
export const SES_ENV_VARS = [
  "SES_REGION",
  "SES_ACCESS_KEY_ID",
  "SES_SECRET_ACCESS_KEY",
  "SES_FROM_EMAIL",
] as const;

export function missingSesVars() {
  // `||`-style emptiness check: on Amplify a missing variable arrives as "" (see env-runtime.ts).
  return SES_ENV_VARS.filter((k) => !process.env[k]);
}

/**
 * Whether to log emails instead of sending them. Only allowed outside
 * production: a production server without SES config throws, so a missing
 * variable shows up as an error rather than emails silently never arriving.
 */
export function shouldStubEmail() {
  const missing = missingSesVars();
  if (missing.length === 0) return false;
  if (process.env.NODE_ENV === "production") {
    throw new Error(`Email is not configured: missing ${missing.join(", ")}`);
  }
  return true;
}

function getClient() {
  return new SESClient({
    region: process.env.SES_REGION,
    credentials: {
      accessKeyId: process.env.SES_ACCESS_KEY_ID!,
      secretAccessKey: process.env.SES_SECRET_ACCESS_KEY!,
    },
  });
}

export type EmailAttachment = MimeAttachment;

/**
 * Sends an email via SES, always with an HTML and a plain-text part, in UTF-8.
 * Plain emails use SendEmailCommand; anything with attachments needs a
 * hand-built MIME message (src/lib/email/mime.ts) via SendRawEmailCommand,
 * since SES's simple API has no attachment support.
 */
export async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string | null;
  attachments?: EmailAttachment[];
}) {
  const client = getClient();
  const from = process.env.SES_FROM_EMAIL || "";
  if (!from) throw new Error("Email is not configured: missing SES_FROM_EMAIL");
  const replyTo = params.replyTo || undefined;

  if (!params.attachments || params.attachments.length === 0) {
    return client.send(
      new SendEmailCommand({
        Source: from,
        Destination: { ToAddresses: [params.to] },
        ...(replyTo && { ReplyToAddresses: [replyTo] }),
        Message: {
          Subject: { Data: params.subject, Charset: "UTF-8" },
          Body: {
            Html: { Data: params.html, Charset: "UTF-8" },
            Text: { Data: params.text, Charset: "UTF-8" },
          },
        },
      })
    );
  }

  const raw = buildRawEmail({
    from,
    to: params.to,
    replyTo,
    subject: params.subject,
    html: params.html,
    text: params.text,
    attachments: params.attachments,
  });
  return client.send(new SendRawEmailCommand({ RawMessage: { Data: Buffer.from(raw, "utf8") } }));
}
