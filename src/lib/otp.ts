import { randomBytes, randomInt, scryptSync, timingSafeEqual } from "crypto";

export const OTP_LENGTH = 6;
export const OTP_TTL_MS = 10 * 60 * 1000;
export const OTP_MAX_ATTEMPTS = 5;

/** How long a verified email stays "verified" for — e.g. long enough to finish the registration wizard. */
export const EMAIL_VERIFICATION_VALIDITY_MS = 60 * 60 * 1000;

export function generateOtp(): string {
  return randomInt(0, 10 ** OTP_LENGTH).toString().padStart(OTP_LENGTH, "0");
}

/** Stores as "salt:hash" (both hex) so verification doesn't need a separate column. */
export function hashOtp(code: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(code, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyOtpHash(code: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const expected = Buffer.from(hash, "hex");
  const candidate = scryptSync(code, salt, 64);
  return candidate.length === expected.length && timingSafeEqual(candidate, expected);
}
