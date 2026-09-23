import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Badge, Card, EmptyState } from "@/components/ui";
import { formatDate } from "@/lib/format";
import { ageCategoryLabel } from "@/lib/age-category";
import { getPlayerTournamentResults } from "@/lib/player-results";
import { ScoreHistoryChart } from "@/components/player/score-history-chart";
import { TrophyIcon } from "@/components/icons/chess-pieces";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const player = await prisma.player.findUnique({ where: { id } });
  if (!player) return {};
  return { title: `${player.fullName} | Nagarathar's Chess Championship` };
}

export default async function PlayerProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const player = await prisma.player.findUnique({ where: { id } });
  if (!player) notFound();

  const results = await getPlayerTournamentResults(id);
  const withResults = results.filter((r) => r.standing);

  const tournamentWins = withResults.filter((r) => r.isOverallWinner).length;
  const categoryWins = withResults.filter((r) => r.isCategoryWinner).length;

  const chartData = [...withResults]
    .reverse()
    .map((r) => ({ label: r.tournament.title.slice(0, 14), score: r.standing!.score }));

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold text-charcoal">{player.fullName}</h1>
      <p className="mt-1 text-sm text-foreground/60">Player profile</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-charcoal">{results.length}</p>
          <p className="mt-1 text-xs text-foreground/60">Tournaments played</p>
        </Card>
        <Card className="p-4 text-center">
          <TrophyIcon className="mx-auto h-5 w-5 text-gold" />
          <p className="mt-1 text-2xl font-bold text-charcoal">{tournamentWins}</p>
          <p className="mt-1 text-xs text-foreground/60">Tournament wins</p>
        </Card>
        <Card className="p-4 text-center">
          <TrophyIcon className="mx-auto h-5 w-5 text-charcoal/40" />
          <p className="mt-1 text-2xl font-bold text-charcoal">{categoryWins}</p>
          <p className="mt-1 text-xs text-foreground/60">Category titles</p>
        </Card>
      </div>

      {chartData.length > 0 && (
        <section className="mt-8">
          <h2 className="text-lg font-semibold text-charcoal">Score history</h2>
          <Card className="mt-3 p-4">
            <ScoreHistoryChart data={chartData} />
          </Card>
        </section>
      )}

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-charcoal">Tournaments played</h2>
        {results.length === 0 ? (
          <EmptyState className="mt-3" message="No tournaments recorded yet." />
        ) : (
          <div className="mt-3 space-y-3">
            {results.map((r) => (
              <Card key={r.tournament.id} className="flex items-center justify-between p-4">
                <div>
                  <Link href={`/tournaments/${r.tournament.slug}`} className="font-semibold text-charcoal hover:underline">
                    {r.tournament.title}
                  </Link>
                  <p className="text-xs text-foreground/50">
                    {formatDate(r.tournament.startDate)} &middot; {r.tournament.venue}, {r.tournament.city}
                    {r.ageCategory && ` · ${ageCategoryLabel(r.ageCategory)}`}
                  </p>
                </div>
                {r.standing ? (
                  <div className="text-right">
                    <Badge tone={r.standing.rank === 1 ? "gold" : "charcoal"}>Rank {r.standing.rank} / {r.totalPlayers}</Badge>
                    <p className="mt-1 text-xs text-foreground/50">Score {r.standing.score}</p>
                  </div>
                ) : (
                  <Badge tone="gray">Results pending</Badge>
                )}
              </Card>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
