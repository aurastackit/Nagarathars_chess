/** Emails are stored and compared lower-cased and trimmed. */
export const normalizeEmail = (email: string) => email.trim().toLowerCase();

/** A name with single spaces, as shown. */
export const tidyName = (name: string) => name.replace(/\s+/g, " ").trim();

/**
 * Who a player is: the email they registered with, their name (ignoring
 * capitals and extra spaces) and their year of birth — so a parent's email can
 * hold several children, each with their own profile, results and pairings.
 * Matches the backfill in prisma/migrations/20261023180000_player_identity_step1.
 */
export function playerKey(p: { email: string; fullName: string; dob?: Date | null }) {
  return {
    email: normalizeEmail(p.email),
    nameKey: tidyName(p.fullName).toLowerCase(),
    birthYear: p.dob ? p.dob.getUTCFullYear() : null,
  };
}
