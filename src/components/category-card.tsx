import type { AgeCategoryValue } from "@/lib/age-category";
import { AGE_CATEGORY_ILLUSTRATIONS } from "@/components/illustrations/age-categories";

/**
 * One home-page age category: the category's chess-piece artwork (4:3), then
 * the age range, name and who it's for.
 */
export function CategoryCard({
  category,
  kicker,
  title,
  body,
}: {
  category: AgeCategoryValue;
  kicker: string;
  title: string;
  body: string;
}) {
  const Illustration = AGE_CATEGORY_ILLUSTRATIONS[category];

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-lg border border-gold-ink/50 bg-background shadow-sm">
      <Illustration />
      <div className="flex flex-1 flex-col items-center px-6 pb-6 pt-6 text-center">
        <p className="text-sm font-semibold tabular-nums tracking-wider text-gold-ink">{kicker}</p>
        <h3 className="mt-1 font-display text-2xl font-bold text-charcoal sm:text-[1.75rem]">
          {title}
        </h3>
        <p className="mt-2 text-muted">{body}</p>
      </div>
    </article>
  );
}
