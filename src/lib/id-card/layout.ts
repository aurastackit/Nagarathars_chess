import { create, type Font } from "fontkit";
import { FONT_BASE64 } from "./assets.generated";

/** PDF points per millimetre. */
export const PT_PER_MM = 72 / 25.4;

/** CR80 card, portrait: 54 × 86 mm. */
export const CARD_W = 54 * PT_PER_MM;
export const CARD_H = 86 * PT_PER_MM;

/** Space the name may use: card width minus 9 pt side padding. */
export const NAME_BOX_W = CARD_W - 18;

export const CATEGORY_STYLE: Record<string, { label: string; color: string }> = {
  under_11: { label: "Under 11", color: "#1f7a4d" },
  "11_to_18": { label: "Under 19", color: "#2b4c9b" },
  above_19: { label: "Above 19", color: "#6d3a9c" },
};

export const BRAND = {
  navy: "#2b4c9b",
  orange: "#f05a28",
  gold: "#c8922f",
  goldInk: "#8a6416",
  ink: "#17140f",
  muted: "#6b6555",
  card: "#fffdf9",
};

/** "9876541000" → "••••••1000" (only the last four digits show). */
export function maskMobile(phone: string) {
  const digits = phone.replace(/\D/g, "").slice(-10);
  if (digits.length < 4) return "—";
  return `${"•".repeat(Math.max(0, digits.length - 4))}${digits.slice(-4)}`;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** A date's day, month and year in IST. */
function istParts(date: Date) {
  const ist = new Date(date.getTime() + 330 * 60_000);
  return { d: ist.getUTCDate(), m: ist.getUTCMonth(), y: ist.getUTCFullYear() };
}

/**
 * The event line under the logo: "27 Dec 2026 · Chennai". A multi-day event
 * reads "27–28 Dec 2026", or "30 Dec 2026 – 1 Jan 2027" across months/years.
 */
export function eventLine(start: Date, end: Date | null, city: string | null) {
  const s = istParts(start);
  const e = end ? istParts(end) : s;
  const full = (p: typeof s) => `${p.d} ${MONTHS[p.m]} ${p.y}`;
  let date: string;
  if (e.y === s.y && e.m === s.m && e.d === s.d) date = full(s);
  else if (e.y === s.y && e.m === s.m) date = `${s.d}–${e.d} ${MONTHS[s.m]} ${s.y}`;
  else if (e.y === s.y) date = `${s.d} ${MONTHS[s.m]} – ${full(e)}`;
  else date = `${full(s)} – ${full(e)}`;
  return city?.trim() ? `${date} · ${city.trim()}` : date;
}

let fonts: { latin: Font; tamil: Font } | null = null;
function boldFonts() {
  fonts ??= {
    latin: create(Buffer.from(FONT_BASE64.interBold, "base64")),
    tamil: create(Buffer.from(FONT_BASE64.tamilBold, "base64")),
  };
  return fonts;
}

/** Width in points of `text` in the card's bold name font (Inter, falling back to Noto Sans Tamil per character). */
export function nameWidth(text: string, size: number) {
  const { latin, tamil } = boldFonts();
  let width = 0;
  let run = "";
  let runFont: Font | null = null;
  const flush = () => {
    if (run && runFont) width += (runFont.layout(run).advanceWidth / runFont.unitsPerEm) * size;
    run = "";
  };
  for (const ch of text) {
    const cp = ch.codePointAt(0)!;
    const font = latin.hasGlyphForCodePoint(cp) || ch === " " ? latin : tamil;
    if (font !== runFont) {
      flush();
      runFont = font;
    }
    run += ch;
  }
  flush();
  return width;
}

/** Greedy word wrap at a font size; a word wider than the box is split by characters. */
function wrap(text: string, size: number, maxWidth: number) {
  const lines: string[] = [];
  let line = "";
  for (const word of text.split(/\s+/).filter(Boolean)) {
    const candidate = line ? `${line} ${word}` : word;
    if (nameWidth(candidate, size) <= maxWidth) {
      line = candidate;
      continue;
    }
    if (line) lines.push(line);
    if (nameWidth(word, size) <= maxWidth) {
      line = word;
      continue;
    }
    // Break a very long single word.
    let part = "";
    for (const ch of word) {
      if (nameWidth(part + ch, size) > maxWidth && part) {
        lines.push(part);
        part = "";
      }
      part += ch;
    }
    line = part;
  }
  if (line) lines.push(line);
  return lines;
}

/** Largest size for a name that wraps: two lines must stay inside the 27 pt name box. */
const WRAPPED_MAX_SIZE = 11.5;

/**
 * The largest font size (13 pt for one line, 11.5 pt for two, down to 7 pt) at
 * which the name fits the box in at most two lines. If even 7 pt needs more,
 * the second line ends with "…".
 */
export function fitName(name: string, maxWidth = NAME_BOX_W, maxLines = 2) {
  const clean = name.trim().replace(/\s+/g, " ");
  for (let size = 13; size >= 7; size -= 0.5) {
    const lines = wrap(clean, size, maxWidth);
    if (lines.length === 1 || (lines.length <= maxLines && size <= WRAPPED_MAX_SIZE)) {
      return { size, lines };
    }
  }
  const size = 7;
  const lines = wrap(clean, size, maxWidth);
  const kept = lines.slice(0, maxLines);
  let last = kept[maxLines - 1];
  while (last.length > 1 && nameWidth(`${last}…`, size) > maxWidth) last = last.slice(0, -1);
  kept[maxLines - 1] = `${last.trimEnd()}…`;
  return { size, lines: kept };
}

/**
 * One line of detail text (e.g. a long native place): shrinks from `maxSize`
 * down to `minSize`, then ends with "…". Measured in the bold face, so the
 * semi-bold text on the card always fits.
 */
export function fitLine(text: string, maxWidth: number, maxSize = 6.2, minSize = 4.6) {
  const clean = text.trim().replace(/\s+/g, " ");
  for (let size = maxSize; size >= minSize - 1e-9; size -= 0.2) {
    if (nameWidth(clean, size) <= maxWidth)
      return { size: Math.round(size * 10) / 10, text: clean };
  }
  let cut = clean;
  while (cut.length > 1 && nameWidth(`${cut}…`, minSize) > maxWidth) cut = cut.slice(0, -1);
  return { size: minSize, text: `${cut.trimEnd()}…` };
}
