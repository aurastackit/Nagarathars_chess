import type { Metadata } from "next";
import type { ComponentType, SVGProps } from "react";
import { pageMetadata } from "@/lib/seo";
import { breadcrumbJsonLd } from "@/lib/seo/structured-data";
import { JsonLd } from "@/components/json-ld";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { CLASSES_ENABLED } from "@/lib/features";
import { Card, LinkButton, Section } from "@/components/ui";
import { ClassFilters } from "@/components/class-filters";
import { ClassWaitlistForm } from "@/components/class-waitlist-form";
import { CLASSES_HEADER_PHOTO } from "@/lib/featured-photos";
import { SkillProgression } from "@/components/illustrations/skill-progression";
import { LevelPiece } from "@/components/illustrations/level-piece";
import { TrophyIcon } from "@/components/icons/chess-pieces";
import { AgesIcon, PeopleIcon, ScreenIcon } from "@/components/icons/misc";
import type { PieceKind } from "@/components/icons/staunton-pieces";

// Static, regenerated at most every minute or on demand after an admin
// change (lib/revalidate-public).
export const revalidate = 60;

export const metadata: Metadata = CLASSES_ENABLED
  ? pageMetadata({
      title: "Online Chess Classes",
      description:
        "Online chess classes for kids and adults in Chennai and beyond – beginner to advanced, group or one-on-one, taught live by coaches. Join or get on the waitlist.",
      path: "/classes",
    })
  : pageMetadata({
      title: "Online Chess Classes – Coming Soon",
      description:
        "Online chess coaching for children and adults is coming soon from Nagarathar's Chess Championship. Join the list to hear first when classes open.",
      path: "/classes",
    });

export default function ClassesPage() {
  return (
    <main>
      <JsonLd data={breadcrumbJsonLd([{ name: "Online Classes", path: "/classes" }])} />
      {CLASSES_ENABLED ? <ClassListings /> : <ClassesComingSoon />}
    </main>
  );
}

/** The live classes page: banner, level strip and the filterable class cards. */
async function ClassListings() {
  const classes = await prisma.classProgram.findMany({ orderBy: { createdAt: "asc" } });

  return (
    <>
      <section className="relative flex min-h-48 items-end overflow-hidden bg-charcoal pt-16 text-white sm:min-h-56">
        <Image
          src={CLASSES_HEADER_PHOTO.src}
          alt=""
          fill
          sizes="100vw"
          priority
          className="object-cover opacity-50"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal via-charcoal/40 to-transparent" />
        <div className="relative mx-auto w-full max-w-6xl px-4 pb-6">
          <h1 className="h1">Online Tutoring &amp; Classes</h1>
          <p className="mt-2 max-w-2xl text-white/75">
            Structured chess coaching for every level — beginner fundamentals through advanced
            tournament preparation, taught online by experienced coaches.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-12">
        <SkillProgression className="mb-10" />
        {/* Keeps the outline h1 → h2 → h3 (class cards use h3) without changing the design. */}
        <h2 className="sr-only">Class programmes</h2>
        <ClassFilters classes={classes} />
      </div>
    </>
  );
}

const PLANNED: { kind: PieceKind; level: string; body: string }[] = [
  {
    kind: "P",
    level: "Beginner",
    body: "Learn how every piece moves, basic tactics, opening principles and the rules of tournament play.",
  },
  {
    kind: "N",
    level: "Intermediate",
    body: "Sharpen tactics, middle-game planning, essential endgames and a simple opening repertoire.",
  },
  {
    kind: "K",
    level: "Advanced",
    body: "Deeper calculation, complex endgames and focused preparation for competitive tournaments.",
  },
];

const HOW_IT_WILL_WORK: {
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
  title: string;
  body: string;
}[] = [
  {
    Icon: ScreenIcon,
    title: "Live and online",
    body: "Interactive sessions you can join from home.",
  },
  {
    Icon: PeopleIcon,
    title: "Group or one-on-one",
    body: "Small groups to learn together, or personal coaching.",
  },
  { Icon: AgesIcon, title: "For every age", body: "Programmes for children and adults." },
  {
    Icon: TrophyIcon,
    title: "Linked to our tournaments",
    body: "Practise what you learn at our community events.",
  },
];

/**
 * Classes are planned but not offered yet (lib/features): what's coming, how
 * it will work, and the waitlist. Nothing here reads class data.
 */
function ClassesComingSoon() {
  return (
    <>
      <section className="relative flex min-h-[22rem] items-end overflow-hidden bg-charcoal pt-16 text-white sm:min-h-[26rem]">
        <Image
          src={CLASSES_HEADER_PHOTO.src}
          alt=""
          fill
          sizes="100vw"
          priority
          className="object-cover opacity-50"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal via-charcoal/60 to-charcoal/10" />
        <div className="relative mx-auto w-full max-w-6xl px-4 pb-10">
          <span className="inline-flex rounded-full bg-gold px-3 py-1 text-xs font-semibold uppercase tracking-wider text-charcoal">
            Coming soon
          </span>
          <h1 className="h1 mt-4">Online Chess Classes</h1>
          <p className="mt-3 max-w-2xl text-lg text-white/80">
            We&apos;re preparing structured online coaching so players can keep improving between
            tournaments. Join the list and we&apos;ll tell you first when classes open.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <LinkButton href="#notify" surface="dark" className="py-3">
              Get notified
            </LinkButton>
            <LinkButton
              href="/tournaments"
              variant="outline"
              surface="dark"
              className="border-white/60! py-3 text-white! hover:bg-white! hover:text-charcoal!"
            >
              View tournaments
            </LinkButton>
          </div>
        </div>
      </section>

      <Section title="What we're planning" align="left" className="bg-background">
        <p className="text-small -mt-4 mb-6 text-muted">
          Planned programmes – details may change before launch.
        </p>
        <div className="grid gap-6 md:grid-cols-3">
          {PLANNED.map((p) => (
            <Card key={p.level} className="h-full p-6">
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-gold/10">
                <LevelPiece kind={p.kind} className="h-14 w-14" />
              </span>
              <h3 className="h3 mt-4 text-foreground">{p.level}</h3>
              <p className="text-small mt-2 text-muted">{p.body}</p>
            </Card>
          ))}
        </div>
      </Section>

      <Section title="How classes will work" align="left" className="bg-card">
        <div className="grid gap-x-10 gap-y-8 sm:grid-cols-2">
          {HOW_IT_WILL_WORK.map(({ Icon, title, body }) => (
            <div key={title} className="flex items-start gap-4">
              <span className="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-gold/10 text-gold-ink">
                <Icon className="h-6 w-6" aria-hidden="true" />
              </span>
              <div>
                <h3 className="text-base font-semibold text-foreground">{title}</h3>
                <p className="text-small mt-1 text-muted">{body}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <div id="notify" className="scroll-mt-24">
        <Section
          title="Be the first to know"
          subtitle="Leave your email and we'll let you know as soon as registrations open. No spam – just one message when classes launch."
          className="bg-background"
        >
          <div className="mx-auto max-w-2xl">
            <ClassWaitlistForm
              title={null}
              description={null}
              withInterest
              successMessage="Thank you! We'll email you when online classes open."
            />
          </div>
        </Section>
      </div>
    </>
  );
}
