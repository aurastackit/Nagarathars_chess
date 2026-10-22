/** Confirmed players get a reminder this many days before the start (IST calendar days). */
export const REMINDER_DAYS = 3;

const IST_OFFSET_MS = 330 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

/** Whole IST calendar days from `now` to the tournament's start date (stored at UTC midnight). */
export function daysUntilIST(startDate: Date, now: Date) {
  const startDay = Date.UTC(
    startDate.getUTCFullYear(),
    startDate.getUTCMonth(),
    startDate.getUTCDate()
  );
  const ist = new Date(now.getTime() + IST_OFFSET_MS);
  const today = Date.UTC(ist.getUTCFullYear(), ist.getUTCMonth(), ist.getUTCDate());
  return Math.round((startDay - today) / DAY_MS);
}
