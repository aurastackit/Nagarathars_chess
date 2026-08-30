const dateFormatter = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" });

export function formatDate(date: Date) {
  return dateFormatter.format(date);
}

export function formatDateRange(start: Date, end: Date) {
  if (start.toDateString() === end.toDateString()) {
    return formatDate(start);
  }
  return `${formatDate(start)} – ${formatDate(end)}`;
}
