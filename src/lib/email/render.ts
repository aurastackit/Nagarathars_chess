import { SITE_URL } from "@/lib/site";

/**
 * The one email layout: logo header, ivory page, white card, navy buttons, an
 * orange rule, and a plain-text twin of everything. Emails are built from typed
 * blocks rather than HTML strings, so every value is escaped by construction —
 * no template can forget. Pure (no server imports): the admin pages render the
 * same output for previews.
 */

export type EmailContent = { subject: string; html: string; text: string };

/** A run of text inside a paragraph: plain, bold, or a link. */
export type Inline = string | { strong: string } | { link: string; href: string };

export type Block =
  | { kind: "p"; parts: Inline[] }
  | {
      kind: "callout";
      tone: "info" | "success" | "warning" | "danger";
      title?: string;
      parts: Inline[];
    }
  | { kind: "details"; rows: [label: string, value: string][] }
  | { kind: "buttons"; buttons: { label: string; href: string; secondary?: boolean }[] }
  | { kind: "code"; code: string }
  | { kind: "quote"; text: string };

export type EmailSpec = {
  subject: string;
  /** Shown by inboxes next to the subject. */
  preheader: string;
  heading: string;
  blocks: Block[];
  /** Why they got it; shown small in the footer. */
  footerNote?: string;
};

export const BRAND = {
  page: "#f6f1e7",
  card: "#fffdf9",
  border: "#e6ddc8",
  ink: "#24201a",
  muted: "#6b6555",
  navy: "#2b4c9b",
  orange: "#f05a28",
  gold: "#c8922f",
};

const TONE = {
  info: { bg: "#eef2fb", border: "#c9d4ef", ink: "#1e3a7a" },
  success: { bg: "#edf7f0", border: "#c3e3cd", ink: "#166534" },
  warning: { bg: "#fdf4e3", border: "#efd9a7", ink: "#7a4a06" },
  danger: { bg: "#fdeeee", border: "#f3c7c7", ink: "#8f1d1d" },
} as const;

export const escapeHtml = (s: string) =>
  s.replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!
  );

/** Only http(s) and mailto links make it into an email; anything else becomes "#". */
export function safeHref(href: string) {
  return /^(https?:\/\/|mailto:)/i.test(href.trim()) ? href.trim() : "#";
}

const FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

function inlineHtml(parts: Inline[], linkColor = BRAND.navy) {
  return parts
    .map((p) => {
      if (typeof p === "string") return escapeHtml(p).replace(/\n/g, "<br>");
      if ("strong" in p) return `<strong>${escapeHtml(p.strong)}</strong>`;
      return `<a href="${escapeHtml(safeHref(p.href))}" style="color:${linkColor};text-decoration:underline;">${escapeHtml(p.link)}</a>`;
    })
    .join("");
}

function inlineText(parts: Inline[]) {
  return parts
    .map((p) => (typeof p === "string" ? p : "strong" in p ? p.strong : `${p.link} (${p.href})`))
    .join("");
}

