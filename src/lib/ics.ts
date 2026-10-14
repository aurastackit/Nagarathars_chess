import { SITE_URL } from "@/lib/site";

function toIcsDate(date: Date) {
  return date
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}Z$/, "Z");
}

function escapeIcsText(text: string) {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

// Google's all-day dates are YYYYMMDD, and the end date is exclusive.
function toGoogleAllDay(date: Date) {
  return date.toISOString().slice(0, 10).replace(/-/g, "");
}

/**
 * Google Calendar "add event" link. Tournaments only store dates (no times),
 * so this is an all-day event from the start date through the end date.
 */
export function buildGoogleCalendarUrl(tournament: {
  title: string;
  venue: string;
  city: string;
  startDate: Date;
  endDate: Date;
}) {
  const dayAfterEnd = new Date(tournament.endDate.getTime() + 24 * 60 * 60 * 1000);
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: tournament.title,
    dates: `${toGoogleAllDay(tournament.startDate)}/${toGoogleAllDay(dayAfterEnd)}`,
    location: `${tournament.venue}, ${tournament.city}`,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
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
