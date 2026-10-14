/** Keeps only digits, at most `max` of them: for year, rating and FIDE ID fields. */
export function digitsOnly(max: number) {
  return (value: string) => value.replace(/\D/g, "").slice(0, max);
}

/** A 10-digit Indian mobile number: digits only, dropping a pasted +91 or leading 0. */
export function sanitizePhone(value: string) {
  let digits = value.replace(/\D/g, "");
  if (digits.length > 10 && digits.startsWith("91")) digits = digits.slice(2);
  else if (digits.length > 10 && digits.startsWith("0")) digits = digits.slice(1);
  return digits.slice(0, 10);
}
