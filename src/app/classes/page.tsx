import { prisma } from "@/lib/prisma";
import { ClassFilters } from "@/components/class-filters";

export const dynamic = "force-dynamic";

export default async function ClassesPage() {
  const classes = await prisma.classProgram.findMany({ orderBy: { createdAt: "asc" } });

  return (
    <main className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="text-3xl font-bold text-charcoal">Online Tutoring &amp; Classes</h1>
      <p className="mt-2 max-w-2xl text-foreground/60">
        Structured chess coaching for every level — beginner fundamentals through advanced
        tournament preparation, taught online by experienced coaches.
      </p>

      <div className="mt-8">
        <ClassFilters classes={classes} />
      </div>
    </main>
  );
}
