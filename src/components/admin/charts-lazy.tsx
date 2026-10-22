"use client";

import NextDynamic from "next/dynamic";

// recharts is a sizeable dependency — defer it out of the initial bundle.
// `ssr: false` requires a Client Component boundary, so this wrapper exists
// purely to let the admin dashboard (a Server Component) lazy-load it.
export const RegistrationsVsEditsChart = NextDynamic(
  () => import("@/components/admin/charts").then((m) => m.RegistrationsVsEditsChart),
  {
    ssr: false,
    loading: () => <div className="h-[240px] animate-pulse rounded-md bg-charcoal/5" />,
  }
);
