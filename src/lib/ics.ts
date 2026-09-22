import { SITE_URL } from "@/lib/site";

function toIcsDate(date: Date) {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function escapeIcsText(text: string) {
  return text.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

export function buildTournamentIcs(tournament: {
  slug: string;
  title: string;
  description: string;
  venue: string;
  city: string;
  startDate: Date;
  endDate: Date;
}) {
  const url = `${SITE_URL}/tournaments/${tournament.slug}`;
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Nagarathar's Chess Championship//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${tournament.slug}@nagaratharschess`,
    `DTSTAMP:${toIcsDate(new Date())}`,
    `DTSTART:${toIcsDate(tournament.startDate)}`,
    `DTEND:${toIcsDate(tournament.endDate)}`,
    `SUMMARY:${escapeIcsText(tournament.title)}`,
    `DESCRIPTION:${escapeIcsText(tournament.description)}`,
    `LOCATION:${escapeIcsText(`${tournament.venue}, ${tournament.city}`)}`,
    `URL:${url}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lines.join("\r\n");
}
