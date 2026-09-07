import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { LinkButton, Card, Badge } from "@/components/ui";
import { HeroSlideshow } from "@/components/hero-slideshow";
import { formatDateRange } from "@/lib/format";
import { generateGalleryPlaceholders } from "@/lib/gallery-placeholders";
import { GalleryPlaceholderTile } from "@/components/gallery-tile";
import { Reveal } from "@/components/reveal";
import { CountUp } from "@/components/count-up";
import { Countdown } from "@/components/countdown";
import { ProfileGrid, type Profile } from "@/components/profile-modal";

export const dynamic = "force-dynamic";

const COACHES: Profile[] = [
  {
    id: "coach-arun",
    name: "Coach Arun",
    role: "Head Coach — Beginner & Group Classes",
    initials: "CA",
    bio: "Leads our beginner fundamentals program, covering piece movement, basic tactics, and opening principles for first-time players.",
    facts: [
      { label: "FIDE Rating", value: "1850" },
      { label: "Experience", value: "6+ years" },
      { label: "Specialty", value: "Beginners" },
    ],
    highlights: [
      "Trained 100+ first-time players from zero chess knowledge",
      "Runs the Tue–Fri group fundamentals track",
      "Also available for 1-on-1 beginner sessions",
    ],
  },
  {
    id: "coach-priya",
    name: "Coach Priya",
    role: "Intermediate Tactics Coach",
    initials: "CP",
    bio: "Works with intermediate players on tactics, middle-game strategy, and endgame technique.",
    facts: [
      { label: "FIDE Rating", value: "2010" },
      { label: "Experience", value: "8+ years" },
      { label: "Specialty", value: "Tactics" },
    ],
    highlights: [
      "Focuses on pattern recognition and calculation drills",
      "Helps players bridge from casual to competitive play",
      "Weekend 1-on-1 sessions available",
    ],
  },
  {
    id: "coach-karthik",
    name: "Coach Karthik",
    role: "Advanced Tournament Prep",
    initials: "CK",
    bio: "Prepares competitive players for tournaments with database-driven analysis and personalized improvement plans.",
    facts: [
      { label: "FIDE Rating", value: "2150" },
      { label: "Experience", value: "10+ years" },
      { label: "Specialty", value: "Tournament prep" },
    ],
    highlights: [
      "Builds personalized opening repertoires with players",
      "Reviews tournament games move-by-move afterward",
      "Works closely with players ahead of state-level events",
    ],
  },
  {
    id: "coach-meena",
    name: "Coach Meena",
    role: "Youth & Kids Coach",
    initials: "CM",
    bio: "Specializes in introducing young children to chess through games, puzzles, and simple rule-based lessons.",
    facts: [
      { label: "FIDE Rating", value: "1720" },
      { label: "Experience", value: "5+ years" },
      { label: "Specialty", value: "Kids" },
    ],
    highlights: [
      "Uses puzzle-based, game-first teaching for young kids",
      "Keeps sessions short and engaging for shorter attention spans",
      "Popular with first-time parents new to chess",
    ],
  },
  {
    id: "coach-suresh",
    name: "Coach Suresh",
    role: "Endgame Specialist",
    initials: "CS",
    bio: "Focuses on endgame studies and technique, helping players convert small advantages into full points.",
    facts: [
      { label: "FIDE Rating", value: "1980" },
      { label: "Experience", value: "7+ years" },
      { label: "Specialty", value: "Endgames" },
    ],
    highlights: [
      "Runs weekly endgame study sessions",
      "Known for turning drawn positions into wins",
      "Sunday morning slots available",
    ],
  },
];

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
    glyph: "♞",
    title: "Browse what's open",
    body: "Check upcoming tournaments and class programs — dates, venues, formats, and entry fees are all listed up front.",
  },
  {
    glyph: "♝",
    title: "Register in minutes",
    body: "Fill in your details, pick your age category, and submit. No FIDE rating or prior tournament experience needed.",
  },
  {
    glyph: "♜",
    title: "Play & keep improving",
    body: "Show up and compete, then carry the momentum into an online class to sharpen your game for the next event.",
  },
];

const FORMATS = [
  {
    glyph: "♚",
    title: "Classical",
    body: "Longer time controls that reward deep calculation — the traditional tournament format.",
  },
  {
    glyph: "♛",
    title: "Rapid",
    body: "Faster games that still leave room to think, ideal for one-day events and first-timers.",
  },
  {
    glyph: "♟",
    title: "Blitz",
    body: "Quick-fire games for players who want fast-paced, high-energy competition.",
  },
];

