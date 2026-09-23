import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { LinkButton, Card, Badge, Container, SectionHeading, EmptyState } from "@/components/ui";
import { HeroSlideshow } from "@/components/hero-slideshow";
import { generateGalleryPlaceholders } from "@/lib/gallery-placeholders";
import { GalleryPlaceholderTile } from "@/components/gallery-tile";
import { Reveal } from "@/components/reveal";
import { CountUp } from "@/components/count-up";
import { Countdown } from "@/components/countdown";
import { getNextTournament } from "@/lib/next-tournament";
import { TournamentCard } from "@/components/tournament-card";
import { getHallOfChampions } from "@/lib/hall-of-champions";
import { BishopIcon, KingIcon, KnightIcon, PawnIcon, QueenIcon, RookIcon, TrophyIcon } from "@/components/icons/chess-pieces";

export const dynamic = "force-dynamic";

const PROMISES = [
  {
    title: "No rating, no problem",
    body: "Every tournament welcomes first-time and non-rated players, not just seasoned competitors.",
  },
  {
    title: "Fair, transparent play",
    body: "Clear age categories and entry rules, with every registration reviewed before it's confirmed.",
  },
  {
    title: "Coaching at every level",
    body: "Online classes run from beginner fundamentals to advanced tactics, group or one-on-one.",
  },
  {
    title: "Free to get started",
    body: "Most tournaments are free to enter — there's no cost barrier to playing your first event.",
  },
  {
    title: "Community-rooted",
    body: "Run by volunteers from the community, for the community — venues stay close to home.",
  },
  {
    title: "Every age welcome",
    body: "Clear categories from Under 11 through Above 19 — you can always play up, never down.",
  },
];

const STEPS = [
  {
    Icon: KnightIcon,
    title: "Browse what's open",
    body: "Check upcoming tournaments and class programs — dates, venues, formats, and entry fees are all listed up front.",
  },
  {
    Icon: BishopIcon,
    title: "Register in minutes",
    body: "Fill in your details, pick your age category, and submit. No FIDE rating or prior tournament experience needed.",
  },
  {
    Icon: RookIcon,
    title: "Play & keep improving",
    body: "Show up and compete, then carry the momentum into an online class to sharpen your game for the next event.",
  },
];

const FORMATS = [
  {
    Icon: KingIcon,
    title: "Classical",
    body: "Longer time controls that reward deep calculation — the traditional tournament format.",
  },
  {
    Icon: QueenIcon,
    title: "Rapid",
    body: "Faster games that still leave room to think, ideal for one-day events and first-timers.",
  },
  {
    Icon: PawnIcon,
    title: "Blitz",
    body: "Quick-fire games for players who want fast-paced, high-energy competition.",
  },
];

const BENEFITS = [
  {
    Icon: PawnIcon,
    title: "Sharper focus",
    body: "Every move demands attention — regular play builds the habit of concentrating for longer stretches.",
  },
  {
    Icon: KnightIcon,
    title: "Better planning",
    body: "Thinking several moves ahead carries over into how kids and adults plan schoolwork, projects, and goals.",
  },
  {
    Icon: BishopIcon,
    title: "Patience under pressure",
    body: "Tournament games teach players to stay calm, weigh options, and avoid rushed decisions.",
  },
  {
    Icon: RookIcon,
    title: "Resilience",
    body: "Losing a game and coming back to analyze it builds comfort with setbacks — on and off the board.",
  },
];

const LEVEL_INFO: Record<string, { label: string; body: string }> = {
  beginner: { label: "Beginner", body: "Piece movement, basic tactics, opening principles, and the rules of the game." },
  intermediate: { label: "Intermediate", body: "Deeper tactics, middle-game strategy, endgame technique, and opening theory." },
  advanced: { label: "Advanced", body: "Database-driven preparation, complex endgames, and tournament-ready coaching." },
};
const LEVEL_ORDER = ["beginner", "intermediate", "advanced"];

