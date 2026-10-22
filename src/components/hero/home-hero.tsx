import type { ComponentProps } from "react";
import { LinkButton } from "@/components/ui";
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
      {/* Fine grain over the gradients so their gentle steps never show as bands. */}
      <div className="hero-grain pointer-events-none absolute inset-0" aria-hidden="true" />

      <div className="relative mx-auto max-w-6xl px-4 pb-[clamp(3.5rem,9svh,5.5rem)] pt-[clamp(2.5rem,7svh,4.5rem)]">
        <div className="grid gap-10 lg:grid-cols-12 lg:items-center lg:gap-8">
          <div className="flex flex-col items-start gap-5 lg:col-span-6">
            <h1
              className="animate-fade-up max-w-[34rem] font-display font-bold tracking-tight"
              style={{
                fontSize: "clamp(2.25rem, 1.5rem + 2.4vw, 3.5rem)",
                lineHeight: 1.08,
                animationDelay: "80ms",
              }}
            >
              Chess tournaments and coaching, built for your community.
            </h1>
            <p
              className={"animate-fade-up max-w-[52ch] text-lg text-charcoal/75"}
              style={{ animationDelay: "160ms" }}
            >
              Register for upcoming local tournaments, join online chess classes, and represent your
              community — no rating required to get started.
            </p>
            <div
              className="animate-fade-up flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:gap-4"
              style={{ animationDelay: "240ms" }}
            >
              <LinkButton href="/tournaments" className="w-full py-3 sm:w-auto">
                View Tournaments
              </LinkButton>
              <LinkButton href="/classes" variant="outline" className="w-full py-3 sm:w-auto">
                Explore Classes
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
            {/* Board width tracks viewport height (svh) so board + chip stay above
                the fold on short laptop screens, never dropping below 480px. */}
            <div className="relative mx-auto w-full max-w-[420px] lg:max-w-[clamp(480px,calc(100svh-280px),520px)]">
              <div
                className="hero-glow pointer-events-none absolute -inset-[22%]"
                aria-hidden="true"
              />
              <LiveBoard className="relative w-full" />
              {/* Below the board, never over a square: on large screens it tucks
                  8px into the frame's bottom edge, under the file letters. */}
              <TournamentChip
                tournament={nextTournament}
                timeLeft={timeLeft}
                className="relative z-10 mt-4 lg:-ml-6 lg:-mt-2 lg:w-[26rem]"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
