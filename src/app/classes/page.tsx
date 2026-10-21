import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { ClassFilters } from "@/components/class-filters";
import { CLASSES_HEADER_PHOTO } from "@/lib/featured-photos";
import { SkillProgression } from "@/components/illustrations/skill-progression";

export const dynamic = "force-dynamic";

export const metadata: Metadata = pageMetadata({
  title: "Online Chess Classes",
  description:
    "Online chess classes for kids and adults in Chennai and beyond – beginner to advanced, group or one-on-one, taught live by coaches. Join or get on the waitlist.",
  path: "/classes",
});

export default async function ClassesPage() {
  const classes = await prisma.classProgram.findMany({ orderBy: { createdAt: "asc" } });

  return (
    <main>
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
    </main>
  );
}
