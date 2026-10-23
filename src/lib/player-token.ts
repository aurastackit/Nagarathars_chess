import { createHmac, timingSafeEqual } from "crypto";

/**
 * The player's self-service session: proof that this browser entered the code
 * emailed to an address. "<email, base64url>.<expiry, seconds>.<signature>",
 * signed with a server secret, kept in an httpOnly cookie. No database row —
 * it simply expires.
 */

export const PLAYER_SESSION_COOKIE = "ncc_player";
export const PLAYER_SESSION_HOURS = 2;

function signature(payload: string, secret: string) {
  return createHmac("sha256", `player-session:${secret}`).update(payload).digest("base64url");
}

export function signPlayerToken(email: string, secret: string, now = Date.now()) {
  const exp = Math.floor(now / 1000) + PLAYER_SESSION_HOURS * 60 * 60;
  const payload = `${Buffer.from(email.trim().toLowerCase()).toString("base64url")}.${exp}`;
  return `${payload}.${signature(payload, secret)}`;
}

/** The signed-in email, or null if the token is missing, forged or expired. */
export function verifyPlayerToken(token: string | undefined, secret: string, now = Date.now()) {
  if (!token || !secret) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [emailPart, expPart, sig] = parts;
  const expected = Buffer.from(signature(`${emailPart}.${expPart}`, secret));
  const given = Buffer.from(sig);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  const exp = Number(expPart);
  if (!Number.isInteger(exp) || exp * 1000 < now) return null;
  const email = Buffer.from(emailPart, "base64url").toString("utf8");
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;
}
