import { createHmac, timingSafeEqual } from "crypto";

/**
 * Signed links for buttons in emails that let a player act without signing in
 * (e.g. "I'll be there" / "Withdraw" after a date change). The link carries the
 * action and an expiry, signed with a server secret, so it can't be forged or
 * reused for a different action. The link only opens a page; the player still
 * presses a button there, so link scanners that open URLs change nothing.
 */

export type EmailAction = "confirm-date" | "withdraw-date";
export const EMAIL_ACTIONS: EmailAction[] = ["confirm-date", "withdraw-date"];

/** How long a date-change link stays valid. */
export const ACTION_LINK_DAYS = 30;

function signature(registrationId: string, action: EmailAction, expires: number, secret: string) {
  return createHmac("sha256", `email-action:${secret}`)
    .update(`${registrationId}.${action}.${expires}`)
    .digest("base64url")
    .slice(0, 32);
}

/** Query string for a signed action link: ?a=<action>&e=<expiry seconds>&t=<signature>. */
export function signActionQuery(
  registrationId: string,
  action: EmailAction,
  secret: string,
  now = Date.now()
) {
  const expires = Math.floor(now / 1000) + ACTION_LINK_DAYS * 24 * 60 * 60;
  return new URLSearchParams({
    a: action,
    e: String(expires),
    t: signature(registrationId, action, expires, secret),
  }).toString();
}

export type ActionCheck =
  { ok: true; action: EmailAction } | { ok: false; reason: "invalid" | "expired" };

export function checkActionQuery(
  registrationId: string,
  q: { a?: string | null; e?: string | null; t?: string | null },
  secret: string,
  now = Date.now()
): ActionCheck {
  const action = q.a as EmailAction;
  const expires = Number(q.e);
  if (!EMAIL_ACTIONS.includes(action) || !Number.isInteger(expires) || !q.t) {
    return { ok: false, reason: "invalid" };
  }
  const expected = Buffer.from(signature(registrationId, action, expires, secret));
  const given = Buffer.from(q.t);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) {
    return { ok: false, reason: "invalid" };
  }
  if (expires * 1000 < now) return { ok: false, reason: "expired" };
  return { ok: true, action };
}
