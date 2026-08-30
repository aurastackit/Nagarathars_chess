import { prisma } from "@/lib/prisma";
import { ClassCard } from "@/components/class-card";

export const dynamic = "force-dynamic";

const LEVEL_ORDER = ["beginner", "intermediate", "advanced"] as const;
const LEVEL_LABEL: Record<string, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

export default async function ClassesPage() {
  const classes = await prisma.classProgram.findMany({ orderBy: { createdAt: "asc" } });

  return (
    <main className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="text-3xl font-bold text-navy">Online Tutoring &amp; Classes</h1>
      <p className="mt-2 max-w-2xl text-foreground/60">
        Structured chess coaching for every level — beginner fundamentals through advanced
        tournament preparation, taught online by experienced coaches.
      </p>

      {LEVEL_ORDER.map((level) => {
        const items = classes.filter((c) => c.level === level);
        if (items.length === 0) return null;
        return (
          <section key={level} className="mt-10">
            <h2 className="mb-4 text-xl font-semibold text-foreground">{LEVEL_LABEL[level]}</h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((c) => (
                <ClassCard
                  key={c.id}
                  slug={c.slug}
                  level={c.level}
                  title={c.title}
                  description={c.description}
                  scheduleText={c.scheduleText}
                  instructorName={c.instructorName}
                  isOnline={c.isOnline}
                  sessionType={c.sessionType}
                  price={c.price}
                  maxGroupSize={c.maxGroupSize}
                  durationMinutes={c.durationMinutes}
                />
              ))}
            </div>
          </section>
        );
      })}

      {classes.length === 0 && (
        <p className="mt-10 text-foreground/60">No classes published yet — check back soon.</p>
      )}
    </main>
  );
}
