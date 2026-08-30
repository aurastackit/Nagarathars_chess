import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { LinkButton, Card, Badge } from "@/components/ui";
import { formatDateRange } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [tournaments, classes] = await Promise.all([
    prisma.tournament.findMany({
      where: { status: "published" },
      orderBy: { startDate: "asc" },
      take: 3,
    }),
    prisma.classProgram.findMany({ orderBy: { createdAt: "asc" }, take: 3 }),
  ]);

  return (
    <main>
      <section className="bg-navy text-white">
        <div className="mx-auto flex max-w-6xl flex-col items-start gap-6 px-4 py-20">
          <span className="rounded-full bg-orange px-3 py-1 text-xs font-semibold uppercase tracking-wide">
            Local players welcome
          </span>
          <h1 className="max-w-2xl text-4xl font-bold leading-tight sm:text-5xl">
            Chess tournaments and coaching, built for your community.
          </h1>
          <p className="max-w-xl text-lg text-white/80">
            Register for upcoming local tournaments, join online chess classes, and represent
            your community — no rating required to get started.
          </p>
          <div className="flex flex-wrap gap-4">
            <LinkButton href="/tournaments">View Tournaments</LinkButton>
            <LinkButton href="/classes" variant="outline" className="border-white text-white hover:bg-white hover:text-navy">
              Explore Classes
            </LinkButton>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-navy">Upcoming Tournaments</h2>
          <Link href="/tournaments" className="text-sm font-semibold text-orange hover:underline">
            View all &rarr;
          </Link>
        </div>
        {tournaments.length === 0 ? (
          <p className="text-foreground/60">No tournaments published yet — check back soon.</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {tournaments.map((t) => (
              <Link key={t.id} href={`/tournaments/${t.slug}`}>
                <Card className="h-full overflow-hidden transition-shadow hover:shadow-md">
                  {t.posterImageUrl && (
                    <div className="relative h-40 w-full bg-gray-100">
                      <Image src={t.posterImageUrl} alt={t.title} fill className="object-cover" />
                    </div>
                  )}
                  <div className="p-4">
                    <Badge tone="navy">{t.format}</Badge>
                    <h3 className="mt-2 font-semibold text-foreground">{t.title}</h3>
                    <p className="mt-1 text-sm text-foreground/60">
                      {formatDateRange(t.startDate, t.endDate)} &middot; {t.city}
                    </p>
                    <p className="mt-2 text-sm font-semibold text-orange">
                      {t.entryFee === 0 ? "Free entry" : `Entry ₹${t.entryFee}`}
                    </p>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="bg-card py-16">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mb-8 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-navy">Online Tutoring &amp; Classes</h2>
            <Link href="/classes" className="text-sm font-semibold text-orange hover:underline">
              View all &rarr;
            </Link>
          </div>
          {classes.length === 0 ? (
            <p className="text-foreground/60">No classes published yet — check back soon.</p>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {classes.map((c) => (
                <Card key={c.id} className="p-5">
                  <Badge tone="orange">{c.level}</Badge>
                  <h3 className="mt-2 font-semibold text-foreground">{c.title}</h3>
                  <p className="mt-2 text-sm text-foreground/60">{c.scheduleText}</p>
                  <Link
                    href="/classes"
                    className="mt-3 inline-block text-sm font-semibold text-navy hover:underline"
                  >
                    Learn more &rarr;
                  </Link>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
