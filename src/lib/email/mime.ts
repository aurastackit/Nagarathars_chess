/**
 * Builds a raw MIME message (for SES SendRawEmail, needed for attachments):
 * multipart/mixed → multipart/alternative (plain text + HTML) → attachments.
 * Every part is base64 so UTF-8 (en dashes, Tamil names) survives any relay,
 * and headers that may carry non-ASCII text are RFC 2047 encoded.
 */

export type MimeAttachment = { filename: string; contentBase64: string; contentType?: string };

/** "=?UTF-8?B?…?=" for anything that isn't plain printable ASCII. */
export function encodeHeader(value: string) {
  const clean = value.replace(/[\r\n]+/g, " ");
  return /^[\x20-\x7e]*$/.test(clean)
    ? clean
    : `=?UTF-8?B?${Buffer.from(clean, "utf8").toString("base64")}?=`;
}

/** Base64 in 76-character lines, as MIME requires. */
export function wrapBase64(b64: string) {
  return b64.replace(/.{1,76}/g, "$&\r\n").trimEnd();
}

const asciiFilename = (name: string) => name.replace(/[^\w.\- ]+/g, "_");

export function buildRawEmail(p: {
  from: string;
  to: string;
  replyTo?: string;
  subject: string;
  html: string;
  text: string;
  attachments: MimeAttachment[];
  /** Fixed in tests; random otherwise. */
  boundarySeed?: string;
}) {
  const seed = p.boundarySeed ?? `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;
  const mixed = `mixed_${seed}`;
  const alt = `alt_${seed}`;
  const part = (type: string, body: string) => [
    `Content-Type: ${type}; charset=UTF-8`,
    "Content-Transfer-Encoding: base64",
    "",
    wrapBase64(Buffer.from(body, "utf8").toString("base64")),
  ];
  const lines = [
    `From: ${p.from}`,
    `To: ${p.to}`,
    ...(p.replyTo ? [`Reply-To: ${p.replyTo}`] : []),
    `Subject: ${encodeHeader(p.subject)}`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/mixed; boundary="${mixed}"`,
    "",
    `--${mixed}`,
    `Content-Type: multipart/alternative; boundary="${alt}"`,
    "",
    `--${alt}`,
    ...part("text/plain", p.text),
    `--${alt}`,
    ...part("text/html", p.html),
    `--${alt}--`,
  ];
  for (const a of p.attachments) {
    const name = asciiFilename(a.filename);
    lines.push(
      `--${mixed}`,
      `Content-Type: ${a.contentType ?? "application/octet-stream"}; name="${name}"`,
      "Content-Transfer-Encoding: base64",
      `Content-Disposition: attachment; filename="${name}"`,
      "",
      wrapBase64(a.contentBase64)
    );
  }
  lines.push(`--${mixed}--`, "");
  return lines.join("\r\n");
}
