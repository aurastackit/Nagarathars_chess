const dateFormatter = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

const weekdayDateFormatter = new Intl.DateTimeFormat("en-IN", {
  weekday: "long",
  day: "numeric",
  month: "short",
  year: "numeric",
});

const dateTimeISTFormatter = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "Asia/Kolkata",
});

/** e.g. "13 Oct 2026, 8:44 pm" — always India time, whatever the server's timezone. */
export function formatDateTimeIST(date: Date) {
  return dateTimeISTFormatter.format(date);
}

export function formatDate(date: Date) {
  return dateFormatter.format(date);
}

/** e.g. "Sunday, 27 Dec 2026". */
export function formatWeekdayDate(date: Date) {
  return weekdayDateFormatter.format(date);
}

export function formatDateRange(start: Date, end: Date) {
  if (start.toDateString() === end.toDateString()) {
    return formatDate(start);
  }
  return `${formatDate(start)} – ${formatDate(end)}`;
}
