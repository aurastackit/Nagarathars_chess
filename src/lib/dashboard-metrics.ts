/** Pure helpers for the admin dashboard (no DB), so they can be unit-tested. */

const IST = "Asia/Kolkata";
const dayKeyFormatter = new Intl.DateTimeFormat("en-CA", { timeZone: IST }); // YYYY-MM-DD
const dayLabelFormatter = new Intl.DateTimeFormat("en-IN", {
  timeZone: IST,
  day: "numeric",
  month: "short",
});

/** The calendar day of `date` in India time, as YYYY-MM-DD. */
export function istDayKey(date: Date) {
  return dayKeyFormatter.format(date);
}

/** The last `days` calendar days in India time, oldest first, ending with today. */
export function lastDaysIST(days: number, now: Date) {
  const out: { key: string; label: string }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    // Noon UTC is the same calendar day in IST, whatever the hour of `now`.
    const d = new Date(`${istDayKey(now)}T12:00:00Z`);
    d.setUTCDate(d.getUTCDate() - i);
    out.push({ key: istDayKey(d), label: dayLabelFormatter.format(d) });
  }
  return out;
}

export type DailyActivity = { day: string; label: string; registrations: number; edits: number };

/** Counts new submissions and player edits per IST day. */
export function dailyRegistrationsAndEdits(
  events: { type: string; createdAt: Date }[],
  days: { key: string; label: string }[]
): DailyActivity[] {
  const rows = new Map(
    days.map((d) => [d.key, { day: d.key, label: d.label, registrations: 0, edits: 0 }])
  );
  for (const e of events) {
    const row = rows.get(istDayKey(e.createdAt));
    if (!row) continue;
    if (e.type === "submitted") row.registrations++;
    else if (e.type === "edited") row.edits++;
  }
  return [...rows.values()];
}

/** Share of decided applications that were confirmed, as a whole percentage; null when nothing is decided yet. */
export function approvalRate(confirmed: number, rejected: number) {
  const decided = confirmed + rejected;
  return decided === 0 ? null : Math.round((confirmed / decided) * 100);
}

/** Seats still free; null when the tournament has no limit. Never negative. */
export function seatsLeft(maxParticipants: number | null, taken: number) {
  return maxParticipants === null ? null : Math.max(0, maxParticipants - taken);
}

const relative = new Intl.RelativeTimeFormat("en-IN", { numeric: "auto" });

/** "3 days ago", "in 2 days", "yesterday" — rounded to the largest sensible unit. */
export function relativeTime(date: Date, now: Date) {
  const diffMs = date.getTime() - now.getTime();
  const abs = Math.abs(diffMs);
  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;
  if (abs < hour) return relative.format(Math.round(diffMs / minute), "minute");
  if (abs < day) return relative.format(Math.round(diffMs / hour), "hour");
  return relative.format(Math.round(diffMs / day), "day");
}