const FAQS = [
  {
    q: "Do I need a FIDE rating to register?",
    a: "No. Every tournament is open to non-rated players — FIDE ID and rating fields are optional on the registration form.",
  },
  {
    q: "Is there an entry fee?",
    a: "Most of our tournaments are free to enter. Where a fee applies, it's shown clearly on the tournament page before you register.",
  },
  {
    q: "Can I register in a higher age category?",
    a: "Yes — you can always play up into an older age category. You just can't register in a category younger than your own.",
  },
  {
    q: "How do online classes work?",
    a: "Classes run live online in small groups or one-on-one, from beginner fundamentals through advanced tactics. Check the Online Classes page for current schedules.",
  },
];

export default async function HomePage() {
  const [tournaments, allClasses, allPublished, galleryItems, nextTournament] = await Promise.all([
    prisma.tournament.findMany({
      where: { status: "published" },
      orderBy: { startDate: "asc" },
      take: 3,
      include: { _count: { select: { registrations: true } } },
    }),
    prisma.classProgram.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.tournament.findMany({ where: { status: "published" } }),
    prisma.tournament.findMany({
      where: { status: "published", posterImageUrl: { not: null } },
      orderBy: { startDate: "desc" },
      take: 3,
    }),
    getNextTournament(),
  ]);

  const hallOfChampions = await getHallOfChampions();

  const classes = allClasses.slice(0, 3);
  const cityList = [...new Set(allPublished.map((t) => t.city))];
  const stats = [
    { label: "Tournaments hosted", value: allPublished.length },
    { label: "Cities reached", value: cityList.length },
    { label: "Class programs", value: allClasses.length },
  ].filter((s) => s.value > 0);

  const realGalleryItems = galleryItems.slice(0, 6);
  const galleryPlaceholders = generateGalleryPlaceholders(Math.max(0, 6 - realGalleryItems.length));

  const levelGroups = LEVEL_ORDER.map((level) => ({
    level,
    info: LEVEL_INFO[level],
    count: allClasses.filter((c) => c.level === level).length,
  })).filter((g) => g.count > 0);

  return (
    <main>
      <section className="relative overflow-hidden bg-charcoal text-white">
        <HeroSlideshow />
        <div className="absolute inset-0 bg-charcoal/80" />
        <div className="chess-pattern absolute inset-0" />
        <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-gold/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 left-1/3 h-80 w-80 rounded-full bg-gold/10 blur-3xl" />

        <Container className="relative grid gap-12 py-20 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:py-28">
          <div className="flex flex-col items-start gap-6">
            <span className="animate-fade-up inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide ring-1 ring-inset ring-white/20">
              <span className="h-1.5 w-1.5 rounded-full bg-gold" />
              Local players welcome
            </span>
            <h1
              className="animate-fade-up max-w-xl text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl"
              style={{ animationDelay: "80ms" }}
            >
              Chess tournaments and coaching, built for your community.
            </h1>
            <p className="animate-fade-up max-w-lg text-lg text-white/75" style={{ animationDelay: "160ms" }}>
              Register for upcoming local tournaments, join online chess classes, and represent
              your community — no rating required to get started.
            </p>
            <div className="animate-fade-up flex flex-wrap gap-4" style={{ animationDelay: "240ms" }}>
              <LinkButton href="/tournaments" className="shadow-lg shadow-black/20">
                View Tournaments
              </LinkButton>
              <LinkButton
                href="/classes"
                variant="outline"
                className="border-white/40 text-white hover:bg-white hover:text-charcoal"
              >
                Explore Classes
              </LinkButton>
            </div>
            <div
              className="animate-fade-up flex flex-wrap gap-x-6 gap-y-2 pt-1 text-sm text-white/70"
              style={{ animationDelay: "300ms" }}
            >
              <span className="inline-flex items-center gap-1.5">
                <span className="text-gold">✓</span> No FIDE rating needed
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="text-gold">✓</span> Free entry to most events
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="text-gold">✓</span> Every age welcome
              </span>
            </div>

            {nextTournament && (
              <div
                className="animate-fade-up mt-2 w-full max-w-md rounded-xl border border-white/15 bg-white/5 p-4 lg:hidden"
                style={{ animationDelay: "360ms" }}
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-white/60">
                  Registration closes for {nextTournament.title}
                </p>
                <div className="mt-3">
                  <Countdown target={nextTournament.registrationDeadline.toISOString()} />
                </div>
              </div>
            )}
          </div>

          <div className="animate-fade-up relative hidden min-h-[360px] lg:block" style={{ animationDelay: "200ms" }}>
            <div className="absolute right-4 top-0 w-64 -rotate-6 rounded-2xl border border-white/15 bg-white/10 p-4 shadow-2xl backdrop-blur-sm transition-transform hover:rotate-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-white/60">Live Formats</p>
              <div className="mt-3 grid grid-cols-8 gap-[2px] overflow-hidden rounded-md">
                {Array.from({ length: 64 }).map((_, i) => {
                  const row = Math.floor(i / 8);
                  const dark = (row + i) % 2 === 0;
                  return <div key={i} className={`aspect-square ${dark ? "bg-charcoal" : "bg-white/80"}`} />;
                })}
              </div>
              <p className="mt-3 text-sm font-semibold text-white">Classical &middot; Rapid &middot; Blitz</p>
            </div>

            <div className="absolute left-0 top-28 w-72 rotate-3 rounded-2xl border border-white/15 bg-charcoal/80 p-5 shadow-2xl backdrop-blur-md transition-transform hover:rotate-0">
              {nextTournament ? (
                <>
                  <p className="text-xs font-semibold uppercase tracking-wide text-white/60">
                    Registration closes for {nextTournament.title}
                  </p>
                  <div className="mt-3">
                    <Countdown target={nextTournament.registrationDeadline.toISOString()} />
                  </div>
                </>
              ) : (
                <>
                  <p className="text-xs font-semibold uppercase tracking-wide text-white/60">Get started</p>
                  <p className="mt-2 text-lg font-semibold text-white">
                    Your first tournament is free to enter.
                  </p>
                </>
              )}
            </div>

            <div className="absolute bottom-0 right-2 flex items-center gap-3 rounded-xl border border-white/15 bg-white/10 px-4 py-3 shadow-xl backdrop-blur-sm">
              <TrophyIcon className="h-7 w-7 text-gold" />
              <div>
                <p className="text-sm font-bold text-white">Community-run</p>
                <p className="text-xs text-white/60">Free to join</p>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {stats.length > 0 && (
        <section className="border-b border-border bg-card">
          <Container className="grid gap-6 py-10 sm:grid-cols-3">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-3xl font-bold text-charcoal">
                  <CountUp value={s.value} />+
                </p>
                <p className="mt-1 text-sm text-foreground/60">{s.label}</p>
              </div>
            ))}
          </Container>
        </section>
      )}

      <section className="chess-pattern-light bg-background py-16">
        <Container>
          <Reveal>
            <SectionHeading title="How It Works" description="From browsing to your first move, in three simple steps." />
          </Reveal>
          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            {STEPS.map((s, i) => (
              <Reveal key={s.title} delay={i * 120} className="relative rounded-lg border border-border bg-card p-6 shadow-sm">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gold/15 text-lg font-bold text-gold">
                  {i + 1}
                </span>
                <s.Icon className="pointer-events-none absolute right-4 top-4 h-9 w-9 text-charcoal/10" aria-hidden="true" strokeWidth={1} />
                <h3 className="mt-4 font-semibold text-foreground">{s.title}</h3>
                <p className="mt-2 text-sm text-foreground/60">{s.body}</p>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      <Container className="py-16">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-charcoal">Upcoming Tournaments</h2>
          <Link href="/tournaments" className="text-sm font-semibold text-gold hover:underline">
            View all &rarr;
          </Link>
        </div>
        {tournaments.length === 0 ? (
          <EmptyState message="No tournaments published yet — check back soon." />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {tournaments.map((t, i) => (
              <Reveal key={t.id} delay={i * 100}>
                <TournamentCard tournament={t} />
              </Reveal>
            ))}
          </div>
        )}
      </Container>

      {levelGroups.length > 0 && (
        <section className="bg-card py-16">
          <Container>
            <Reveal>
              <SectionHeading title="Programs By Level" description="A structured path from your first game to tournament-ready play." />
            </Reveal>
            <div className="mt-10 grid gap-6 sm:grid-cols-3">
              {levelGroups.map((g, i) => (
                <Reveal key={g.level} delay={i * 120} className="rounded-lg border border-border p-6 text-center shadow-sm">
                  <Badge tone={i === 1 ? "gold" : "charcoal"}>{g.info.label}</Badge>
                  <p className="mt-3 text-sm text-foreground/60">{g.info.body}</p>
                  <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-foreground/40">
                    {g.count} program{g.count === 1 ? "" : "s"} available
                  </p>
                </Reveal>
              ))}
            </div>
          </Container>
        </section>
      )}

      <Container className="py-16">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-charcoal">Online Tutoring &amp; Classes</h2>
          <Link href="/classes" className="text-sm font-semibold text-gold hover:underline">
            View all &rarr;
          </Link>
        </div>
        {classes.length === 0 ? (
          <EmptyState message="No classes published yet — check back soon." />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {classes.map((c, i) => (
              <Reveal key={c.id} delay={i * 100}>
                <Card className="h-full p-5">
                  <Badge tone="gold">{c.level}</Badge>
                  <h3 className="mt-2 font-semibold text-foreground">{c.title}</h3>
                  <p className="mt-2 text-sm text-foreground/60">{c.scheduleText}</p>
                  <Link
                    href="/classes"
                    className="mt-3 inline-block text-sm font-semibold text-charcoal hover:underline"
                  >
                    Learn more &rarr;
                  </Link>
                </Card>
              </Reveal>
            ))}
          </div>
        )}
      </Container>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <Reveal>
          <SectionHeading
            title="Tournament Formats"
            description="We run events across every time control, so there's a format for how you like to play."
          />
        </Reveal>
        <div className="mt-10 grid gap-6 sm:grid-cols-3">
          {FORMATS.map((f, i) => (
            <Reveal key={f.title} delay={i * 100} className="rounded-lg border border-border bg-card p-6 text-center shadow-sm">
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gold/15 text-gold">
                <f.Icon className="h-7 w-7" strokeWidth={1.1} />
              </span>
              <h3 className="mt-4 font-semibold text-foreground">{f.title}</h3>
              <p className="mt-2 text-sm text-foreground/60">{f.body}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {hallOfChampions.length > 0 && (
        <section className="chess-pattern relative overflow-hidden bg-charcoal py-16 text-white">
          <Container>
            <Reveal>
              <SectionHeading
                eyebrow="Hall of Champions"
                title="Recent Winners"
                description="Champions from our most recently concluded tournaments."
                className="[&_h2]:text-white [&_p]:text-white/70"
              />
            </Reveal>
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {hallOfChampions.map((entry, i) => (
                <Reveal
                  key={entry.tournament.slug}
                  delay={i * 100}
                  className="rounded-lg border border-white/15 bg-white/5 p-6 backdrop-blur-sm"
                >
                  <Link href={`/tournaments/${entry.tournament.slug}/results`} className="block">
                    <TrophyIcon className="h-8 w-8 text-gold" />
                    <h3 className="mt-3 font-semibold text-white">{entry.tournament.title}</h3>
                    <p className="mt-1 text-sm text-gold">{entry.champion} &middot; Champion</p>
                  </Link>
                  {entry.categoryChampions.length > 0 && (
                    <ul className="mt-4 space-y-1 border-t border-white/10 pt-3">
                      {entry.categoryChampions.map((c) => (
                        <li key={c.label} className="flex justify-between text-xs text-white/60">
                          <span>{c.label}</span>
                          <span className="font-medium text-white/85">{c.name}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </Reveal>
              ))}
            </div>
          </Container>
        </section>
      )}

      <section className="bg-card py-16">
        <Container>
          <Reveal>
            <SectionHeading title="Why Chess?" description="The skills chess builds carry well beyond the board." />
          </Reveal>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {BENEFITS.map((b, i) => (
              <Reveal key={b.title} delay={i * 90} className="rounded-lg border border-border p-5 text-center shadow-sm">
                <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-charcoal/10 text-charcoal">
                  <b.Icon className="h-6 w-6" strokeWidth={1.1} />
                </span>
                <h3 className="mt-3 font-semibold text-foreground">{b.title}</h3>
                <p className="mt-2 text-sm text-foreground/60">{b.body}</p>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      <Container className="py-16">
        <Reveal>
          <SectionHeading title="Why Choose Us" description="Whatever brought you here, we've built this around making chess accessible." />
        </Reveal>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {PROMISES.map((p, i) => (
            <Reveal key={p.title} delay={i * 80}>
              <Card className="h-full p-5">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gold/10 text-gold">
                  ✓
                </span>
                <h3 className="mt-3 font-semibold text-foreground">{p.title}</h3>
                <p className="mt-2 text-sm text-foreground/60">{p.body}</p>
              </Card>
            </Reveal>
          ))}
        </div>
      </Container>

      <section className="bg-card py-16">
        <Container>
          <div className="mb-8 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-charcoal">From Our Gallery</h2>
            <Link href="/gallery" className="text-sm font-semibold text-gold hover:underline">
              View all &rarr;
            </Link>
          </div>
          <div className="grid gap-6 sm:grid-cols-3">
            {realGalleryItems.map((t, i) => (
              <Reveal key={t.id} delay={i * 90}>
                <Link href="/gallery" className="block overflow-hidden rounded-lg border border-border bg-background">
                  <div className="relative h-40 w-full bg-gray-100">
                    <Image src={t.posterImageUrl!} alt={t.title} fill className="object-contain" />
                  </div>
                </Link>
              </Reveal>
            ))}
            {galleryPlaceholders.map((p, i) => (
              <Reveal key={p.id} delay={(realGalleryItems.length + i) * 90}>
                <Link href="/gallery" className="block h-40 overflow-hidden rounded-lg border border-border">
                  <GalleryPlaceholderTile {...p} />
                </Link>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      <section className="bg-card py-16">
        <div className="mx-auto max-w-3xl px-4">
          <Reveal>
            <SectionHeading title="Frequently Asked Questions" />
          </Reveal>
          <div className="mt-10 space-y-6">
            {FAQS.map((f, i) => (
              <Reveal key={f.q} delay={i * 80} className="border-b border-border pb-6 last:border-0">
                <h3 className="font-semibold text-foreground">{f.q}</h3>
                <p className="mt-2 text-sm text-foreground/60">{f.a}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-16 text-center">
        <h2 className="text-2xl font-bold text-charcoal">Our Goal</h2>
        <p className="mt-4 text-foreground/80">
          We want every local player who wants a first tournament experience to have one nearby,
          free of cost, and welcoming to beginners — with the coaching to keep growing long after
          the last move is played.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-4">
          <LinkButton href="/about">Read Our Story</LinkButton>
          <LinkButton href="/contact" variant="outline">
            Get In Touch
          </LinkButton>
        </div>
      </section>

      <section className="chess-pattern relative overflow-hidden bg-charcoal py-14 text-center text-white">
        <div className="relative mx-auto max-w-2xl px-4">
          <h2 className="text-2xl font-bold">Ready to make your first move?</h2>
          <p className="mt-2 text-white/70">
            Registration is free to start, and every event is built to welcome new players.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-4">
            <LinkButton href="/tournaments">View Tournaments</LinkButton>
            <LinkButton
              href="/classes"
              variant="outline"
              className="border-white text-white hover:bg-white hover:text-charcoal"
            >
              Explore Classes
            </LinkButton>
          </div>
        </div>
      </section>
    </main>
  );
}
