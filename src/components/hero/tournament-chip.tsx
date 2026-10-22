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
 * Compact card under the Live Board — replaces the old standalone countdown
 * card. Falls back to a "nothing open yet" state with a contact link when
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
  return (
    <div
      className={`flex w-full items-center gap-4 rounded-lg border border-border bg-card px-4 py-3 shadow-md ${className}`}
    >
      {tournament && timeLeft ? (
        <>
          <div className="min-w-0 flex-1">
            <p
              className={
                "flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-gold-ink"
              }
            >
              <span className="h-1.5 w-1.5 rounded-full bg-gold" aria-hidden="true" />
              Next tournament
            </p>
            <p className={"mt-0.5 text-pretty text-base font-semibold leading-snug text-charcoal"}>
              {tournament.title}
            </p>
            <p className={"mt-0.5 truncate text-xs text-muted"}>
              {formatDate(tournament.startDate)} &middot; {capitalizeWords(tournament.city)}
            </p>
            <p className={"mt-0.5 text-xs text-charcoal"}>
              <Countdown
                target={tournament.registrationDeadline.toISOString()}
                initialTimeLeft={timeLeft}
                compact
              />
            </p>
          </div>
          <LinkButton href={registerPath(tournament.slug)} size="sm" className="flex-none">
            Register
          </LinkButton>
        </>
      ) : (
        <>
          <div className="min-w-0 flex-1">
            <p className={"text-[11px] font-semibold uppercase tracking-wider text-gold-ink"}>
              Next tournament
            </p>
            <p className={"mt-0.5 text-sm font-medium text-charcoal"}>
              New tournaments announced soon.
            </p>
          </div>
          <Link
            href="/contact"
            className={"flex-none text-sm font-semibold text-gold-ink hover:underline"}
          >
            Get notified &rarr;
          </Link>
        </>
      )}
    </div>
  );
}
