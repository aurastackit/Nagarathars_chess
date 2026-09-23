"use client";

import NextDynamic from "next/dynamic";

// Below the fold and pulls in react-hook-form + zod + 6 step components —
// no need to ship it in the initial bundle for a page that's mostly static
// tournament info. `ssr: false` requires a Client Component boundary, so
// this wrapper exists purely to let the tournament page (a Server
// Component) lazy-load it.
export const RegistrationWizard = NextDynamic(
  () =>
    import("@/components/registration-wizard/registration-wizard").then(
      (m) => m.RegistrationWizard
    ),
  {
    ssr: false,
    loading: () => <div className="h-64 animate-pulse rounded-lg bg-charcoal/5" />,
  }
);