const BENEFITS = [
  {
    glyph: "♟",
    title: "Sharper focus",
    body: "Every move demands attention — regular play builds the habit of concentrating for longer stretches.",
  },
  {
    glyph: "♞",
    title: "Better planning",
    body: "Thinking several moves ahead carries over into how kids and adults plan schoolwork, projects, and goals.",
  },
  {
    glyph: "♝",
    title: "Patience under pressure",
    body: "Tournament games teach players to stay calm, weigh options, and avoid rushed decisions.",
  },
  {
    glyph: "♜",
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
    }),
    prisma.classProgram.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.tournament.findMany({ where: { status: "published" } }),
    prisma.tournament.findMany({
      where: { status: "published", posterImageUrl: { not: null } },
      orderBy: { startDate: "desc" },
      take: 3,
    }),
    prisma.tournament.findFirst({
      where: { status: "published", registrationDeadline: { gt: new Date() } },
      orderBy: { registrationDeadline: "asc" },
    }),
  ]);

  const classes = allClasses.slice(0, 3);
  const cityList = [...new Set(allPublished.map((t) => t.city))];
  const stats = [
    { label: "Tournaments hosted", value: allPublished.length },
    { label: "Cities reached", value: cityList.length },
    { label: "Class programs", value: allClasses.length },
  ];

  const realGalleryItems = galleryItems.slice(0, 6);
  const galleryPlaceholders = generateGalleryPlaceholders(Math.max(0, 6 - realGalleryItems.length));

  const levelGroups = LEVEL_ORDER.map((level) => ({
    level,
    info: LEVEL_INFO[level],
    count: allClasses.filter((c) => c.level === level).length,
  })).filter((g) => g.count > 0);

  return (
    <main>
      <section className="relative overflow-hidden bg-navy text-white">
        <HeroSlideshow />
        <div className="absolute inset-0 bg-navy/80" />
        <div className="chess-pattern absolute inset-0" />
        <div className="relative mx-auto flex max-w-6xl flex-col items-start gap-6 px-4 py-20">
          <span className="animate-fade-up rounded-full bg-orange px-3 py-1 text-xs font-semibold uppercase tracking-wide">
            Local players welcome
          </span>
          <h1 className="animate-fade-up max-w-2xl text-4xl font-bold leading-tight sm:text-5xl" style={{ animationDelay: "80ms" }}>
            Chess tournaments and coaching, built for your community.
          </h1>
          <p className="animate-fade-up max-w-xl text-lg text-white/80" style={{ animationDelay: "160ms" }}>
            Register for upcoming local tournaments, join online chess classes, and represent
            your community — no rating required to get started.
          </p>
          <div className="animate-fade-up flex flex-wrap gap-4" style={{ animationDelay: "240ms" }}>
            <LinkButton href="/tournaments">View Tournaments</LinkButton>
            <LinkButton href="/classes" variant="outline" className="border-white text-white hover:bg-white hover:text-navy">
              Explore Classes
            </LinkButton>
          </div>

          {nextTournament && (
            <div className="animate-fade-up mt-2 rounded-xl border border-white/15 bg-white/5 p-4" style={{ animationDelay: "320ms" }}>
              <p className="text-xs font-semibold uppercase tracking-wide text-white/60">
                Registration closes for {nextTournament.title}
              </p>
              <div className="mt-3">
                <Countdown target={nextTournament.registrationDeadline.toISOString()} />
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="border-b border-border bg-card">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 sm:grid-cols-3">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-3xl font-bold text-navy">
                <CountUp value={s.value} />
                {s.value > 0 ? "+" : ""}
              </p>
              <p className="mt-1 text-sm text-foreground/60">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="chess-pattern-light bg-background py-16">
        <div className="mx-auto max-w-6xl px-4">
          <Reveal className="text-center">
            <h2 className="text-2xl font-bold text-navy">How It Works</h2>
            <p className="mx-auto mt-2 max-w-xl text-foreground/60">
              From browsing to your first move, in three simple steps.
            </p>
          </Reveal>
          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            {STEPS.map((s, i) => (
              <Reveal key={s.title} delay={i * 120} className="relative rounded-lg border border-border bg-card p-6 shadow-sm">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gold/15 text-lg font-bold text-gold">
                  {i + 1}
                </span>
                <span className="pointer-events-none absolute right-4 top-4 text-4xl text-navy/10" aria-hidden="true">
                  {s.glyph}
                </span>
                <h3 className="mt-4 font-semibold text-foreground">{s.title}</h3>
                <p className="mt-2 text-sm text-foreground/60">{s.body}</p>
              </Reveal>
            ))}
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
            {tournaments.map((t, i) => (
              <Reveal key={t.id} delay={i * 100}>
                <Link href={`/tournaments/${t.slug}`}>
                  <Card className="group h-full overflow-hidden transition-shadow hover:shadow-md">
                    {t.posterImageUrl && (
                      <div className="relative h-40 w-full bg-gray-100">
                        <Image src={t.posterImageUrl} alt={t.title} fill className="object-contain" />
                      </div>
                    )}
                    <div className="p-4">
                      <Badge tone="navy">{t.format}</Badge>
                      <h3 className="mt-2 font-semibold text-foreground">{t.title}</h3>
                      <p className="mt-1 text-sm text-foreground/60">
                        {formatDateRange(t.startDate, t.endDate)} &middot; {t.city}
                      </p>
                      <span className="mt-3 inline-flex items-center rounded-full bg-orange px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors group-hover:bg-orange/90">
                        {t.entryFee === 0 ? "Register — Free Entry" : `Register — ₹${t.entryFee}`}
                      </span>
                    </div>
                  </Card>
                </Link>
              </Reveal>
            ))}
          </div>
        )}
      </section>

      {levelGroups.length > 0 && (
        <section className="bg-card py-16">
          <div className="mx-auto max-w-6xl px-4">
            <Reveal className="text-center">
              <h2 className="text-2xl font-bold text-navy">Programs By Level</h2>
              <p className="mx-auto mt-2 max-w-xl text-foreground/60">
                A structured path from your first game to tournament-ready play.
              </p>
            </Reveal>
            <div className="mt-10 grid gap-6 sm:grid-cols-3">
              {levelGroups.map((g, i) => (
                <Reveal key={g.level} delay={i * 120} className="rounded-lg border border-border p-6 text-center shadow-sm">
                  <Badge tone={i === 0 ? "orange" : i === 1 ? "gold" : "navy"}>{g.info.label}</Badge>
                  <p className="mt-3 text-sm text-foreground/60">{g.info.body}</p>
                  <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-foreground/40">
                    {g.count} program{g.count === 1 ? "" : "s"} available
                  </p>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="mx-auto max-w-6xl px-4 py-16">
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
            {classes.map((c, i) => (
              <Reveal key={c.id} delay={i * 100}>
                <Card className="h-full p-5">
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
              </Reveal>
            ))}
          </div>
        )}
      </section>

      <section className="chess-pattern-light bg-background py-16">
        <div className="mx-auto max-w-6xl px-4">
          <Reveal className="text-center">
            <h2 className="text-2xl font-bold text-navy">Meet Our Coaches</h2>
            <p className="mx-auto mt-2 max-w-xl text-foreground/60">
              Click a coach to see their background. The instructors behind our online classes.
            </p>
          </Reveal>
          <ProfileGrid profiles={COACHES} layout="circle-side" />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <Reveal className="text-center">
          <h2 className="text-2xl font-bold text-navy">Tournament Formats</h2>
          <p className="mx-auto mt-2 max-w-xl text-foreground/60">
            We run events across every time control, so there&apos;s a format for how you like to play.
          </p>
        </Reveal>
        <div className="mt-10 grid gap-6 sm:grid-cols-3">
          {FORMATS.map((f, i) => (
            <Reveal key={f.title} delay={i * 100} className="rounded-lg border border-border bg-card p-6 text-center shadow-sm">
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gold/15 text-3xl text-gold">
                {f.glyph}
              </span>
              <h3 className="mt-4 font-semibold text-foreground">{f.title}</h3>
              <p className="mt-2 text-sm text-foreground/60">{f.body}</p>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="bg-card py-16">
        <div className="mx-auto max-w-6xl px-4">
          <Reveal className="text-center">
            <h2 className="text-2xl font-bold text-navy">Why Chess?</h2>
            <p className="mx-auto mt-2 max-w-xl text-foreground/60">
              The skills chess builds carry well beyond the board.
            </p>
          </Reveal>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {BENEFITS.map((b, i) => (
              <Reveal key={b.title} delay={i * 90} className="rounded-lg border border-border p-5 text-center shadow-sm">
                <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-navy/10 text-2xl text-navy">
                  {b.glyph}
                </span>
                <h3 className="mt-3 font-semibold text-foreground">{b.title}</h3>
                <p className="mt-2 text-sm text-foreground/60">{b.body}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <Reveal className="text-center">
          <h2 className="text-2xl font-bold text-navy">Why Choose Us</h2>
          <p className="mx-auto mt-2 max-w-xl text-foreground/60">
            Whatever brought you here, we&apos;ve built this around making chess accessible.
          </p>
        </Reveal>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {PROMISES.map((p, i) => (
            <Reveal key={p.title} delay={i * 80}>
              <Card className="h-full p-5">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-orange/10 text-orange">
                  ✓
                </span>
                <h3 className="mt-3 font-semibold text-foreground">{p.title}</h3>
                <p className="mt-2 text-sm text-foreground/60">{p.body}</p>
              </Card>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="bg-card py-16">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mb-8 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-navy">From Our Gallery</h2>
            <Link href="/gallery" className="text-sm font-semibold text-orange hover:underline">
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
        </div>
      </section>

      <section className="bg-card py-16">
        <div className="mx-auto max-w-3xl px-4">
          <Reveal className="text-center">
            <h2 className="text-2xl font-bold text-navy">Frequently Asked Questions</h2>
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
        <h2 className="text-2xl font-bold text-navy">Our Goal</h2>
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

      <section className="chess-pattern relative overflow-hidden bg-navy-dark py-14 text-center text-white">
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
              className="border-white text-white hover:bg-white hover:text-navy"
            >
              Explore Classes
            </LinkButton>
          </div>
        </div>
      </section>
    </main>
  );
}
