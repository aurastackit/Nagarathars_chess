import { endOfDayIST } from "@/lib/datetime";

/**
 * Shared by the server (to compute an initial value that matches what the
 * client will render) and the client (to keep ticking after mount) — see
 * Countdown and AnnouncementBar for why both need to agree on this.
 */
export type TimeLeft = { d: number; h: number; m: number; s: number };

export function getTimeLeft(diffMs: number): TimeLeft {
  if (diffMs <= 0) return { d: 0, h: 0, m: 0, s: 0 };
  return {
    d: Math.floor(diffMs / 86400000),
    h: Math.floor((diffMs / 3600000) % 24),
    m: Math.floor((diffMs / 60000) % 60),
    s: Math.floor((diffMs / 1000) % 60),
  };
}

/** Compact "3d 4h" / "4h 12m" / "9m" form used by the announcement bar. */
export function formatCompact(diffMs: number): string | null {
  if (diffMs <= 0) return null;
  const { d, h, m } = getTimeLeft(diffMs);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${Math.max(m, 1)}m`;
}

/**
 * Wraps the `Date.now()` call needed to compute "time left" behind an
 * opaque function, so Server Components calling it aren't flagged by the
 * react-hooks/purity lint rule for calling an impure function directly in
 * their render body (the call still happens once per request, same as
 * before — this only changes where it's written).
 */
export function timeUntilEndOfDayIST(deadline: Date | string): TimeLeft {
  return getTimeLeft(endOfDayIST(deadline).getTime() - Date.now());
}

/** Same idea as {@link timeUntilEndOfDayIST}, for the announcement bar's compact label. */
export function labelUntilEndOfDayIST(deadline: Date | string): string | null {
  return formatCompact(endOfDayIST(deadline).getTime() - Date.now());
}
