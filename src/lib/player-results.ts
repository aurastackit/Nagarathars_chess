import { prisma } from "@/lib/prisma";
import { computeStandings, categoryWinners, type Standing } from "@/lib/standings";

export type PlayerTournamentResult = {
  tournament: { id: string; slug: string; title: string; startDate: Date; venue: string; city: string };
  ageCategory: string | null;
  standing: Standing | null; // null when results aren't published yet
  totalPlayers: number;
  isOverallWinner: boolean;
  isCategoryWinner: boolean;
};

/** Every tournament a player has a confirmed registration in, with their standing where results are published. */
export async function getPlayerTournamentResults(playerId: string): Promise<PlayerTournamentResult[]> {
  const registrations = await prisma.registration.findMany({
    where: { playerId, status: { in: ["confirmed", "registered"] } },
    include: { tournament: true },
    orderBy: { tournament: { startDate: "desc" } },
  });

  const results: PlayerTournamentResult[] = [];
  for (const reg of registrations) {
    if (!reg.tournament.resultsPublished) {
      results.push({
        tournament: reg.tournament,
        ageCategory: reg.ageCategory,
        standing: null,
        totalPlayers: 0,
        isOverallWinner: false,
        isCategoryWinner: false,
      });
      continue;
    }

    const [registrants, rounds] = await Promise.all([
      prisma.registration.findMany({
        where: { tournamentId: reg.tournamentId, status: { in: ["confirmed", "registered"] } },
        include: { player: true },
      }),
      prisma.round.findMany({
        where: { tournamentId: reg.tournamentId },
        include: { pairings: true },
      }),
    ]);
    const players = registrants
      .filter((r) => r.player)
      .map((r) => ({ id: r.player!.id, fullName: r.player!.fullName, ageCategory: r.ageCategory }));
    const standings = computeStandings(players, rounds.flatMap((r) => r.pairings));
    const mine = standings.find((s) => s.player.id === playerId) ?? null;
    const winners = categoryWinners(standings);

    results.push({
      tournament: reg.tournament,
      ageCategory: reg.ageCategory,
      standing: mine,
      totalPlayers: standings.length,
      isOverallWinner: mine?.rank === 1,
      isCategoryWinner: Boolean(mine && reg.ageCategory && winners[reg.ageCategory]?.player.id === playerId),
    });
  }

  return results;
}
