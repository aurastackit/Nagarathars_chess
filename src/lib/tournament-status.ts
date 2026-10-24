import { endOfDayIST } from "@/lib/datetime";
import { SEAT_HOLDING_STATUSES } from "@/lib/registration-status";

// Which registrations take a seat is defined with the status rules.
export { SEAT_HOLDING_STATUSES };

/** Prisma `_count` select for seats taken — use wherever "N / max seats" is shown or enforced. */
export const SEATS_TAKEN_COUNT = {
  _count: {
    select: { registrations: { where: { status: { in: SEAT_HOLDING_STATUSES } } } },
  },
} as const;

export type TournamentStatus = "open" | "closing-soon" | "closed" | "completed";

const CLOSING_SOON_WINDOW_MS = 72 * 60 * 60 * 1000;

/**
 * Registration/event status derived purely from dates — independent of the
 * admin `status` field (draft/published/etc), which governs visibility.
 */
export function getTournamentStatus(
  tournament: { endDate: Date; registrationDeadline: Date },
  now: Date = new Date()
): TournamentStatus {
  // endDate is midnight UTC of the last day: the event is on until that day ends in India.
  if (endOfDayIST(tournament.endDate) < now) return "completed";
  const deadline = endOfDayIST(tournament.registrationDeadline);
  if (deadline < now) return "closed";
  if (deadline.getTime() - now.getTime() <= CLOSING_SOON_WINDOW_MS) {
    return "closing-soon";
  }
  return "open";
}

/**
 * Admin visibility (the `status` field). Listed tournaments appear on the
 * public site: home, /tournaments, the sitemap, the gallery. "unlisted" is the
 * test mode: it works by direct link (page, registration) like a published
 * tournament, but is never listed, announced or indexed.
 */
export const LISTED_STATUSES = ["published", "closed", "completed"];

export const isUnlisted = (status: string) => status === "unlisted";

/** Statuses a visitor may register for (dates permitting). */
export const isRegistrableStatus = (status: string) => status === "published" || isUnlisted(status);

/**
 * Whether a visitor can register right now: the tournament must be published
 * or unlisted (admin visibility) and not yet closed or finished (dates).
 */
export function canRegisterFor(
  tournament: { status: string; endDate: Date; registrationDeadline: Date },
  now: Date = new Date()
) {
  if (!isRegistrableStatus(tournament.status)) return false;
  const status = getTournamentStatus(tournament, now);
  return status !== "closed" && status !== "completed";
}

export const TOURNAMENT_STATUS_LABEL: Record<TournamentStatus, string> = {
  open: "Open",
  "closing-soon": "Closing soon",
  closed: "Closed",
  completed: "Completed",
};

/** Display label for a tournament's `format` field ("classical" | "rapid" | "blitz"). */
export const TOURNAMENT_FORMAT_LABEL: Record<string, string> = {
  classical: "Classical",
  rapid: "Rapid",
  blitz: "Blitz",
};
