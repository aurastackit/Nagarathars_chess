import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Badge, Card, EmptyState } from "@/components/ui";
import { ageCategoryLabel } from "@/lib/age-category";
import { computeStandings, categoryWinners } from "@/lib/standings";
import { TrophyIcon } from "@/components/icons/chess-pieces";

export const dynamic = "force-dynamic";

const RESULT_LABEL: Record<string, string> = {
  "1-0": "1 – 0",
  "0-1": "0 – 1",
  "0.5-0.5": "½ – ½",
  BYE: "Bye",
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const tournament = await prisma.tournament.findUnique({ where: { slug } });
  if (!tournament || !tournament.resultsPublished) return {};
  return { title: `Results — ${tournament.title} | Nagarathar's Chess Championship` };
}

export default async function TournamentResultsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tournament = await prisma.tournament.findUnique({ where: { slug } });
  if (!tournament || !tournament.resultsPublished) notFound();

  const [registrants, rounds] = await Promise.all([
    prisma.registration.findMany({
      where: { tournamentId: tournament.id, status: { in: ["confirmed", "registered"] } },
      include: { player: true },
    }),
    prisma.round.findMany({
      where: { tournamentId: tournament.id },
      orderBy: { number: "asc" },
      include: { pairings: { include: { whitePlayer: true, blackPlayer: true }, orderBy: { board: "asc" } } },
    }),
  ]);

  const players = registrants
    .filter((r) => r.player)
    .map((r) => ({ id: r.player!.id, fullName: r.player!.fullName, ageCategory: r.ageCategory }));
  const allPairings = rounds.flatMap((r) => r.pairings);
  const standings = computeStandings(players, allPairings);
  const winners = categoryWinners(standings);
  const champion = standings[0];

  return (
    <main className="mx-auto max-w-4xl px-4 py-12">
      <p className="text-sm">
        <Link href={`/tournaments/${tournament.slug}`} className="font-semibold text-gold hover:underline">
          &larr; {tournament.title}
        </Link>
      </p>
      <h1 className="mt-2 text-3xl font-bold text-charcoal">Results</h1>

      {standings.length === 0 ? (
        <EmptyState className="mt-8" message="Results haven't been recorded yet — check back soon." />
      ) : (
        <>
          <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {champion && (
              <Card className="p-4 text-center">
                <TrophyIcon className="mx-auto h-6 w-6 text-gold" />
                <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-foreground/50">Champion</p>
                <p className="mt-1 font-semibold text-charcoal">{champion.player.fullName}</p>
              </Card>
            )}
            {Object.entries(winners).map(([cat, s]) => (
              <Card key={cat} className="p-4 text-center">
                <TrophyIcon className="mx-auto h-6 w-6 text-charcoal/40" />
                <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-foreground/50">
                  {ageCategoryLabel(cat)} Champion
                </p>
                <p className="mt-1 font-semibold text-charcoal">{s.player.fullName}</p>
              </Card>
            ))}
          </section>

          <section className="mt-10">
            <h2 className="text-xl font-semibold text-charcoal">Standings</h2>
            <Card className="mt-4 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-charcoal/5 text-foreground/60">
                    <tr>
                      <th className="px-4 py-2 font-medium">Rank</th>
                      <th className="px-4 py-2 font-medium">Player</th>
                      <th className="px-4 py-2 font-medium">Category</th>
                      <th className="px-4 py-2 font-medium">Score</th>
                      <th className="px-4 py-2 font-medium">Buchholz</th>
                      <th className="px-4 py-2 font-medium">S-B</th>
                    </tr>
                  </thead>
                  <tbody>
                    {standings.map((s) => (
                      <tr key={s.player.id} className="border-t border-border">
                        <td className="px-4 py-2 font-semibold">{s.rank}</td>
                        <td className="px-4 py-2">
                          <Link href={`/players/${s.player.id}`} className="text-charcoal hover:underline">
                            {s.player.fullName}
                          </Link>
                        </td>
                        <td className="px-4 py-2">
                          <Badge tone="gray">{ageCategoryLabel(s.player.ageCategory)}</Badge>
                        </td>
                        <td className="px-4 py-2 font-semibold">{s.score}</td>
                        <td className="px-4 py-2 text-foreground/60">{s.buchholz}</td>
                        <td className="px-4 py-2 text-foreground/60">{s.sonnebornBerger}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </section>

          <section className="mt-10">
            <h2 className="text-xl font-semibold text-charcoal">Round-by-round pairings</h2>
            <div className="mt-4 space-y-6">
              {rounds.map((round) => (
                <Card key={round.id} className="p-5">
                  <h3 className="font-semibold text-charcoal">Round {round.number}</h3>
                  <table className="mt-3 w-full text-left text-sm">
                    <thead className="text-foreground/50">
                      <tr>
                        <th className="py-1.5 pr-3 font-medium">Board</th>
                        <th className="py-1.5 pr-3 font-medium">White</th>
                        <th className="py-1.5 pr-3 font-medium">Black</th>
                        <th className="py-1.5 font-medium">Result</th>
                      </tr>
                    </thead>
                    <tbody>
                      {round.pairings.map((p) => (
                        <tr key={p.id} className="border-t border-border">
                          <td className="py-1.5 pr-3">{p.board ?? "—"}</td>
                          <td className="py-1.5 pr-3">{p.whitePlayer?.fullName ?? "—"}</td>
                          <td className="py-1.5 pr-3">{p.blackPlayer?.fullName ?? "Bye"}</td>
                          <td className="py-1.5">{p.result ? RESULT_LABEL[p.result] ?? p.result : "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Card>
              ))}
            </div>
          </section>
        </>
      )}
    </main>
  );
}
