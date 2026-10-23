/**
 * How long age-proof documents are kept: they're only needed to check a
 * player's age category, so they're deleted this many days after the
 * tournament ends. AGE_PROOF_RETENTION_DAYS overrides the default.
 */
export const DEFAULT_AGE_PROOF_RETENTION_DAYS = 90;
const DAY_MS = 24 * 60 * 60 * 1000;

export function ageProofRetentionDays(
  env: string | undefined = process.env.AGE_PROOF_RETENTION_DAYS
) {
  const n = Number(env);
  return Number.isInteger(n) && n >= 1 && n <= 3650 ? n : DEFAULT_AGE_PROOF_RETENTION_DAYS;
}

/** When a tournament's age proofs are due for deletion. */
export function ageProofDeleteOn(tournamentEnd: Date, days: number) {
  return new Date(tournamentEnd.getTime() + days * DAY_MS);
}

export function isAgeProofDue(tournamentEnd: Date, days: number, now = new Date()) {
  return ageProofDeleteOn(tournamentEnd, days) <= now;
}

/** Tournaments that ended before this moment have age proofs due now. */
export function dueCutoff(days: number, now = new Date()) {
  return new Date(now.getTime() - days * DAY_MS);
}
