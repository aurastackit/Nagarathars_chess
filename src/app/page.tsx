import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { LinkButton, Card, Badge, Section, EmptyState } from "@/components/ui";
import { Reveal } from "@/components/reveal";
import { CountUp } from "@/components/count-up";
import { getNextTournament } from "@/lib/next-tournament";
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
import { LiveBoard } from "@/components/hero/live-board";
import { TournamentChip } from "@/components/hero/tournament-chip";
import { VignetteCard } from "@/components/illustrations/vignettes/vignette-card";
import { BrowseVignette } from "@/components/illustrations/how-it-works/browse-vignette";
import { RegisterVignette } from "@/components/illustrations/how-it-works/register-vignette";
import { PlayVignette } from "@/components/illustrations/how-it-works/play-vignette";
import { TimeControlVignette } from "@/components/illustrations/tournament-formats/time-control-vignette";
import {
  FocusVignette,
  PlanningVignette,
  PatienceVignette,
  ResilienceVignette,
} from "@/components/illustrations/why-chess";
import { DrawUnderline } from "@/components/draw-underline";
import { ScrollMotion } from "@/components/scroll-motion";
import { pageMetadata } from "@/lib/seo";
import { EmptyTournaments } from "@/components/illustrations/empty-states";

export const dynamic = "force-dynamic";

export const metadata = pageMetadata({
  title: "Chess Tournaments & Classes in Chennai | Nagarathar's Chess",
  description:
    "Free chess tournaments in Chennai for kids and adults – no FIDE rating needed. Register online for Nagarathar's Chess Championship and join online classes.",
  path: "/",
});

function ViewAll({ href }: { href: string }) {
  return (
    <Link href={href} className="text-sm font-semibold text-gold-ink hover:underline">
      View all &rarr;
    </Link>
  );
}

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
    Vignette: BrowseVignette,
    title: "Browse what's open",
    body: "Check upcoming tournaments and class programs — dates, venues, formats, and entry fees are all listed up front.",
  },
  {
    Vignette: RegisterVignette,
    title: "Register in minutes",
    body: "Fill in your details, pick your age category, and submit. No FIDE rating or prior tournament experience needed.",
  },
  {
    Vignette: PlayVignette,
    title: "Play & keep improving",
    body: "Show up and compete, then carry the momentum into an online class to sharpen your game for the next event.",
  },
];

// `share` = each player's time as a share of an hour, drawn as the clock's gold arc.
// Kickers follow FIDE's bands: blitz ≤10 min, rapid 10–60 min, classical 60+ min per player.
const FORMATS = [
  {
    share: 0.92,
    kicker: "60+ min each",
    title: "Classical",
    body: "Longer time controls that reward deep calculation — the traditional tournament format.",
  },
  {
    share: 25 / 60,
    kicker: "10–60 min each",
    title: "Rapid",
    body: "Faster games that still leave room to think, ideal for one-day events and first-timers.",
  },
  {
    share: 5 / 60,
    kicker: "Up to 10 min each",
    title: "Blitz",
    body: "Quick-fire games for players who want fast-paced, high-energy competition.",
  },
];

