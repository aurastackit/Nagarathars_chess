import "server-only";
import { SESClient, SendEmailCommand, SendRawEmailCommand } from "@aws-sdk/client-ses";

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

export type EmailAttachment = {
  filename: string;
  contentBase64: string;
  contentType?: string;
};

/**
 * Sends an email via SES. Plain emails use SendEmailCommand; anything with
 * attachments needs a hand-built MIME message via SendRawEmailCommand, since
 * SES's simple API has no attachment support.
 */
export async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
  attachments?: EmailAttachment[];
}) {
  const client = getClient();
  const from = process.env.SES_FROM_EMAIL || "";
  if (!from) throw new Error("Email is not configured: missing SES_FROM_EMAIL");

  if (!params.attachments || params.attachments.length === 0) {
    return client.send(
      new SendEmailCommand({
        Source: from,
        Destination: { ToAddresses: [params.to] },
        Message: {
          Subject: { Data: params.subject },
          Body: { Html: { Data: params.html } },
        },
      })
    );
  }

  const boundary = `----=_Part_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const lines = [
    `From: ${from}`,
    `To: ${params.to}`,
    `Subject: ${params.subject}`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/mixed; boundary="${boundary}"`,
    "",
    `--${boundary}`,
    "Content-Type: text/html; charset=UTF-8",
    "Content-Transfer-Encoding: 7bit",
    "",
    params.html,
    "",
  ];

  for (const attachment of params.attachments) {
    lines.push(
      `--${boundary}`,
      `Content-Type: ${attachment.contentType ?? "application/octet-stream"}; name="${attachment.filename}"`,
      "Content-Transfer-Encoding: base64",
      `Content-Disposition: attachment; filename="${attachment.filename}"`,
      "",
      attachment.contentBase64,
      ""
    );
  }
  lines.push(`--${boundary}--`, "");

  return client.send(
    new SendRawEmailCommand({
      RawMessage: { Data: Buffer.from(lines.join("\r\n")) },
    })
  );
}
