"use client";

import NextDynamic from "next/dynamic";

// recharts is a sizeable dependency — defer it out of the initial bundle.
// `ssr: false` requires a Client Component boundary, so this wrapper exists
// purely to let the admin dashboard (a Server Component) lazy-load it.
const chartLoading = <div className="h-[180px] animate-pulse rounded-md bg-charcoal/5" />;

export const CategoryBreakdownChart = NextDynamic(
  () => import("@/components/admin/charts").then((m) => m.CategoryBreakdownChart),
  {
    ssr: false,
    loading: () => chartLoading,
  }
);

export const RegistrationsOverTimeChart = NextDynamic(
  () => import("@/components/admin/charts").then((m) => m.RegistrationsOverTimeChart),
  {
    ssr: false,
    loading: () => chartLoading,
  }
);
