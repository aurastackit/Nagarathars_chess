import type { Metadata } from "next";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { EmptyState } from "@/components/ui";
import { TournamentCard } from "@/components/tournament-card";
import { EmptyTournaments } from "@/components/illustrations/empty-states";
import { TOURNAMENTS_HEADER_PHOTO } from "@/lib/featured-photos";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Tournaments",
  description:
    "Browse local chess tournaments and register — free entry to most events, open to non-rated players of every age.",
};

export default async function TournamentsPage() {
  const rows = await prisma.tournament.findMany({
    where: { status: { in: ["published", "closed", "completed"] } },
    orderBy: { startDate: "asc" },
    include: { _count: { select: { registrations: true } } },
  });

  // Closest to today first, whether upcoming or just finished.
  const now = new Date().getTime();
  const tournaments = [...rows].sort(
    (a, b) => Math.abs(a.startDate.getTime() - now) - Math.abs(b.startDate.getTime() - now)
  );

  return (
    <main>
      <section className="relative flex min-h-48 items-end overflow-hidden bg-charcoal pt-16 text-white sm:min-h-56">
        <Image
          src={TOURNAMENTS_HEADER_PHOTO.src}
          alt=""
          fill
          sizes="100vw"
          priority
          className="object-cover opacity-50"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal via-charcoal/40 to-transparent" />
        <div className="relative mx-auto w-full max-w-6xl px-4 pb-6">
          <h1 className="h1">Tournaments</h1>
          <p className="mt-2 text-white/75">
            Browse local tournaments and register — free entry, open to non-rated players.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-12">
        {tournaments.length === 0 ? (
          <EmptyState
            icon={<EmptyTournaments className="h-16 w-16" />}
            message="No tournaments published yet — check back soon."
          />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {tournaments.map((t) => (
              <TournamentCard key={t.id} tournament={t} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
