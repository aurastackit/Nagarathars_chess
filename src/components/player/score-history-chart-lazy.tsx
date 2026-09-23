"use client";

import NextDynamic from "next/dynamic";

// `ssr: false` requires a Client Component boundary, so this wrapper exists
// purely to let the player profile page (a Server Component) lazy-load it.
export const ScoreHistoryChart = NextDynamic(
  () => import("@/components/player/score-history-chart").then((m) => m.ScoreHistoryChart),
  {
    ssr: false,
    loading: () => <div className="h-[200px] animate-pulse rounded-md bg-charcoal/5" />,
  }
);
