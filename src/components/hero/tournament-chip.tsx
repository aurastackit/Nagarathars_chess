import Link from "next/link";
import { Countdown } from "@/components/countdown";
import { LinkButton } from "@/components/ui";
import { registerPath } from "@/lib/registration-flow";
import { formatDate } from "@/lib/format";
import { capitalizeWords } from "@/lib/text";
import type { TimeLeft } from "@/lib/countdown-format";

type ChipTournament = {
  slug: string;
  title: string;
  city: string;
  startDate: Date;
  registrationDeadline: Date;
};

/**
 * Compact card anchored to the Live Board's corner — replaces the old
 * standalone countdown card. Falls back to a "nothing open yet" state with
 * a contact link when there's no next tournament.
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
  return (
    <div
      className={`flex w-full items-center gap-4 rounded-lg border border-white/15 bg-charcoal/95 px-4 py-3 shadow-md ${className}`}
    >
      {tournament && timeLeft ? (
        <>
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-gold">
              <span className="h-1.5 w-1.5 rounded-full bg-gold" aria-hidden="true" />
              Next tournament
            </p>
            <p className="mt-0.5 truncate text-base font-semibold leading-snug text-white">
              {tournament.title}
            </p>
            <p className="mt-0.5 truncate text-xs text-white/65">
              {formatDate(tournament.startDate)} &middot; {capitalizeWords(tournament.city)}
            </p>
            <p className="mt-0.5 text-xs">
              <Countdown
                target={tournament.registrationDeadline.toISOString()}
                initialTimeLeft={timeLeft}
                compact
              />
            </p>
          </div>
          <LinkButton href={registerPath(tournament.slug)} size="sm" surface="dark" className="flex-none">
            Register
          </LinkButton>
        </>
      ) : (
        <>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-gold">
              Next tournament
            </p>
            <p className="mt-0.5 text-sm font-medium text-white">
              New tournaments announced soon.
            </p>
          </div>
          <Link
            href="/contact"
            className="flex-none text-sm font-semibold text-gold hover:underline"
          >
            Get notified &rarr;
          </Link>
        </>
      )}
    </div>
  );
}
