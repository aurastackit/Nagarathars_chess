import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { LinkButton, Card, Badge, Section, EmptyState } from "@/components/ui";
import { Reveal } from "@/components/reveal";
import { CountUp } from "@/components/count-up";
import { getNextTournament } from "@/lib/next-tournament";
import { timeUntilEndOfDayIST } from "@/lib/countdown-format";
import { SEATS_TAKEN_COUNT } from "@/lib/tournament-status";
import { todayIST } from "@/lib/datetime";
import { getTournamentStats } from "@/lib/tournament-stats";
import { TournamentCard } from "@/components/tournament-card";
import { getHallOfChampions } from "@/lib/hall-of-champions";
import { ClassWaitlistForm } from "@/components/class-waitlist-form";
import { HERO_MOMENT_PHOTO } from "@/lib/featured-photos";
import { getGallery } from "@/lib/gallery";
import { resolveVideoPlayback, type ShortsItem } from "@/lib/video";
import { ShortsRow } from "@/components/shorts-row";
import { CTA_PHOTO } from "@/lib/stock-photos";
import { KnightIcon, PawnIcon, RookIcon, TrophyIcon } from "@/components/icons/chess-pieces";
import { CategoryCard } from "@/components/category-card";
import { AGE_CATEGORIES, ageRangeLabel, type AgeCategoryValue } from "@/lib/age-category";
import { HomeHero } from "@/components/hero/home-hero";
import { VignetteCard } from "@/components/illustrations/vignettes/vignette-card";
import { BrowseVignette } from "@/components/illustrations/how-it-works/browse-vignette";
import { RegisterVignette } from "@/components/illustrations/how-it-works/register-vignette";
import { PlayVignette } from "@/components/illustrations/how-it-works/play-vignette";
import {
  FocusVignette,
  PlanningVignette,
  PatienceVignette,
  ResilienceVignette,
} from "@/components/illustrations/why-chess";
import { DrawUnderline } from "@/components/draw-underline";
import { ScrollMotion } from "@/components/scroll-motion";
import { pageMetadata } from "@/lib/seo";
import { CLASSES_ENABLED } from "@/lib/features";
import { faqJsonLd } from "@/lib/seo/structured-data";
import { JsonLd } from "@/components/json-ld";
import { FAQS } from "@/data/faqs";
import { EmptyTournaments } from "@/components/illustrations/empty-states";

// Static, regenerated at most every minute or on demand after an admin
// change (lib/revalidate-public).
// Rendered on every request: seat counts and tournament status must be current,
// and Amplify Hosting never regenerates static snapshots (they only change on
// deploy). The queries below run in parallel, so this costs one database round trip.
export const dynamic = "force-dynamic";

