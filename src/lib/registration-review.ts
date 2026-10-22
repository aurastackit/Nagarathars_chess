import { ageByYear, ageCategoryLabel, naturalAgeCategory } from "@/lib/age-category";
import { canTransition, normalizeStatus, type RegistrationStatus } from "@/lib/registration-status";

/**
 * Pure helpers for the admin registration page: which actions to offer, the
 * reason templates, the age check and the pending queue. No server imports, so
 * the client components can use them too.
 */

export type ReviewAction = "approve" | "reject" | "changes" | "reopen" | "withdraw";

export const ACTION_TARGET: Record<ReviewAction, RegistrationStatus> = {
  approve: "confirmed",
  reject: "rejected",
  changes: "changes_requested",
  reopen: "pending",
  withdraw: "withdrawn",
};

/** The status changes an admin may make from `status`, in button order (same rules the server enforces). */
export function adminActionsFor(status: string): ReviewAction[] {
  const order: ReviewAction[] = ["approve", "changes", "reject", "reopen", "withdraw"];
  return order.filter((a) => canTransition(status, ACTION_TARGET[a], "admin"));
}

/** Button labels; approving a rejected or changes-requested application re-opens it. */
export function actionLabel(action: ReviewAction, status: string) {
  const from = normalizeStatus(status);
  switch (action) {
    case "approve":
      return from === "pending" ? "Approve" : "Re-open and approve";
    case "reject":
      return "Reject";
    case "changes":
      return "Request changes";
    case "reopen":
      return "Re-open (back to pending)";
    case "withdraw":
      return "Withdraw";
  }
}

/** Actions that need a reason the player will read. Withdraw takes an optional one. */
export const REASON_REQUIRED: ReviewAction[] = ["reject", "changes"];
export const MIN_REASON = 5;
export const MAX_REASON = 500;

/** Ready-made reasons; picking one fills the box, and the admin can still edit it. */
export const REASON_TEMPLATES: Record<"reject" | "changes" | "withdraw", string[]> = {
  changes: [
    "Please upload a clear, front-facing passport photo (no sunglasses or caps).",
    "The age proof is hard to read. Please upload a clearer copy showing the name and year of birth.",
    "The year of birth on the form doesn't match the age proof. Please correct it.",
    "Please complete the family details (father's and mother's grandparents).",
    "Please add your kovil and pirivu.",
  ],
  reject: [
    "This is a duplicate of another registration for the same player.",
    "The player isn't eligible for this tournament's age categories.",
    "We couldn't verify the details provided, and no update was received.",
    "The tournament is full.",
  ],
  withdraw: [
    "Withdrawn at the player's request.",
    "The player can no longer attend.",
    "Duplicate registration — the other one is kept.",
  ],
};

/**
 * Whether the stored category is the one the year of birth gives for this
 * tournament (it can drift if the event date moved into a new year, or for rows
 * created before categories were automatic).
 */
export function ageCheck(dob: Date | null, tournamentStart: Date, ageCategory: string | null) {
  if (!dob) return null;
  const birthYear = dob.getUTCFullYear();
  const age = ageByYear(birthYear, tournamentStart);
  const expected = naturalAgeCategory(age);
  return {
    birthYear,
    age,
    expected,
    matches: expected === ageCategory,
    message:
      expected === ageCategory
        ? null
        : `Born ${birthYear}, so ${age} in ${tournamentStart.getUTCFullYear()}: that's ${ageCategoryLabel(expected)}, but the registration is ${ageCategoryLabel(ageCategory)}.`,
  };
}

type QueueItem = { id: string; registeredAt: Date };
const before = (a: QueueItem, b: QueueItem) =>
  a.registeredAt.getTime() < b.registeredAt.getTime() ||
  (a.registeredAt.getTime() === b.registeredAt.getTime() && a.id < b.id);

/**
 * The pending applications just before and after `current` in submission order
 * (oldest first). Works whether or not `current` is itself still pending, so
 * after approving one, "Next" carries on down the queue.
 */
export function pendingNeighbours(pending: QueueItem[], current: QueueItem) {
  const sorted = [...pending].sort((a, b) => (before(a, b) ? -1 : before(b, a) ? 1 : 0));
  const others = sorted.filter((p) => p.id !== current.id);
  const prev = others.filter((p) => before(p, current)).at(-1) ?? null;
  const next = others.find((p) => before(current, p)) ?? null;
  const index = sorted.findIndex((p) => p.id === current.id);
  return {
    prevId: prev?.id ?? null,
    nextId: next?.id ?? null,
    position: index >= 0 ? index + 1 : null,
    total: sorted.length,
  };
}
