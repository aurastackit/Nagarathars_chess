import type { ComponentProps } from "react";
import { LinkButton } from "@/components/ui";
import { CLASSES_ENABLED } from "@/lib/features";
import { LiveBoard } from "./live-board";
import { TournamentChip } from "./tournament-chip";

/**
 * Home page hero: headline and calls to action beside the Live Board, on warm
 * ivory with a faint Athangudi tile pattern and a soft green glow behind the
 * board (the board's own dark-square colour).
 */
export function HomeHero({
  nextTournament,
  timeLeft,
}: {
  nextTournament: ComponentProps<typeof TournamentChip>["tournament"];
  timeLeft: ComponentProps<typeof TournamentChip>["timeLeft"];
}) {
  return (
    <section className={"hero-ivory relative overflow-hidden text-charcoal"}>
      <svg className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true">
        <defs>
          <pattern id="athangudi-tile" width="64" height="64" patternUnits="userSpaceOnUse">
            <path
              d="M32 4 60 32 32 60 4 32Z"
              fill="none"
              stroke="var(--gold-ink)"
              strokeWidth="1"
            />
            <path
              d="M32 18 46 32 32 46 18 32Z"
              fill="none"
              stroke="var(--gold-ink)"
              strokeWidth="1"
            />
            <circle cx="32" cy="32" r="1.6" fill="var(--gold-ink)" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#athangudi-tile)" opacity="0.05" />
      </svg>

      <div className="relative mx-auto max-w-6xl px-4 pb-[clamp(2.5rem,6svh,4rem)] pt-[clamp(1.5rem,4svh,2.5rem)]">
        <div className="grid gap-10 lg:grid-cols-12 lg:items-start lg:gap-8">
          <div className="flex flex-col items-start gap-5 lg:col-span-6">
            {/* Not animated: it's the page's LCP element, and an element that starts at
                opacity 0 isn't counted until much later. The rest still fades up. */}
            <h1
              className="max-w-[34rem] font-display font-bold tracking-tight"
              style={{
                fontSize: "clamp(2.25rem, 1.5rem + 2.4vw, 3.5rem)",
                lineHeight: 1.08,
              }}
            >
              {CLASSES_ENABLED
                ? "Chess tournaments and coaching, built for your community."
                : "Chess tournaments built for your community."}
            </h1>
            <p
              className={"animate-fade-up max-w-[52ch] text-lg text-charcoal/75"}
              style={{ animationDelay: "160ms" }}
            >
              {CLASSES_ENABLED
                ? "Register for upcoming local tournaments, join online chess classes, and represent your community — no rating required to get started."
                : "Register for upcoming local tournaments and represent your community — no rating required to get started. Online classes are coming soon."}
            </p>
            <div
              className="animate-fade-up flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:gap-4"
              style={{ animationDelay: "240ms" }}
            >
              <LinkButton href="/tournaments" className="w-full py-3 sm:w-auto">
                View Tournaments
              </LinkButton>
              <LinkButton
                href={CLASSES_ENABLED ? "/classes" : "/gallery"}
                variant="outline"
                className="w-full py-3 sm:w-auto"
              >
                {CLASSES_ENABLED ? "Explore Classes" : "See our gallery"}
              </LinkButton>
            </div>
            <div
              className={
                "animate-fade-up flex flex-wrap gap-x-6 gap-y-2 pt-1 text-sm text-charcoal/75"
              }
              style={{ animationDelay: "300ms" }}
            >
              {["No FIDE rating needed", "Free entry to most events", "Every age welcome"].map(
                (perk) => (
                  <span key={perk} className="inline-flex items-center gap-1.5">
                    <span className="text-gold-ink" aria-hidden="true">
                      ✓
                    </span>{" "}
                    {perk}
                  </span>
                )
              )}
            </div>
          </div>

          <div className="animate-fade-up lg:col-span-6" style={{ animationDelay: "200ms" }}>
            <div className="mx-auto w-full max-w-[420px] lg:max-w-[28rem]">
              {/* Board width tracks viewport height (svh) so board + card fit one
                  screen on laptops (1366×768 and up), capped at 500px on big ones. */}
              <div className="relative mx-auto w-full lg:max-w-[clamp(300px,calc(100svh-430px),500px)]">
                <div
                  className="hero-glow pointer-events-none absolute -inset-[22%]"
                  aria-hidden="true"
                />
                <LiveBoard className="relative w-full" />
              </div>
              {/* Clear of the board, with real space below it. */}
              <TournamentChip
                tournament={nextTournament}
                timeLeft={timeLeft}
                className="relative z-10 mt-6"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
