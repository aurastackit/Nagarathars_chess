import { randomBytes } from "crypto";

/**
 * The token in an ID card's QR code (/verify/<token>), stored on the
 * registration (Registration.verifyToken) when it is confirmed: 16 URL-safe
 * characters from 96 random bits — unguessable, and short enough for a QR code
 * that scans easily at 11 mm. It never changes, so a printed card keeps working;
 * the verify page decides "Valid" from the registration's current status.
 */
export function newVerifyToken() {
  return randomBytes(12).toString("base64url");
}

/** Tokens from newVerifyToken (16) or the migration backfill (22); anything else is rejected before a lookup. */
export const VERIFY_TOKEN_PATTERN = /^[A-Za-z0-9_-]{16,32}$/;
