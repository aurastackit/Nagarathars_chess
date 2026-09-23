import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { TournamentFilters } from "@/components/tournament-filters";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Tournaments",
  description:
    "Browse local chess tournaments and register — free entry to most events, open to non-rated players of every age.",
};

export default async function TournamentsPage() {
  const tournaments = await prisma.tournament.findMany({
    where: { status: { in: ["published", "closed", "completed"] } },
    orderBy: { startDate: "asc" },
    include: { _count: { select: { registrations: true } } },
  });

  return (
    <main className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="text-3xl font-bold text-charcoal">Tournaments</h1>
      <p className="mt-2 text-foreground/60">
        Browse local tournaments and register — free entry, open to non-rated players.
      </p>

      <div className="mt-8">
        <TournamentFilters tournaments={tournaments} />
      </div>
    </main>
  );
}
