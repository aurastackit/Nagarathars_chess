import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { endOfDayIST } from "@/lib/datetime";

/**
 * The next published tournament with registration still open. Wrapped in
 * React's `cache()` so multiple calls within one request share a single DB
 * round-trip — but that only dedupes within a single render. The root
 * layout used to call this once and pass the result down to a
 * client-persisted header, which does NOT re-render on client-side
 * navigation; the page below it does re-call this fresh on every
 * navigation. That let the header and the page disagree about which
 * tournament is "next". Fixed by moving the header's call into
 * src/app/template.tsx, which — unlike layout.tsx — re-runs on every
 * navigation, so it always shares the same fresh result as the page.
 */
// Word-start match, not a substring: a plain `contains: "test"` also hid real
// tournaments like "Chess Contest" or "Latest Rapid Open" in production.
const TEST_TITLE = /\btest/i;

/** True for a test tournament that should stay out of production listings, sitemaps and search results. */
export const isTestContent = (title: string) => process.env.NODE_ENV === "production" && TEST_TITLE.test(title);

export const getNextTournament = cache(async () => {
  const now = new Date();
  // Loose DB-level filter (deadlines are midnight UTC of the chosen date,
  // so anything from "yesterday" on might still have a future end-of-day-IST
  // cutoff) — the precise endOfDayIST check runs in JS below.
  const since = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const candidates = await prisma.tournament.findMany({
    where: { status: "published", registrationDeadline: { gt: since } },
    orderBy: { registrationDeadline: "asc" },
    take: 10,
  });
  return (
    candidates.find(
      (t) =>
        !isTestContent(t.title) && endOfDayIST(t.registrationDeadline) > now
    ) ?? null
  );
});
