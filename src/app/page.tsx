import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { LinkButton, Card, Badge, Container, Section, EmptyState } from "@/components/ui";
import { Reveal } from "@/components/reveal";
import { CountUp } from "@/components/count-up";
import { Countdown } from "@/components/countdown";
import { getNextTournament } from "@/lib/next-tournament";
import { registerPath } from "@/lib/registration-flow";
import { timeUntilEndOfDayIST } from "@/lib/countdown-format";
import { getTournamentStatus } from "@/lib/tournament-status";
import { TournamentCard } from "@/components/tournament-card";
import { getHallOfChampions } from "@/lib/hall-of-champions";
import { ClassWaitlistForm } from "@/components/class-waitlist-form";
import { HERO_MOMENT_PHOTO } from "@/lib/featured-photos";
import { getGallery } from "@/lib/gallery";
import { resolveVideoPlayback, type ShortsItem } from "@/lib/video";
import { ShortsRow } from "@/components/shorts-row";
import { CTA_PHOTO } from "@/lib/stock-photos";
import { KnightIcon, PawnIcon, RookIcon, TrophyIcon } from "@/components/icons/chess-pieces";
import { HeroBoard } from "@/components/illustrations/hero-board";
import { StepBrowse, StepRegister, StepPlay } from "@/components/illustrations/steps";
import { FormatClassical, FormatRapid, FormatBlitz } from "@/components/illustrations/formats";
import {
  BenefitFocus,
  BenefitPlanning,
  BenefitPatience,
} from "@/components/illustrations/benefits";
import { EmptyTournaments } from "@/components/illustrations/empty-states";

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
    body: "Clear categories from Under 11 through Above 19, set automatically from the player's year of birth.",
  },
];

const STEPS = [
  {
    Icon: StepBrowse,
    title: "Browse what's open",
    body: "Check upcoming tournaments and class programs — dates, venues, formats, and entry fees are all listed up front.",
  },
  {
    Icon: StepRegister,
    title: "Register in minutes",
    body: "Fill in your details, pick your age category, and submit. No FIDE rating or prior tournament experience needed.",
  },
  {
    Icon: StepPlay,
    title: "Play & keep improving",
    body: "Show up and compete, then carry the momentum into an online class to sharpen your game for the next event.",
  },
];

const FORMATS = [
  {
    Icon: FormatClassical,
    title: "Classical",
    body: "Longer time controls that reward deep calculation — the traditional tournament format.",
  },
  {
    Icon: FormatRapid,
    title: "Rapid",
    body: "Faster games that still leave room to think, ideal for one-day events and first-timers.",
  },
  {
    Icon: FormatBlitz,
    title: "Blitz",
    body: "Quick-fire games for players who want fast-paced, high-energy competition.",
  },
];

const BENEFITS = [
  {
    Icon: BenefitFocus,
    title: "Sharper focus",
    body: "Every move demands attention — regular play builds the habit of concentrating for longer stretches.",
  },
  {
    Icon: BenefitPlanning,
    title: "Better planning",
    body: "Thinking several moves ahead carries over into how kids and adults plan schoolwork, projects, and goals.",
  },
  {
    Icon: BenefitPatience,
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
  beginner: {
    label: "Beginner",
    body: "Piece movement, basic tactics, opening principles, and the rules of the game.",
  },
  intermediate: {
    label: "Intermediate",
    body: "Deeper tactics, middle-game strategy, endgame technique, and opening theory.",
  },
  advanced: {
    label: "Advanced",
    body: "Database-driven preparation, complex endgames, and tournament-ready coaching.",
  },
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
    q: "How is my age category decided?",
    a: "Automatically, from the year of birth you enter when you register: Under 11, Under 19 or Above 19, based on your age in the tournament year.",
  },
  {
    q: "How do online classes work?",
    a: "Classes run live online in small groups or one-on-one, from beginner fundamentals through advanced tactics. Check the Online Classes page for current schedules.",
  },
];