const BENEFITS = [
  {
    Vignette: FocusVignette,
    title: "Sharper focus",
    body: "Every move demands attention — regular play builds the habit of concentrating for longer stretches.",
  },
  {
    Vignette: PlanningVignette,
    title: "Better planning",
    body: "Thinking several moves ahead carries over into how kids and adults plan schoolwork, projects, and goals.",
  },
  {
    Vignette: PatienceVignette,
    title: "Patience under pressure",
    body: "Tournament games teach players to stay calm, weigh options, and avoid rushed decisions.",
  },
  {
    Vignette: ResilienceVignette,
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
  // All in parallel: each query is a full round trip to the database.
  const [
    tournaments,
    allClasses,
    allPublished,
    curatedGallery,
    highlightVideos,
    nextTournament,
    hallOfChampions,
  ] = await Promise.all([
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
    getHallOfChampions(),
  ]);
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

  // Light sections alternate ivory / card so neighbours never blend into one
  // band; sections that don't render (no gallery, no videos) don't take a turn.
  // Every section after the first is far below the fold, so it defers its
  // rendering work until it's near the viewport (.defer-render in globals.css).
  let band = 0;
  const nextBand = () => {
    const tone = band % 2 === 0 ? "bg-background" : "bg-card";
    return band++ === 0 ? tone : `${tone} defer-render`;
  };

  return (
    <main>
      <section className="relative overflow-hidden bg-charcoal text-white">
        <svg className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true">
          <defs>
            <pattern id="athangudi-tile" width="64" height="64" patternUnits="userSpaceOnUse">
              <path d="M32 4 60 32 32 60 4 32Z" fill="none" stroke="var(--gold)" strokeWidth="1" />
              <path
                d="M32 18 46 32 32 46 18 32Z"
                fill="none"
                stroke="var(--gold)"
                strokeWidth="1"
              />
              <circle cx="32" cy="32" r="1.6" fill="var(--gold)" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#athangudi-tile)" opacity="0.05" />
        </svg>
        {/* Upper-right light — the same direction the Why Chess vignettes are lit from. */}
        <div className="hero-light pointer-events-none absolute -top-48 right-0 h-[760px] w-[760px] translate-x-1/3" />

        <div className="relative mx-auto max-w-6xl px-4 pb-[clamp(3.5rem,9svh,5.5rem)] pt-[clamp(2.5rem,7svh,4.5rem)]">
          <div className="grid gap-10 lg:grid-cols-12 lg:items-center lg:gap-8">
            <div className="flex flex-col items-start gap-5 lg:col-span-6">
              <h1
                className="animate-fade-up max-w-xl font-display font-bold tracking-tight"
                style={{
                  fontSize: "clamp(2.5rem, 1.7rem + 3vw, 4rem)",
                  lineHeight: 1.05,
                  animationDelay: "80ms",
                }}
              >
                Chess tournaments and coaching, built for your community.
              </h1>
              <p
                className="animate-fade-up max-w-[52ch] text-lg text-white/75"
                style={{ animationDelay: "160ms" }}
              >
                Register for upcoming local tournaments, join online chess classes, and represent
                your community — no rating required to get started.
              </p>
              <div
                className="animate-fade-up flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:gap-4"
                style={{ animationDelay: "240ms" }}
              >
                <LinkButton surface="dark"
                  href="/tournaments"
                  className="w-full py-3 sm:w-auto"
                >
                  View Tournaments
                </LinkButton>
                <LinkButton surface="dark"
                  href="/classes"
                  variant="outline"
                  className="w-full border-white/40 py-3 text-white hover:bg-white hover:text-charcoal sm:w-auto"
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
            </div>

            <div
              className="animate-fade-up lg:col-span-6"
              style={{ animationDelay: "200ms" }}
            >
              {/* Board width tracks viewport height (svh) so board + chip stay above
                  the fold on short laptop screens, never dropping below 480px. */}
              <div className="mx-auto w-full max-w-[420px] lg:max-w-[clamp(480px,calc(100svh-280px),520px)]">
                <LiveBoard className="w-full" />
                <TournamentChip
                  tournament={nextTournament}
                  timeLeft={nextTournamentTimeLeft}
                  className="relative z-10 mt-4 lg:-ml-6 lg:-mt-6 lg:w-[23rem]"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Scoreboard overlapping the hero's bottom edge: each tile's content rises
          in one after another (CSS only, skipped under reduced motion) and the
          figures count up when they scroll into view. */}
      <section className="relative z-10 -mt-8 lg:-mt-12">
        <div className="mx-auto max-w-6xl px-4">
          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg bg-border shadow-md ring-1 ring-border lg:grid-cols-4">
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
        </div>
      </section>

      <Section
        eyebrow="Getting started"
        title={<DrawUnderline>How it works</DrawUnderline>}
        subtitle="From browsing to your first move, in three simple steps."
        align="left"
        className={nextBand()}
      >
        <div className="grid gap-6 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <VignetteCard
              key={s.title}
              kicker={String(i + 1).padStart(2, "0")}
              title={s.title}
              body={s.body}
              vignette={<s.Vignette />}
            />
          ))}
        </div>
      </Section>

      <Section
        title="Upcoming tournaments"
        align="left"
        action={<ViewAll href="/tournaments" />}
        className={nextBand()}
      >
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
      </Section>

      <Section
        title="Programs by level"
        subtitle="A structured path from your first game to tournament-ready play."
        align="left"
        className={nextBand()}
      >
        <div className="grid gap-6 sm:grid-cols-3">
          {levelGroups.map((g, i) => (
            <div
              key={g.level}
              className="rounded-lg border border-border bg-card p-6 shadow-sm"
            >
              <Badge tone={i === 1 ? "gold-ink" : "charcoal"}>{g.info.label}</Badge>
              <p className="text-small mt-3 text-muted">{g.info.body}</p>
              {g.count > 0 ? (
                <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-muted">
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

      <Section
        title="Online tutoring & classes"
        align="left"
        action={<ViewAll href="/classes" />}
        className={nextBand()}
      >
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
      </Section>

      <Section
        eyebrow="Time controls"
        title="Tournament formats"
        subtitle="We run events across every time control, so there's a format for how you like to play."
        align="left"
        className={nextBand()}
      >
        <div className="grid gap-6 md:grid-cols-3">
          {FORMATS.map((f) => (
            <VignetteCard
              key={f.title}
              kicker={f.kicker}
              title={f.title}
              body={f.body}
              vignette={<TimeControlVignette share={f.share} />}
            />
          ))}
        </div>
      </Section>

      {hallOfChampions.length > 0 && (
        <Section
          eyebrow="Hall of Champions"
          title="Recent winners"
          subtitle="Champions from our most recently concluded tournaments."
          align="left"
          tone="dark"
          className="defer-render"
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
        eyebrow="Why chess"
        title={<DrawUnderline>Skills that carry beyond the board</DrawUnderline>}
        subtitle="Four habits every game quietly builds — in children and adults alike."
        align="left"
        className={nextBand()}
      >
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {BENEFITS.map((b, i) => (
            <VignetteCard
              key={b.title}
              kicker={String(i + 1).padStart(2, "0")}
              title={b.title}
              body={b.body}
              vignette={<b.Vignette />}
            />
          ))}
        </div>
      </Section>

      <Section
        title="Why choose us"
        subtitle="Whatever brought you here, we've built this around making chess accessible."
        align="left"
        className={nextBand()}
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
        <Section
          title="From our gallery"
          align="left"
          action={<ViewAll href="/gallery" />}
          className={nextBand()}
        >
          <Reveal className="grid gap-6 sm:grid-cols-3">
            {realGalleryItems.map((t) => (
              <Link
                key={t.id}
                href="/gallery"
                className="block overflow-hidden rounded-lg border border-border bg-background"
              >
                <div className="relative h-40 w-full bg-background">
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
        </Section>
      )}

      {shortsItems.length > 0 && (
        <Section
          title="Video highlights"
          align="left"
          action={<ViewAll href="/gallery" />}
          className={nextBand()}
        >
          <ShortsRow items={shortsItems} />
        </Section>
      )}

      <Section title="Frequently asked questions" align="left" className={nextBand()}>
        <div className="max-w-3xl space-y-6">
          {FAQS.map((f) => (
            <div key={f.q} className="border-b border-border pb-6 last:border-0">
              <h3 className="h3 text-foreground">{f.q}</h3>
              <p className="text-small mt-2 text-muted">{f.a}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section className={nextBand()}>
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="h2 text-charcoal">Our goal</h2>
          <p className="text-body mt-4 text-muted">
            We want every local player who wants a first tournament experience to have one nearby,
            free of cost, and welcoming to beginners — with the coaching to keep growing long after
            the last move is played.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <LinkButton href="/about">Read Our Story</LinkButton>
            <LinkButton href="/contact" variant="outline">
              Get In Touch
            </LinkButton>
          </div>
        </div>
      </Section>

      <Section
        tone="dark"
        className="defer-render"
        background={
          <>
            <Image
              src={CTA_PHOTO.src}
              alt=""
              fill
              sizes="100vw"
              className="object-cover opacity-30"
            />
            <div className="absolute inset-0 bg-charcoal/70" />
          </>
        }
      >
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="h2">Ready to make your first move?</h2>
          <p className="text-body mt-4 text-white/75">
            Registration is free to start, and every event is built to welcome new players.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <LinkButton href="/tournaments" surface="dark">View Tournaments</LinkButton>
            <LinkButton surface="dark"
              href="/classes"
              variant="outline"
              className="border-white text-white hover:bg-white hover:text-charcoal"
            >
              Explore Classes
            </LinkButton>
          </div>
        </div>
      </Section>
      <ScrollMotion />
    </main>
  );
}
