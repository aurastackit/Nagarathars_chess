"use client";

import { useEffect, useState } from "react";

export type NextTournamentInfo = { title: string; slug: string; registrationDeadline: string };

/** undefined = still loading; null = no tournament open for registration. */
export type NextTournamentState = NextTournamentInfo | null | undefined;

type Payload = { tournament: NextTournamentInfo | null; readOnly: boolean };

const MAX_AGE_MS = 60_000;

// Kept for the life of the tab: the header remounts on every navigation
// (it lives in template.tsx), and this stops the bar flashing its placeholder.
let cached: { value: Payload; at: number } | null = null;
let inflight: Promise<Payload> | null = null;

function load() {
  inflight ??= fetch("/api/next-tournament")
    .then((r) => (r.ok ? r.json() : { nextTournament: null }))
    .then((body: { nextTournament: NextTournamentInfo | null; readOnly?: boolean }) => {
      const value = { tournament: body.nextTournament, readOnly: Boolean(body.readOnly) };
      cached = { value, at: Date.now() };
      return value;
    })
    .catch(() => cached?.value ?? { tournament: null, readOnly: false })
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

/**
 * The next open tournament, fetched in the browser (/api/next-tournament,
 * CDN-cached for 60 s) so cached pages never show a stale announcement bar or
 * Register link. Starts as undefined (placeholder) on a full page load; after
 * that, navigations reuse the tab's copy and refresh it when older than a minute.
 * `readOnly` is true while the site is in read-only mode (lib/read-only).
 */
export function useNextTournament(): { tournament: NextTournamentState; readOnly: boolean } {
  const [state, setState] = useState<Payload | undefined>(() => cached?.value);

  useEffect(() => {
    let active = true;
    if (cached && Date.now() - cached.at < MAX_AGE_MS) return;
    load().then((value) => {
      if (active) setState(value);
    });
    return () => {
      active = false;
    };
  }, []);

  return { tournament: state?.tournament, readOnly: state?.readOnly ?? false };
}
