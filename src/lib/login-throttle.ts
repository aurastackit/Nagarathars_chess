/**
 * Exponential backoff for admin sign-in. The first FREE_ATTEMPTS failures are
 * free; after that each further attempt has to wait twice as long as the last
 * (30 s, 1 min, 2 min, … capped at 30 min). Failures only count inside
 * WINDOW_MS and since the last successful sign-in.
 *
 * Pure (no DB) so it can be unit-tested — admin-login-guard.ts feeds it.
 */
export const FREE_ATTEMPTS = 5;
export const BASE_DELAY_MS = 30_000;
export const MAX_DELAY_MS = 30 * 60_000;
export const WINDOW_MS = 60 * 60_000;

export type LoginAttempt = { at: Date; ok: boolean };

/** Failures since the newest success (or the start of the window), and when the last one happened. */
export function recentFailures(attempts: LoginAttempt[], now: number) {
  const since = now - WINDOW_MS;
  let count = 0;
  let last: Date | null = null;
  for (const a of [...attempts].sort((x, y) => y.at.getTime() - x.at.getTime())) {
    if (a.at.getTime() < since || a.ok) break;
    count++;
    last ??= a.at;
  }
  return { count, last };
}

/** How long (ms) the caller still has to wait before another attempt is checked; 0 = go ahead. */
export function lockoutRemainingMs(attempts: LoginAttempt[], now: number) {
  const { count, last } = recentFailures(attempts, now);
  if (count < FREE_ATTEMPTS || !last) return 0;
  const delay = Math.min(BASE_DELAY_MS * 2 ** (count - FREE_ATTEMPTS), MAX_DELAY_MS);
  return Math.max(0, last.getTime() + delay - now);
}
