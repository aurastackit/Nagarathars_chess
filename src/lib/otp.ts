import { randomBytes, randomInt, scryptSync, timingSafeEqual } from "crypto";

export const OTP_LENGTH = 6;
export const OTP_TTL_MS = 10 * 60 * 1000;
export const OTP_MAX_ATTEMPTS = 5;

/** How long a verified email stays "verified" for — e.g. long enough to finish the registration wizard. */
export const EMAIL_VERIFICATION_VALIDITY_MS = 60 * 60 * 1000;

/**
 * How many codes one email can be sent: a burst limit and a daily cap. Counted
 * from the stored codes, so they hold across server instances (the in-memory
 * limiter in rate-limit.ts doesn't).
 */
export const OTP_SEND_LIMITS = [
  {
    max: 3,
    windowMs: 10 * 60 * 1000,
    message:
      "We've sent 3 codes to this email in the last 10 minutes. Please use the latest one, or try again in a few minutes.",
  },
  {
    max: 10,
    windowMs: 24 * 60 * 60 * 1000,
    message:
      "Too many codes have been sent to this email today. Please try again tomorrow, or contact us.",
  },
] as const;

/** Why another code can't be sent yet, given when the recent ones were sent; null if it can. */
export function otpSendLimitMessage(sentAt: Date[], now = new Date()) {
  for (const limit of OTP_SEND_LIMITS) {
    const since = now.getTime() - limit.windowMs;
    if (sentAt.filter((d) => d.getTime() > since).length >= limit.max) return limit.message;
  }
  return null;
}

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
