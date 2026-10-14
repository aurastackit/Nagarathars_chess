import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { LinkButton, Card } from "@/components/ui";
import { Reveal } from "@/components/reveal";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "About",
  description: "Our story, our promise, and our goal for community chess.",
};

const PROMISES = [
  {
    title: "No rating, no problem",
    body: "Every tournament and class is designed to welcome first-time and non-rated players — not just seasoned competitors.",
  },
  {
    title: "Fair, transparent play",
    body: "Age categories, entry rules, and results are published clearly, and every registration is reviewed before it's confirmed.",
  },
  {
    title: "Community first",
    body: "Events are built around local communities and venues, so players compete close to home and represent people they know.",
  },
  {
    title: "Coaching that meets you where you are",
    body: "Online classes run from absolute beginner fundamentals through advanced tactics, in both group and one-on-one formats.",
  },
];

export default async function AboutPage() {
  const [publishedTournaments, classPrograms] = await Promise.all([
    prisma.tournament.findMany({ where: { status: "published" } }),
    prisma.classProgram.count(),
  ]);

  const cities = new Set(publishedTournaments.map((t) => t.city)).size;
  const now = new Date();
  const pastTournaments = publishedTournaments.filter((t) => t.endDate < now);
  const upcomingTournaments = publishedTournaments.filter((t) => t.endDate >= now);

  const stats = [
    { label: "Tournaments hosted", value: publishedTournaments.length },
    { label: "Cities reached", value: cities },
    { label: "Class programs offered", value: classPrograms },
    { label: "Tournaments completed", value: pastTournaments.length },
  ];

  return (
    <main>
      <section className="bg-charcoal text-white">
        <div className="mx-auto max-w-4xl px-4 py-16 text-center">
          <h1 className="h1 animate-fade-up">About us</h1>
          <p
            className="animate-fade-up mx-auto mt-3 max-w-2xl text-white/80"
            style={{ animationDelay: "100ms" }}
          >
            We&apos;re building a home for local, non-rated chess players — starting with our own
            community and growing one tournament and one class at a time.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14">
        <div className="grid gap-4 sm:grid-cols-4">
          {stats.map((s) => (
            <Card key={s.label} className="p-5 text-center">
              <p className="text-3xl font-bold text-charcoal">{s.value}</p>
              <p className="text-small mt-1 text-muted">{s.label}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="bg-card py-14">
        <div className="mx-auto max-w-4xl px-4">
          <h2 className="h2 text-charcoal">Our story</h2>
          <p className="mt-4 text-foreground/80">
            Nagarathar&apos;s Chess Championship started as a simple idea: chess shouldn&apos;t be
            gated behind ratings, entry fees, or travel to far-off venues. We organize tournaments
            for local, non-rated players of every age, and pair that with affordable online coaching
            so players can keep improving between events.
          </p>
          <p className="mt-4 text-foreground/80">
            Every event is run by volunteers from the community, for the community — from picking
            venues close to home to reviewing every registration by hand before it&apos;s confirmed.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14">
        <h2 className="h2 text-charcoal">Our promise</h2>
        <Reveal className="mt-8 grid gap-6 sm:grid-cols-2">
          {PROMISES.map((p) => (
            <Card key={p.title} className="h-full p-5">
              <h3 className="h3 text-foreground">{p.title}</h3>
              <p className="text-small mt-2 text-muted">{p.body}</p>
            </Card>
          ))}
        </Reveal>
      </section>

      <section className="bg-charcoal/5 py-14">
        <div className="mx-auto max-w-4xl px-4">
          <h2 className="h2 text-charcoal">Our goal</h2>
          <p className="mt-4 text-foreground/80">
            In the near term, we want every local player who wants a first tournament experience to
            have one nearby, free of cost, and welcoming to beginners. Longer term, we want our
            strongest players to be ready to compete at state-level events — with the coaching and
            match experience behind them to do it with confidence.
          </p>
          {upcomingTournaments.length > 0 && (
            <p className="mt-4 text-foreground/80">
              Right now we have{" "}
              <span className="font-semibold text-charcoal">{upcomingTournaments.length}</span>{" "}
              upcoming tournament{upcomingTournaments.length === 1 ? "" : "s"} open for
              registration.
            </p>
          )}
          <div className="mt-6 flex flex-wrap gap-4">
            <LinkButton href="/tournaments">View Tournaments</LinkButton>
            <LinkButton href="/classes" variant="outline">
              Explore Classes
            </LinkButton>
          </div>
        </div>
      </section>
    </main>
  );
}
