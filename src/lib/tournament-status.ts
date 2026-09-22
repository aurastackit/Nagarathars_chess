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
  if (tournament.registrationDeadline < now) return "closed";
  if (tournament.registrationDeadline.getTime() - now.getTime() <= CLOSING_SOON_WINDOW_MS) {
    return "closing-soon";
  }
  return "open";
}

export const TOURNAMENT_STATUS_LABEL: Record<TournamentStatus, string> = {
  open: "Open",
  "closing-soon": "Closing soon",
  closed: "Closed",
  completed: "Completed",
};
