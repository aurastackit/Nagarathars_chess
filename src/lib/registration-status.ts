/**
 * Registration statuses and the transitions the server allows. Every status
 * change goes through assertTransition, whoever asks for it (admin page,
 * player self-service, API), so the rules live in one place.
 *
 *   pending                       → confirmed | rejected | changes_requested   (admin)
 *   rejected | changes_requested  → pending     (player edits and resubmits)
 *                                 → confirmed   (admin re-opens)
 *   confirmed                     → pending     (admin "Re-open" only)
 *   changes_requested             → rejected    (system: no resubmission within 7 days)
 *   any (except withdrawn)        → withdrawn   (player or admin)
 *   withdrawn                     → nothing (final)
 */
export const REGISTRATION_STATUSES = [
  "pending",
  "confirmed",
  "rejected",
  "changes_requested",
  "withdrawn",
] as const;

export type RegistrationStatus = (typeof REGISTRATION_STATUSES)[number];
export type StatusActor = "admin" | "player" | "system";

/**
 * Statuses that hold a seat in the tournament. changes_requested keeps the
 * seat while the player fixes their application — for CHANGES_REQUESTED_DAYS.
 */
export const SEAT_HOLDING_STATUSES: RegistrationStatus[] = [
  "pending",
  "confirmed",
  "changes_requested",
];

/** How long a player has to resubmit after changes are requested, before it's rejected automatically. */
export const CHANGES_REQUESTED_DAYS = 7;
export const CHANGES_EXPIRED_REASON = "No update received within 7 days";

/** "Fix by" deadline for a changes request made at `requestedAt`. */
export function fixByDate(requestedAt: Date) {
  return new Date(requestedAt.getTime() + CHANGES_REQUESTED_DAYS * 24 * 60 * 60 * 1000);
}

const BOTH: StatusActor[] = ["admin", "player"];

const RULES: Record<RegistrationStatus, Partial<Record<RegistrationStatus, StatusActor[]>>> = {
  pending: {
    confirmed: ["admin"],
    rejected: ["admin"],
    changes_requested: ["admin"],
    withdrawn: BOTH,
  },
  rejected: { pending: ["player"], confirmed: ["admin"], withdrawn: BOTH },
  changes_requested: {
    pending: ["player"],
    confirmed: ["admin"],
    rejected: ["system"],
    withdrawn: BOTH,
  },
  confirmed: { pending: ["admin"], withdrawn: BOTH },
  withdrawn: {},
};

/** "registered" is the legacy name for confirmed (migrated, but old rows may still be read mid-deploy). */
export function normalizeStatus(status: string): RegistrationStatus {
  if (status === "registered") return "confirmed";
  return (REGISTRATION_STATUSES as readonly string[]).includes(status)
    ? (status as RegistrationStatus)
    : "pending";
}

export function canTransition(from: string, to: RegistrationStatus, actor: StatusActor) {
  return RULES[normalizeStatus(from)][to]?.includes(actor) ?? false;
}

export class InvalidTransitionError extends Error {
  constructor(from: string, to: RegistrationStatus, actor: StatusActor) {
    super(`A registration can't go from "${normalizeStatus(from)}" to "${to}" (${actor})`);
    this.name = "InvalidTransitionError";
  }
}

export function assertTransition(from: string, to: RegistrationStatus, actor: StatusActor) {
  if (!canTransition(from, to, actor)) throw new InvalidTransitionError(from, to, actor);
}

/** The RegistrationEvent type to record for an allowed transition. */
export function eventTypeFor(to: RegistrationStatus, actor: StatusActor) {
  if (to === "pending") return actor === "player" ? "edited" : "reopened";
  return to;
}
