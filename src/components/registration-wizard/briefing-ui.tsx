import type { ReactNode } from "react";

// Shared look for the blocks on the registration notice page (used by the page
// itself and by the accept-and-continue part, which is a client component).
export const PANEL = "rounded-lg border border-border bg-card p-4 shadow-sm sm:p-5";
export const PANEL_TITLE = "text-base font-semibold text-charcoal";
export const BULLETS = "mt-3 list-disc space-y-1.5 pl-5 text-sm text-foreground/80";

export function B({ children }: { children: ReactNode }) {
  return <strong className="font-semibold text-foreground">{children}</strong>;
}