function blockHtml(b: Block): string {
  const p = `margin:0 0 16px;font-size:15px;line-height:1.6;color:${BRAND.ink};`;
  switch (b.kind) {
    case "p":
      return `<p style="${p}">${inlineHtml(b.parts)}</p>`;
    case "callout": {
      const t = TONE[b.tone];
      return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 16px;border-collapse:separate;"><tr><td style="background:${t.bg};border:1px solid ${t.border};border-radius:8px;padding:14px 16px;font-size:15px;line-height:1.55;color:${t.ink};">${b.title ? `<strong style="display:block;margin-bottom:4px;">${escapeHtml(b.title)}</strong>` : ""}${inlineHtml(b.parts, t.ink)}</td></tr></table>`;
    }
    case "details":
      return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 16px;border-collapse:collapse;font-size:14px;">${b.rows
        .map(
          ([k, v]) =>
            `<tr><td style="padding:7px 12px 7px 0;border-bottom:1px solid ${BRAND.border};color:${BRAND.muted};white-space:nowrap;vertical-align:top;width:38%;">${escapeHtml(k)}</td><td style="padding:7px 0;border-bottom:1px solid ${BRAND.border};color:${BRAND.ink};font-weight:600;vertical-align:top;">${escapeHtml(v).replace(/\n/g, "<br>")}</td></tr>`
        )
        .join("")}</table>`;
    case "buttons":
      return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:4px 0 20px;"><tr>${b.buttons
        .map((btn) => {
          const style = btn.secondary
            ? `background:${BRAND.card};color:${BRAND.navy};border:2px solid ${BRAND.navy};`
            : `background:${BRAND.navy};color:#ffffff;border:2px solid ${BRAND.navy};`;
          return `<td style="padding:0 10px 10px 0;"><a href="${escapeHtml(safeHref(btn.href))}" style="${style}display:inline-block;padding:11px 20px;border-radius:8px;font-size:15px;font-weight:700;text-decoration:none;">${escapeHtml(btn.label)}</a></td>`;
        })
        .join("")}</tr></table>`;
    case "code":
      return `<p style="margin:0 0 16px;"><span style="display:inline-block;padding:12px 22px;border-radius:8px;background:${BRAND.page};border:1px solid ${BRAND.border};font-size:30px;font-weight:700;letter-spacing:6px;color:${BRAND.ink};font-family:Menlo,Consolas,monospace;">${escapeHtml(b.code)}</span></p>`;
    case "quote":
      return `<blockquote style="margin:0 0 16px;padding:10px 14px;border-left:4px solid ${BRAND.gold};background:${BRAND.page};font-size:15px;line-height:1.6;color:${BRAND.ink};white-space:pre-wrap;">${escapeHtml(b.text)}</blockquote>`;
  }
}

function blockText(b: Block): string {
  switch (b.kind) {
    case "p":
      return inlineText(b.parts);
    case "callout":
      return `${b.title ? `${b.title.toUpperCase()}\n` : ""}${inlineText(b.parts)}`;
    case "details": {
      const w = Math.max(...b.rows.map(([k]) => k.length));
      return b.rows
        .map(([k, v]) => `${k.padEnd(w)}  ${v.replace(/\n/g, `\n${" ".repeat(w + 2)}`)}`)
        .join("\n");
    }
    case "buttons":
      return b.buttons.map((btn) => `${btn.label}: ${btn.href}`).join("\n");
    case "code":
      return `    ${b.code}`;
    case "quote":
      return b.text
        .split("\n")
        .map((l) => `> ${l}`)
        .join("\n");
  }
}

export function renderEmail(spec: EmailSpec): EmailContent {
  const logo = `${SITE_URL}/brand/email-logo.png`;
  const footer = [
    spec.footerNote ?? "",
    "Nagarathar's Chess Championship · Think Ahead, Win Ahead.",
  ].filter(Boolean);

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light only">
<title>${escapeHtml(spec.subject)}</title>
<style>
  @media (max-width:620px){ .card{padding:24px 20px !important;} .wrap{padding:12px !important;} h1{font-size:21px !important;} }
</style>
</head>
<body style="margin:0;padding:0;background:${BRAND.page};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(spec.preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.page};">
<tr><td class="wrap" align="center" style="padding:28px 12px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;font-family:${FONT};">
<tr><td style="padding:0 4px 16px;" align="left">
<a href="${escapeHtml(SITE_URL)}" style="text-decoration:none;"><img src="${escapeHtml(logo)}" width="203" height="60" alt="Nagarathar's Chess Championship" style="display:block;border:0;height:60px;width:203px;"></a>
</td></tr>
<tr><td style="height:4px;background:${BRAND.orange};border-radius:4px 4px 0 0;font-size:0;line-height:0;">&nbsp;</td></tr>
<tr><td class="card" style="background:${BRAND.card};border:1px solid ${BRAND.border};border-top:0;border-radius:0 0 10px 10px;padding:32px 36px;">
<h1 style="margin:0 0 18px;font-size:23px;line-height:1.3;color:${BRAND.navy};font-family:${FONT};">${escapeHtml(spec.heading)}</h1>
${spec.blocks.map(blockHtml).join("\n")}
</td></tr>
<tr><td style="padding:18px 8px 0;font-size:12px;line-height:1.6;color:${BRAND.muted};" align="left">
${footer.map((f) => escapeHtml(f)).join("<br>")}<br>
<a href="${escapeHtml(SITE_URL)}" style="color:${BRAND.muted};">${escapeHtml(SITE_URL.replace(/^https?:\/\//, ""))}</a>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;

  const text = [
    spec.heading,
    "=".repeat(Math.min(60, spec.heading.length)),
    "",
    ...spec.blocks.map((b) => `${blockText(b)}\n`),
    "--",
    ...footer,
    SITE_URL,
  ].join("\n");

  return { subject: spec.subject, html, text };
}
