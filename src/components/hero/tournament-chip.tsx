import Link from "next/link";
import { Countdown } from "@/components/countdown";
import { LinkButton } from "@/components/ui";
import { registerPath } from "@/lib/registration-flow";
import { capitalizeWords } from "@/lib/text";
import type { TimeLeft } from "@/lib/countdown-format";

type ChipTournament = {
  slug: string;
  title: string;
  venue: string;
  city: string;
  startDate: Date;
  registrationDeadline: Date;
};

const MONTH = new Intl.DateTimeFormat("en-IN", { month: "short", timeZone: "UTC" });

/** Calendar tile: month in a gold band, the day big in Playfair, the year small. Dates are midnight UTC. */
function CalendarTile({ date }: { date: Date }) {
  return (
    <div
      className="w-16 flex-none overflow-hidden rounded-lg border border-border bg-white text-center shadow-sm sm:w-[4.5rem]"
      aria-hidden="true"
    >
      <div className="bg-gold py-0.5 text-[11px] font-bold uppercase tracking-widest text-charcoal">
        {MONTH.format(date)}
      </div>
      <div className="font-display text-3xl font-bold leading-none text-charcoal sm:text-4xl">
        <span className="block pt-1.5">{date.getUTCDate()}</span>
      </div>
      <div className="pb-1.5 pt-0.5 text-[11px] font-medium text-muted">
        {date.getUTCFullYear()}
      </div>
    </div>
  );
}

/**
 * Tournament card under the Live Board: calendar tile, title, venue, a
 * Days / Hrs / Min countdown to the registration deadline and the Register
 * button. Falls back to a "nothing open yet" state with a contact link when
 * there's no next tournament.
 */
export function TournamentChip({
  tournament,
  timeLeft,
  className = "",
}: {
  tournament: ChipTournament | null;
  timeLeft: TimeLeft | null;
  className?: string;
}) {
  if (!tournament || !timeLeft) {
    return (
      <div
        className={`flex w-full items-center gap-4 rounded-xl border border-border bg-card px-4 py-3 shadow-md ${className}`}
      >
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-gold-ink">
            Next tournament
          </p>
          <p className="mt-0.5 text-sm font-medium text-charcoal">
            New tournaments announced soon.
          </p>
        </div>
        <Link
          href="/contact"
          className="flex-none text-sm font-semibold text-gold-ink hover:underline"
        >
          Get notified &rarr;
        </Link>
      </div>
    );
  }

  return (
    <div
      className={`grid w-full grid-cols-[auto_1fr] gap-x-4 gap-y-4 rounded-xl border border-border bg-card p-4 shadow-md ${className}`}
    >
      <CalendarTile date={tournament.startDate} />
      <div className="min-w-0 self-center">
        <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-gold-ink">
          <span className="h-1.5 w-1.5 rounded-full bg-gold" aria-hidden="true" />
          Next tournament
        </p>
        <p className="mt-0.5 text-pretty text-base font-semibold leading-snug text-charcoal">
          {tournament.title}
        </p>
        <p className="mt-0.5 text-xs text-muted">
          {capitalizeWords(tournament.venue)} &middot; {capitalizeWords(tournament.city)}
        </p>
      </div>
      <div className="col-span-2 sm:col-span-1 sm:col-start-2 sm:-mt-1">
        <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted">
          Registration closes in
        </p>
        <Countdown
          target={tournament.registrationDeadline.toISOString()}
          initialTimeLeft={timeLeft}
          boxes
        />
        <LinkButton href={registerPath(tournament.slug)} size="sm" className="mt-4 w-full">
          Register
        </LinkButton>
      </div>
    </div>
  );
}
