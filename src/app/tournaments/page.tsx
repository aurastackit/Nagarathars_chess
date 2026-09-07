import Image from "next/image";
import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { Card, Badge } from "@/components/ui";
import { formatDateRange } from "@/lib/format";

type TournamentWithCount = Prisma.TournamentGetPayload<{
  include: { _count: { select: { registrations: true } } };
}>;

export const dynamic = "force-dynamic";

export default async function TournamentsPage() {
  const tournaments = await prisma.tournament.findMany({
    where: { status: { in: ["published", "closed", "completed"] } },
    orderBy: { startDate: "asc" },
    include: { _count: { select: { registrations: true } } },
  });

  const now = new Date();
  const upcoming = tournaments.filter((t) => t.endDate >= now);
  const past = tournaments.filter((t) => t.endDate < now);

  return (
    <main className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="text-3xl font-bold text-navy">Tournaments</h1>
      <p className="mt-2 text-foreground/60">
        Browse upcoming local tournaments and register — free entry, open to non-rated players.
      </p>

      <TournamentGrid title="Upcoming" tournaments={upcoming} emptyText="No upcoming tournaments right now — check back soon." />
      {past.length > 0 && (
        <TournamentGrid title="Past" tournaments={past} emptyText="" />
      )}
    </main>
  );
}

function TournamentGrid({
  title,
  tournaments,
  emptyText,
}: {
  title: string;
  tournaments: TournamentWithCount[];
  emptyText: string;
}) {
  return (
    <section className="mt-10">
      <h2 className="mb-4 text-xl font-semibold text-foreground">{title}</h2>
      {tournaments.length === 0 ? (
        <p className="text-foreground/60">{emptyText}</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {tournaments.map((t) => (
            <Link key={t.id} href={`/tournaments/${t.slug}`}>
              <Card className="group h-full overflow-hidden transition-shadow hover:shadow-md">
                {t.posterImageUrl && (
                  <div className="relative h-40 w-full bg-gray-100">
                    <Image src={t.posterImageUrl} alt={t.title} fill className="object-contain" />
                  </div>
                )}
                <div className="p-4">
                  <div className="flex gap-2">
                    <Badge tone="navy">{t.format}</Badge>
                    <Badge tone="gray">{t.category}</Badge>
                  </div>
                  <h3 className="mt-2 font-semibold text-foreground">{t.title}</h3>
                  <p className="mt-1 text-sm text-foreground/60">
                    {formatDateRange(t.startDate, t.endDate)} &middot; {t.venue}, {t.city}
                  </p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="inline-flex items-center rounded-full bg-orange px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors group-hover:bg-orange/90">
                      {t.entryFee === 0 ? "Register — Free Entry" : `Register — ₹${t.entryFee}`}
                    </span>
                    <p className="text-xs text-foreground/50">{t._count.registrations} registered</p>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
