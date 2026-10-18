import type { ReactNode } from "react";

/**
 * The home page's illustrated card (How It Works, Tournament Formats, Why
 * Chess): vignette panel, a gold kicker line (step number, time control…),
 * title and body. Plain server HTML — ScrollMotion (one client component per
 * page) plays the vignette once when it scrolls into view and replays it on
 * hover or focus. Server HTML shows each vignette's finished scene, which is
 * also what prefers-reduced-motion and no-JS visitors keep.
 */
export function VignetteCard({
  kicker,
  title,
  body,
  vignette,
}: {
  kicker: string;
  title: string;
  body: string;
  vignette: ReactNode;
}) {
  return (
    <article
      data-vignette-card
      className="flex h-full flex-col overflow-hidden rounded-lg border border-border bg-card shadow-sm"
    >
      <div className="vignette-panel aspect-[3/2] w-full border-b border-border">{vignette}</div>
      <div className="flex flex-1 flex-col p-6">
        <p className="text-sm font-bold tabular-nums tracking-wider text-gold-ink">{kicker}</p>
        <h3 className="h3 mt-1 text-foreground">{title}</h3>
        <p className="text-small mt-2 text-muted">{body}</p>
      </div>
    </article>
  );
}
