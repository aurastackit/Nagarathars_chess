import { prisma } from "@/lib/prisma";
import { computeStandings, categoryWinners } from "@/lib/standings";
import { ageCategoryLabel } from "@/lib/age-category";

export type ChampionEntry = {
  tournament: { slug: string; title: string; startDate: Date };
  champion: string;
  categoryChampions: { label: string; name: string }[];
};

/** Champion + category winners for the most recent tournaments with published results. */
export async function getHallOfChampions(limit = 3): Promise<ChampionEntry[]> {
  const tournaments = await prisma.tournament.findMany({
    where: { resultsPublished: true },
    orderBy: { startDate: "desc" },
    take: limit,
  });

  const entries: ChampionEntry[] = [];
  for (const tournament of tournaments) {
    const [registrants, rounds] = await Promise.all([
      prisma.registration.findMany({
        where: { tournamentId: tournament.id, status: { in: ["confirmed", "registered"] } },
        include: { player: true },
      }),
      prisma.round.findMany({
        where: { tournamentId: tournament.id },
        include: { pairings: true },
      }),
    ]);
    const players = registrants
      .filter((r) => r.player)
      .map((r) => ({ id: r.player!.id, fullName: r.player!.fullName, ageCategory: r.ageCategory }));
    if (players.length === 0) continue;

    const standings = computeStandings(
      players,
      rounds.flatMap((r) => r.pairings)
    );
    if (standings.length === 0 || standings[0].played === 0) continue;

    const winners = categoryWinners(standings);
    entries.push({
      tournament: {
        slug: tournament.slug,
        title: tournament.title,
        startDate: tournament.startDate,
      },
      champion: standings[0].player.fullName,
      categoryChampions: Object.entries(winners).map(([cat, s]) => ({
        label: ageCategoryLabel(cat),
        name: s.player.fullName,
      })),
    });
  }
  return entries;
}
