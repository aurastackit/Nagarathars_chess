/**
 * The exact instant of 23:59:59.999 IST on the given calendar date — the
 * cutoff used everywhere "registration closes" is checked or displayed.
 *
 * `registrationDeadline` is stored as midnight UTC of the chosen date (an
 * `<input type="date">` value coerced straight to a Date), so comparing it
 * against `new Date()` directly closes registration at 5:30am IST on the
 * deadline date — about 18.5 hours too early. This shifts the cutoff to the
 * end of that calendar day in India Standard Time instead.
 */
export function endOfDayIST(date: Date | string): Date {
  const dateStr = typeof date === "string" ? date.slice(0, 10) : date.toISOString().slice(0, 10);
  return new Date(`${dateStr}T23:59:59.999+05:30`);
}

/**
 * Midnight UTC of today's date in India — the form tournament dates are stored in
 * (midnight UTC of the calendar day). A tournament whose endDate is before this
 * has ended; one on this date is still on.
 */
export function todayIST(now: Date = new Date()): Date {
  return new Date(`${new Date(now.getTime() + 330 * 60_000).toISOString().slice(0, 10)}T00:00:00Z`);
}

/** Whether registration is still open for a deadline, as of `now`. */
export function isRegistrationOpen(registrationDeadline: Date | string, now: Date = new Date()) {
  return endOfDayIST(registrationDeadline) > now;
}
