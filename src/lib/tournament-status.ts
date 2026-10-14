import { endOfDayIST } from "@/lib/datetime";

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
  if (tournament.endDate < now) return "completed";
  const deadline = endOfDayIST(tournament.registrationDeadline);
  if (deadline < now) return "closed";
  if (deadline.getTime() - now.getTime() <= CLOSING_SOON_WINDOW_MS) {
    return "closing-soon";
  }
  return "open";
}

/**
 * Whether a visitor can register right now: the tournament must be published
 * (admin visibility) and not yet closed or finished (dates).
 */
export function canRegisterFor(
  tournament: { status: string; endDate: Date; registrationDeadline: Date },
  now: Date = new Date()
) {
  if (tournament.status !== "published") return false;
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
