import { todayIST } from "@/lib/datetime";
import { getTournamentStatus } from "@/lib/tournament-status";

type StatsTournament = { city: string; startDate: Date; endDate: Date; registrationDeadline: Date };

/**
 * The figures on the home and About pages, from the published tournaments:
 * hosted = started today or earlier (IST), completed = ended, cities = the
 * distinct cities of the hosted ones.
 */
export function getTournamentStats(tournaments: StatsTournament[], now = new Date()) {
  const today = todayIST(now);
  const hosted = tournaments.filter((t) => t.startDate <= today);
  return {
    hosted: hosted.length,
    cities: new Set(hosted.map((t) => t.city.trim().toLowerCase())).size,
    completed: tournaments.filter((t) => getTournamentStatus(t, now) === "completed").length,
  };
}
