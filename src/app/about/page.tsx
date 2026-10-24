import type { Metadata } from "next";
import Image from "next/image";
import { pageMetadata } from "@/lib/seo";
import { breadcrumbJsonLd } from "@/lib/seo/structured-data";
import { JsonLd } from "@/components/json-ld";
import { prisma } from "@/lib/prisma";
import { LinkButton, Card, Section } from "@/components/ui";
import { Reveal } from "@/components/reveal";
import { TrusteesLineup } from "@/components/trustees-lineup";
import { COMMITTEE } from "@/data/committee";
import { CLASSES_ENABLED } from "@/lib/features";
import { YouTubeLink } from "@/components/youtube-link";
import { getHighlightVideoLink } from "@/lib/gallery";
import { getTournamentStats } from "@/lib/tournament-stats";
import { getTournamentStatus } from "@/lib/tournament-status";

// Static, regenerated at most every minute or on demand after an admin
// change (lib/revalidate-public).
export const revalidate = 60;

export const metadata: Metadata = pageMetadata({
  title: "About Us & Our Trustees",
  description: CLASSES_ENABLED
    ? "Meet the trustees behind Nagarathar's Chess Championship, a community-run chess initiative in Chennai making tournaments and coaching free and welcoming."
    : "Meet the trustees behind Nagarathar's Chess Championship, a community initiative in Chennai making chess tournaments free and welcoming. Coaching coming soon.",
  path: "/about",
});

const PROMISES = [
  {
    title: "No rating, no problem",
    body: CLASSES_ENABLED
      ? "Every tournament and class is designed to welcome first-time and non-rated players — not just seasoned competitors."
      : "Every tournament is designed to welcome first-time and non-rated players — not just seasoned competitors.",
  },
  {
    title: "Fair, transparent play",
    body: "Age categories, entry rules, and results are published clearly, and every registration is reviewed before it's confirmed.",
  },
  {
    title: "Community first",
    body: "Events are built around local communities and venues, so players compete close to home and represent people they know.",
  },
  CLASSES_ENABLED
    ? {
        title: "Coaching that meets you where you are",
        body: "Online classes run from absolute beginner fundamentals through advanced tactics, in both group and one-on-one formats.",
      }
    : {
        title: "Coaching coming soon",
        body: "Online classes from absolute beginner fundamentals through advanced tactics are on the way, in group and one-on-one formats.",
      },
];

export default async function AboutPage() {
  const [publishedTournaments, classPrograms, highlight] = await Promise.all([
    prisma.tournament.findMany({ where: { status: "published" } }),
    // No class data on public pages while classes are coming soon (lib/features).
    CLASSES_ENABLED ? prisma.classProgram.count() : Promise.resolve(0),
    getHighlightVideoLink(),
  ]);

  const tournamentStats = getTournamentStats(publishedTournaments);
  const upcomingTournaments = publishedTournaments.filter(
    (t) => getTournamentStatus(t) !== "completed"
  );

  const stats = [
    { label: "Tournaments hosted", value: tournamentStats.hosted },
    { label: "Cities reached", value: tournamentStats.cities },
    ...(CLASSES_ENABLED ? [{ label: "Class programs offered", value: classPrograms }] : []),
    { label: "Tournaments completed", value: tournamentStats.completed },
  ];

  return (
    <main>
      <JsonLd data={breadcrumbJsonLd([{ name: "About", path: "/about" }])} />
      <section className="bg-charcoal text-white">
        <div className="mx-auto max-w-4xl px-4 py-16 text-center">
          <h1 className="h1 animate-fade-up">About us</h1>
          <p
            className="animate-fade-up mx-auto mt-3 max-w-2xl text-white/80"
            style={{ animationDelay: "100ms" }}
          >
            We&apos;re building a home for local, non-rated chess players — starting with our own
            community and growing one tournament{CLASSES_ENABLED ? " and one class" : ""} at a time.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14">
        <div className={`grid gap-4 ${stats.length === 4 ? "sm:grid-cols-4" : "sm:grid-cols-3"}`}>
          {stats.map((s) => (
            <Card key={s.label} className="p-5 text-center">
              <p className="text-3xl font-bold text-charcoal">{s.value}</p>
              <p className="text-small mt-1 text-muted">{s.label}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="bg-card py-14">
        <div className="mx-auto grid max-w-5xl items-center gap-8 px-4 md:grid-cols-[minmax(0,360px)_1fr] md:gap-12">
          <Image
            src="/brand/logo-primary.svg"
            alt="Nagarathar's Chess Championship logo"
            width={600}
            height={600}
            unoptimized
            className="mx-auto w-full max-w-[360px] rounded-2xl shadow-md"
          />
          <div>
            <h2 className="h2 text-charcoal">Our story</h2>
            <p className="mt-4 text-foreground/80">
              Nagarathar&apos;s Chess Championship started as a simple idea: chess shouldn&apos;t be
              gated behind ratings, entry fees, or travel to far-off venues. We organize tournaments
              for local, non-rated players of every age
              {CLASSES_ENABLED
                ? ", and pair that with affordable online coaching so players can keep improving between events."
                : " — with affordable online coaching coming soon, so players can keep improving between events."}
            </p>
            <p className="mt-4 text-foreground/80">
              Every event is run by volunteers from the community, for the community — from picking
              venues close to home to reviewing every registration by hand before it&apos;s
              confirmed.
            </p>
          </div>
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

      <Section
        eyebrow="Our trustees"
        title="The trustees behind the vision"
        subtitle={
          CLASSES_ENABLED
            ? "The trustees who guide our vision and make every tournament, class and registration possible."
            : "The trustees who guide our vision and make every tournament and registration possible."
        }
        align="left"
        className="bg-card"
      >
        <TrusteesLineup members={COMMITTEE} />
      </Section>

      {highlight && (
        <section className="border-y border-border bg-background py-10">
          <div className="mx-auto flex max-w-4xl flex-col items-center justify-between gap-4 px-4 text-center sm:flex-row sm:text-left">
            <div>
              <h2 className="h3 text-charcoal">Relive our first championship</h2>
              <p className="mt-1 text-muted">Highlights from 4 January 2026.</p>
            </div>
            <YouTubeLink href={highlight.href}>Watch on YouTube</YouTubeLink>
          </div>
        </section>
      )}

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
            <LinkButton href={CLASSES_ENABLED ? "/classes" : "/gallery"} variant="outline">
              {CLASSES_ENABLED ? "Explore Classes" : "See our gallery"}
            </LinkButton>
          </div>
        </div>
      </section>
    </main>
  );
}
