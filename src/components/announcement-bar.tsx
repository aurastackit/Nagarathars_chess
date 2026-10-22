"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ClockIcon } from "@/components/icons/misc";
import { formatCompact } from "@/lib/countdown-format";
import { endOfDayIST } from "@/lib/datetime";
import { registerPath } from "@/lib/registration-flow";
import type { NextTournamentState } from "@/lib/use-next-tournament";

// One fixed-height line in every state (loading, countdown, nothing open), so
// the page never shifts when the data arrives.
const BAR = "flex h-8 items-center justify-center gap-2 px-4 text-xs font-semibold sm:text-sm";

/**
 * The gold bar above the header. The tournament comes from the browser
 * (useNextTournament), never from the cached HTML, so it's always current.
 */
export function AnnouncementBar({ tournament }: { tournament: NextTournamentState }) {
  const [label, setLabel] = useState<string | null>(null);
  const deadline = tournament?.registrationDeadline;

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
      {tournament === undefined || (tournament && !label) ? (
        <div className={BAR} aria-hidden="true" />
      ) : tournament ? (
        <Link href={registerPath(tournament.slug)} className={`mx-auto max-w-6xl ${BAR}`}>
          <ClockIcon className="h-3.5 w-3.5 flex-none" aria-hidden="true" />
          <span className="truncate">
            <span className="hidden sm:inline">Registration for {tournament.title} closes in </span>
            <span className="sm:hidden">Registration closes in </span>
            {label}
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
