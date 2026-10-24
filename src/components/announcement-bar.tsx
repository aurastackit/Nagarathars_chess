"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ClockIcon } from "@/components/icons/misc";
import { formatCompact } from "@/lib/countdown-format";
import { endOfDayIST } from "@/lib/datetime";
import { registerPath } from "@/lib/registration-flow";
import { capitalizeWords } from "@/lib/text";
import type { NextTournamentInfo, NextTournamentState } from "@/lib/use-next-tournament";

// One fixed-height line in every state (loading, countdown, nothing open), so
// the page never shifts when the data arrives.
const BAR = "flex h-8 items-center justify-center gap-2 px-4 text-xs font-semibold sm:text-sm";

// Dates are stored as midnight UTC: format them in UTC so every viewer sees the same day.
const START_DATE = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

/** The ticker's items, in order. */
function tickerItems(t: NextTournamentInfo, countdown: string) {
  return [
    `Registration closes in ${countdown}`,
    t.title,
    `${START_DATE.format(new Date(t.startDate))} · ${capitalizeWords(t.venue)}, ${capitalizeWords(t.city)}`,
    t.entryFee > 0 ? `Entry fee ₹${t.entryFee}` : "Free entry",
    "Register now →",
  ];
}

/** One run of the items, each followed by a small diamond divider. */
function TickerRun({ items }: { items: string[] }) {
  return (
    <>
      {items.map((item, i) => (
        <span key={i} className="flex flex-none items-center">
          <span className="whitespace-nowrap">{item}</span>
          <span className="mx-5 h-1.5 w-1.5 rotate-45 bg-gold-ink" aria-hidden="true" />
        </span>
      ))}
    </>
  );
}

/**
 * The gold bar above the header. The tournament comes from the browser
 * (useNextTournament), never from the cached HTML, so it's always current.
 */
export function AnnouncementBar({
  tournament,
  readOnly = false,
}: {
  tournament: NextTournamentState;
  /** Read-only mode (lib/read-only): forms are paused, so say so instead of counting down. */
  readOnly?: boolean;
}) {
  const [label, setLabel] = useState<string | null>(null);
  const deadline = tournament?.registrationDeadline;
  const items = tournament && label ? tickerItems(tournament, label) : [];

  useEffect(() => {
    if (!deadline) return;
    const target = endOfDayIST(deadline).getTime();
    function update() {
      setLabel(formatCompact(target - Date.now()));
    }
    update();
    const id = setInterval(update, 30000);
    return () => clearInterval(id);
  }, [deadline]);

  return (
    <div className="bg-gold text-charcoal">
      {readOnly ? (
        <p role="status" className={`mx-auto max-w-6xl ${BAR}`}>
          <span className="truncate">
            Site upgrade in progress — registration and forms are paused for about 15 minutes
          </span>
        </p>
      ) : tournament === undefined || (tournament && !label) ? (
        <div className={BAR} aria-hidden="true" />
      ) : tournament ? (
        <Link
          href={registerPath(tournament.slug)}
          aria-label={`Registration for ${tournament.title} closes in ${label}. Register now.`}
          className="ticker block"
        >
          {/* A running ticker (paused on hover and keyboard focus); with reduced
              motion, the single static line below is shown instead. Screen readers
              get the aria-label above, not the repeated items. */}
          <div
            aria-hidden="true"
            className="flex h-8 items-center overflow-hidden text-xs font-semibold motion-reduce:hidden sm:text-sm"
            style={{
              maskImage: "linear-gradient(to right, transparent, #000 5%, #000 95%, transparent)",
              WebkitMaskImage:
                "linear-gradient(to right, transparent, #000 5%, #000 95%, transparent)",
            }}
          >
            <div className="ticker-track flex w-max flex-none items-center">
              {[0, 1].map((half) => (
                <div key={half} className="flex flex-none items-center">
                  <TickerRun items={items} />
                  <TickerRun items={items} />
                  <TickerRun items={items} />
                </div>
              ))}
            </div>
          </div>
          <span aria-hidden="true" className={`mx-auto hidden max-w-6xl motion-reduce:flex ${BAR}`}>
            <ClockIcon className="h-3.5 w-3.5 flex-none" aria-hidden="true" />
            <span className="truncate">
              <span className="hidden sm:inline">
                Registration for {tournament.title} closes in{" "}
              </span>
              <span className="sm:hidden">Registration closes in </span>
              {label}
            </span>
          </span>
        </Link>
      ) : (
        <Link href="/tournaments" className={`mx-auto max-w-6xl ${BAR}`}>
          <span className="truncate">
            Free chess tournaments for every age — see what&apos;s coming up
          </span>
        </Link>
      )}
    </div>
  );
}
