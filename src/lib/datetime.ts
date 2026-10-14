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

/** Whether registration is still open for a deadline, as of `now`. */
export function isRegistrationOpen(registrationDeadline: Date | string, now: Date = new Date()) {
  return endOfDayIST(registrationDeadline) > now;
}
