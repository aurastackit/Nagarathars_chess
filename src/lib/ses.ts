import { SESClient, SendEmailCommand, SendRawEmailCommand } from "@aws-sdk/client-ses";

export function isSesConfigured() {
  return Boolean(
    process.env.SES_REGION && process.env.SES_ACCESS_KEY_ID && process.env.SES_SECRET_ACCESS_KEY
  );
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

const DEFAULT_FROM = "Nagarathar's Chess <no-reply@example.com>";

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
  const from = process.env.SES_FROM_EMAIL ?? DEFAULT_FROM;

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