export default async function HomePage() {
  const [tournaments, allClasses, allPublished, curatedGallery, highlightVideos, nextTournament] =
    await Promise.all([
      prisma.tournament.findMany({
        where: { status: "published" },
        orderBy: { startDate: "asc" },
        take: 3,
        include: { _count: { select: { registrations: true } } },
      }),
      prisma.classProgram.findMany({ orderBy: { createdAt: "asc" } }),
      prisma.tournament.findMany({ where: { status: "published" } }),
      getGallery({ take: 6 }),
      getGallery({ section: "HIGHLIGHTS", take: 10 }),
      getNextTournament(),
    ]);

  const hallOfChampions = await getHallOfChampions();
  const nextTournamentTimeLeft = nextTournament
    ? timeUntilEndOfDayIST(nextTournament.registrationDeadline)
    : null;

  const classes = allClasses.slice(0, 3);
  const completedTournaments = allPublished.filter((t) => getTournamentStatus(t) === "completed");
  // Same four figures as the About page.
  const stats = [
    { Icon: KnightIcon, label: "Tournaments hosted", value: allPublished.length },
    {
      Icon: RookIcon,
      label: "Cities reached",
      value: new Set(allPublished.map((t) => t.city)).size,
    },
    { Icon: PawnIcon, label: "Class programs offered", value: allClasses.length },
    { Icon: TrophyIcon, label: "Tournaments completed", value: completedTournaments.length },
  ];

  const realGalleryItems = curatedGallery.items
    .filter((p) => p.mediaType !== "VIDEO")
    .map((p) => ({
      id: p.id,
      src: p.url,
      title: p.caption ?? "Nagarathar's Chess Championship",
    }));

  const shortsItems: ShortsItem[] = await Promise.all(
    highlightVideos.items
      .filter((row) => row.mediaType === "VIDEO" && row.videoProvider !== "NONE")
      .map(async (row) => ({
        id: row.id,
        caption: row.caption,
        playback: await resolveVideoPlayback({
          url: row.url,
          videoProvider: row.videoProvider as "YOUTUBE" | "DRIVE" | "S3",
          thumbnailUrl: row.thumbnailUrl,
        }),
      }))
  );
  const levelGroups = LEVEL_ORDER.map((level) => ({
    level,
    info: LEVEL_INFO[level],
    count: allClasses.filter((c) => c.level === level).length,
  }));

  return (
    <main>
      <section className="relative overflow-hidden bg-charcoal text-white">
        <div className="chess-pattern absolute inset-0" />
        <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-gold/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 left-1/3 h-80 w-80 rounded-full bg-gold/10 blur-3xl" />

        <Container className="relative grid gap-10 py-16 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:gap-12 lg:py-28">
          <div className="flex flex-col items-start gap-6">
            <h1 className="h1 animate-fade-up max-w-xl" style={{ animationDelay: "80ms" }}>
              Chess tournaments and coaching, built for your community.
            </h1>
            <p
              className="animate-fade-up max-w-lg text-lg text-white/75"
              style={{ animationDelay: "160ms" }}
            >
              Register for upcoming local tournaments, join online chess classes, and represent your
              community — no rating required to get started.
            </p>
            <div
              className="animate-fade-up flex flex-wrap gap-4"
              style={{ animationDelay: "240ms" }}
            >
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

            <div
              className="animate-fade-up w-full max-w-md rounded-xl border border-white/15 bg-white/5 p-5 backdrop-blur-sm"
              style={{ animationDelay: "360ms" }}
            >
              {nextTournament && nextTournamentTimeLeft ? (
                <>
                  <p className="text-xs font-semibold uppercase tracking-wide text-white/60">
                    Registration closes for {nextTournament.title}
                  </p>
                  <div className="mt-3">
                    <Countdown
                      target={nextTournament.registrationDeadline.toISOString()}
                      initialTimeLeft={nextTournamentTimeLeft}
                    />
                  </div>
                  <LinkButton href={registerPath(nextTournament.slug)} className="mt-4">
                    Register Now
                  </LinkButton>
                </>
              ) : (
                <>
                  <p className="text-xs font-semibold uppercase tracking-wide text-white/60">
                    Get started
                  </p>
                  <p className="mt-2 text-lg font-semibold text-white">
                    Your first tournament is free to enter.
                  </p>
                </>
              )}
            </div>
          </div>

          <div
            className="animate-fade-up mx-auto w-full max-w-sm lg:max-w-none"
            style={{ animationDelay: "200ms" }}
          >
            <HeroBoard className="h-auto w-full" />
          </div>
        </Container>
      </section>

      {/* Scoreboard overlapping the hero's bottom edge: each tile's content rises
          in one after another (CSS only, skipped under reduced motion) and the
          figures count up when they scroll into view. */}
      <section className="relative z-10 -mt-8 lg:-mt-12">
        <Container>
          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl bg-border shadow-md ring-1 ring-border lg:grid-cols-4">
            {stats.map((s, i) => (
              <div key={s.label} className="bg-card px-4 py-6 sm:py-8">
                <div
                  className="animate-fade-up flex flex-col items-center text-center"
                  style={{ animationDelay: `${200 + i * 100}ms` }}
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-charcoal text-gold">
                    <s.Icon className="h-6 w-6" aria-hidden="true" />
                  </span>
                  <p className="mt-4 font-display text-4xl font-bold leading-none tabular-nums text-charcoal sm:text-5xl">
                    <CountUp value={s.value} />
                  </p>
                  <p className="text-small mt-2 text-muted">{s.label}</p>
                </div>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <Section
        title="How It Works"
        subtitle="From browsing to your first move, in three simple steps."
        className="chess-pattern-light bg-background"
      >
        <div className="grid gap-6 sm:grid-cols-3">
          {STEPS.map((s, i) => (
            <div
              key={s.title}
              className="relative rounded-lg border border-border bg-card p-6 shadow-sm"
            >
              <div className="flex items-start justify-between">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gold/15 text-lg font-bold text-gold-ink">
                  {i + 1}
                </span>
                <s.Icon className="h-14 w-14" aria-hidden="true" />
              </div>
              <h3 className="h3 mt-4 text-foreground">{s.title}</h3>
              <p className="text-small mt-2 text-muted">{s.body}</p>
            </div>
          ))}
        </div>
      </Section>

      <Container className="py-16">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="h2 text-charcoal">Upcoming Tournaments</h2>
          <Link href="/tournaments" className="text-sm font-semibold text-gold-ink hover:underline">
            View all &rarr;
          </Link>
        </div>
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
      </Container>

      <Section
        title="Programs By Level"
        subtitle="A structured path from your first game to tournament-ready play."
        className="bg-card"
      >
        <div className="grid gap-6 sm:grid-cols-3">
          {levelGroups.map((g, i) => (
            <div
              key={g.level}
              className="rounded-lg border border-border p-6 text-center shadow-sm"
            >
              <Badge tone={i === 1 ? "gold-ink" : "charcoal"}>{g.info.label}</Badge>
              <p className="text-small mt-3 text-muted">{g.info.body}</p>
              {g.count > 0 ? (
                <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-foreground/40">
                  {g.count} program{g.count === 1 ? "" : "s"} available
                </p>
              ) : (
                <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-muted">
                  Coming soon
                </p>
              )}
            </div>
          ))}
        </div>
      </Section>

      <Container className="py-16">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="h2 text-charcoal">Online Tutoring &amp; Classes</h2>
          <Link href="/classes" className="text-sm font-semibold text-gold-ink hover:underline">
            View all &rarr;
          </Link>
        </div>
        {classes.length === 0 ? (
          <ClassWaitlistForm />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {classes.map((c) => (
              <Card key={c.id} className="h-full p-5">
                <Badge tone="gold-ink">{c.level}</Badge>
                <h3 className="h3 mt-2 text-foreground">{c.title}</h3>
                <p className="text-small mt-2 text-muted">{c.scheduleText}</p>
                <Link
                  href="/classes"
                  className="mt-3 inline-block text-sm font-semibold text-charcoal hover:underline"
                >
                  Learn more &rarr;
                </Link>
              </Card>
            ))}
          </div>
        )}
      </Container>

      <Section
        title="Tournament Formats"
        subtitle="We run events across every time control, so there's a format for how you like to play."
      >
        <div className="grid gap-6 sm:grid-cols-3">
          {FORMATS.map((f) => (
            <div
              key={f.title}
              className="rounded-lg border border-border bg-card p-6 text-center shadow-sm"
            >
              <f.Icon className="mx-auto h-14 w-14" />
              <h3 className="h3 mt-4 text-foreground">{f.title}</h3>
              <p className="text-small mt-2 text-muted">{f.body}</p>
            </div>
          ))}
        </div>
      </Section>

      {hallOfChampions.length > 0 && (
        <Section
          eyebrow="Hall of Champions"
          title="Recent Winners"
          subtitle="Champions from our most recently concluded tournaments."
          tone="dark"
          background={
            <>
              <Image
                src={HERO_MOMENT_PHOTO.src}
                alt=""
                fill
                sizes="100vw"
                className="object-cover opacity-25"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-charcoal/80 via-charcoal/90 to-charcoal" />
            </>
          }
        >
          <Reveal className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {hallOfChampions.map((entry) => (
              <div
                key={entry.tournament.slug}
                className="rounded-lg border border-white/15 bg-white/5 p-6 backdrop-blur-sm"
              >
                <Link href={`/tournaments/${entry.tournament.slug}/results`} className="block">
                  <TrophyIcon className="h-8 w-8 text-gold" />
                  <h3 className="h3 mt-3 text-white">{entry.tournament.title}</h3>
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
              </div>
            ))}
          </Reveal>
        </Section>
      )}

      <Section
        title="Why Chess?"
        subtitle="The skills chess builds carry well beyond the board."
        className="bg-card"
      >
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {BENEFITS.map((b) => (
            <div
              key={b.title}
              className="rounded-lg border border-border p-5 text-center shadow-sm"
            >
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-charcoal/10 text-charcoal">
                <b.Icon className="h-8 w-8" strokeWidth={1.1} />
              </span>
              <h3 className="h3 mt-3 text-foreground">{b.title}</h3>
              <p className="text-small mt-2 text-muted">{b.body}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section
        title="Why Choose Us"
        subtitle="Whatever brought you here, we've built this around making chess accessible."
      >
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {PROMISES.map((p) => (
            <Card key={p.title} className="h-full p-5">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gold/10 text-gold-ink">
                ✓
              </span>
              <h3 className="h3 mt-3 text-foreground">{p.title}</h3>
              <p className="text-small mt-2 text-muted">{p.body}</p>
            </Card>
          ))}
        </div>
      </Section>

      {realGalleryItems.length > 0 && (
        <section className="bg-card py-16">
          <Container>
            <div className="mb-8 flex items-center justify-between">
              <h2 className="h2 text-charcoal">From Our Gallery</h2>
              <Link
                href="/gallery"
                className="text-sm font-semibold text-gold-ink hover:underline"
              >
                View all &rarr;
              </Link>
            </div>
            <Reveal className="grid gap-6 sm:grid-cols-3">
              {realGalleryItems.map((t) => (
                <Link
                  key={t.id}
                  href="/gallery"
                  className="block overflow-hidden rounded-lg border border-border bg-background"
                >
                  <div className="relative h-40 w-full bg-gray-100">
                    <Image
                      src={t.src}
                      alt={t.title}
                      fill
                      sizes="(max-width: 640px) 100vw, 33vw"
                      className="object-cover"
                    />
                  </div>
                </Link>
              ))}
            </Reveal>
          </Container>
        </section>
      )}

      {shortsItems.length > 0 && (
        <section className="bg-background py-16">
          <Container>
            <div className="mb-8 flex items-center justify-between">
              <h2 className="h2 text-charcoal">Video Highlights</h2>
              <Link href="/gallery" className="text-sm font-semibold text-gold-ink hover:underline">
                View all &rarr;
              </Link>
            </div>
            <ShortsRow items={shortsItems} />
          </Container>
        </section>
      )}

      <Section title="Frequently Asked Questions" className="bg-card">
        <div className="mx-auto max-w-3xl space-y-6">
          {FAQS.map((f) => (
            <div key={f.q} className="border-b border-border pb-6 last:border-0">
              <h3 className="h3 text-foreground">{f.q}</h3>
              <p className="text-small mt-2 text-muted">{f.a}</p>
            </div>
          ))}
        </div>
      </Section>

      <section className="mx-auto max-w-4xl px-4 py-16 text-center">
        <h2 className="h2 text-charcoal">Our Goal</h2>
        <p className="text-body mt-4 text-foreground/80">
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

      <section className="relative overflow-hidden bg-charcoal py-14 text-center text-white">
        <Image src={CTA_PHOTO.src} alt="" fill sizes="100vw" className="object-cover opacity-30" />
        <div className="absolute inset-0 bg-charcoal/70" />
        <div className="relative mx-auto max-w-2xl px-4">
          <h2 className="h2">Ready to make your first move?</h2>
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
