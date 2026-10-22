/** Admin sessions end 12 h after sign-in, however active they are. */
export const ADMIN_SESSION_MAX_AGE_S = 12 * 60 * 60;

export type AdminSessionClaims = {
  /** ms timestamp of the sign-in that issued this cookie */
  loginAt?: number;
  /** credential version at sign-in — changes when the admin email or password is rotated */
  sv?: string;
};

/**
 * Whether a (signature-valid) admin cookie should still be honoured. Pure so it
 * can be unit-tested; require-admin.ts supplies the current version and the
 * time of the last sign-out.
 */
export function isSessionCurrent(
  claims: AdminSessionClaims,
  ctx: { now: number; version: string; lastLogoutAt: number | null }
) {
  if (typeof claims.loginAt !== "number" || typeof claims.sv !== "string") return false;
  if (claims.sv !== ctx.version) return false;
  if (ctx.now - claims.loginAt > ADMIN_SESSION_MAX_AGE_S * 1000) return false;
  if (ctx.lastLogoutAt !== null && claims.loginAt <= ctx.lastLogoutAt) return false;
  return true;
}