export const metadata = CLASSES_ENABLED
  ? pageMetadata({
      title: "Chess Tournaments & Classes in Chennai | Nagarathar's Chess",
      description:
        "Free chess tournaments in Chennai for kids and adults – no FIDE rating needed. Register online for Nagarathar's Chess Championship and join online classes.",
      path: "/",
    })
  : pageMetadata({
      title: "Free Chess Tournaments in Chennai | Nagarathar's Chess",
      description:
        "Free chess tournaments in Chennai for kids and adults – no FIDE rating needed. Register online for Nagarathar's Chess Championship. Online classes coming soon.",
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
  CLASSES_ENABLED
    ? {
        title: "Coaching at every level",
        body: "Online classes run from beginner fundamentals to advanced tactics, group or one-on-one.",
      }
    : {
        title: "Coaching coming soon",
        body: "Online classes from beginner to advanced are on the way.",
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
    body: CLASSES_ENABLED
      ? "Check upcoming tournaments and class programs — dates, venues, formats, and entry fees are all listed up front."
      : "Check upcoming tournaments — dates, venues, formats, and entry fees are all listed up front.",
  },
  {
    Vignette: RegisterVignette,
    title: "Register in minutes",
    body: "Fill in your details, pick your age category, and submit. No FIDE rating or prior tournament experience needed.",
  },
  {
    Vignette: PlayVignette,
    title: "Play & keep improving",
    body: CLASSES_ENABLED
      ? "Show up and compete, then carry the momentum into an online class to sharpen your game for the next event."
      : "Show up and compete, then bring what you learned to the next event and keep sharpening your game.",
  },
];

// Who each age category is for. The ages come from AGE_CATEGORIES / ageRangeLabel, never from here.
const CATEGORY_BODY: Record<AgeCategoryValue, string> = {
  under_11: "Our youngest players: a friendly first step into tournament chess.",
  "11_to_18": "School-age players ready to test themselves against others their own age.",
  above_19: "Adults and experienced players, from first-timers to club regulars.",
};

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
      // Only tournaments that haven't ended: a past one never shows as "upcoming".
      where: { status: "published", endDate: { gte: todayIST() } },
      orderBy: { startDate: "asc" },
      take: 3,
      include: SEATS_TAKEN_COUNT,
    }),
    // No class data on public pages while classes are coming soon (lib/features).
    CLASSES_ENABLED
      ? prisma.classProgram.findMany({ orderBy: { createdAt: "asc" } })
      : Promise.resolve([]),
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
  const tournamentStats = getTournamentStats(allPublished);
  // Same figures as the About page (lib/tournament-stats).
  const stats = [
    { Icon: KnightIcon, label: "Tournaments hosted", value: tournamentStats.hosted },
    { Icon: RookIcon, label: "Cities reached", value: tournamentStats.cities },
    ...(CLASSES_ENABLED
      ? [{ Icon: PawnIcon, label: "Class programs offered", value: allClasses.length }]
      : []),
    { Icon: TrophyIcon, label: "Tournaments completed", value: tournamentStats.completed },
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
      <HomeHero nextTournament={nextTournament} timeLeft={nextTournamentTimeLeft} />

      {/* Scoreboard overlapping the hero's bottom edge: each tile's content rises
          in one after another (CSS only, skipped under reduced motion) and the
          figures count up when they scroll into view. */}
      <section className="relative z-10 -mt-8 lg:-mt-12">
        <div className="mx-auto max-w-6xl px-4">
          <div
            className={`grid gap-px overflow-hidden rounded-lg bg-border shadow-md ring-1 ring-border ${stats.length === 4 ? "grid-cols-2 lg:grid-cols-4" : "grid-cols-3"}`}
          >
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

      {CLASSES_ENABLED ? (
        <>
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
        </>
      ) : (
        <section className={`py-10 ${nextBand()}`}>
          <div className="mx-auto max-w-6xl px-4">
            <div className="flex flex-col items-start gap-4 rounded-lg border border-gold/30 bg-gold/5 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-gold-ink">
                  Coming soon
                </p>
                <h2 className="mt-1 text-lg font-semibold text-charcoal">
                  Online classes are coming soon – join the list to hear first
                </h2>
              </div>
              <LinkButton href="/classes#notify" className="flex-none">
                Get notified
              </LinkButton>
            </div>
          </div>
        </section>
      )}

      <Section
        eyebrow="Who can play"
        title="Age categories"
        subtitle="Every tournament is played in age groups, so players compete with others their own age."
        align="left"
        className={nextBand()}
      >
        <div className="grid gap-6 md:grid-cols-3">
          {AGE_CATEGORIES.map((c) => (
            <CategoryCard
              key={c.value}
              category={c.value}
              kicker={ageRangeLabel(c.value)}
              title={c.label}
              body={CATEGORY_BODY[c.value]}
            />
          ))}
        </div>
        <p className="text-small mt-6 text-muted">
          Age is counted by year of birth in the tournament year, and your category is set
          automatically from it.
        </p>
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
        <JsonLd data={faqJsonLd(FAQS)} />
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
            {CLASSES_ENABLED
              ? "We want every local player who wants a first tournament experience to have one nearby, free of cost, and welcoming to beginners — with the coaching to keep growing long after the last move is played."
              : "We want every local player who wants a first tournament experience to have one nearby, free of cost, and welcoming to beginners — and, soon, online coaching to keep growing long after the last move is played."}
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
            <LinkButton href="/tournaments" surface="dark">
              View Tournaments
            </LinkButton>
            <LinkButton
              surface="dark"
              href={CLASSES_ENABLED ? "/classes" : "/gallery"}
              variant="outline"
              className="border-white text-white hover:bg-white hover:text-charcoal"
            >
              {CLASSES_ENABLED ? "Explore Classes" : "See our gallery"}
            </LinkButton>
          </div>
        </div>
      </Section>
      <ScrollMotion />
    </main>
  );
}
