"use client";

import { useState } from "react";
import Image from "next/image";
import { KingIcon, KnightIcon, PawnIcon } from "@/components/icons/chess-pieces";
import type { AgeCategoryValue } from "@/lib/age-category";
import { AGE_CATEGORY_ILLUSTRATIONS } from "@/components/illustrations/age-categories";

// Alt text describes the scene only: these are illustrative photos, not from our events.
const ART: Record<AgeCategoryValue, { Icon: typeof PawnIcon; src: string; alt: string }> = {
  under_11: {
    Icon: PawnIcon,
    src: "/images/categories/under-11.jpg",
    alt: "Two young children playing chess at a wooden table",
  },
  "11_to_18": {
    Icon: KnightIcon,
    src: "/images/categories/under-19.jpg",
    alt: "Two school students in uniform facing each other over a chessboard and clock",
  },
  above_19: {
    Icon: KingIcon,
    src: "/images/categories/above-19.jpg",
    alt: "Adults playing chess at long tables in a busy hall",
  },
};

/**
 * One home-page age category: a 4:3 photo, the category's chess piece in an
 * ivory circle on the line between photo and text, then the age range, name
 * and who it's for. If the photo can't be loaded, the category's illustration
 * is shown instead.
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
  const { Icon, src, alt } = ART[category];
  const Illustration = AGE_CATEGORY_ILLUSTRATIONS[category];
  const [failed, setFailed] = useState(false);

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-lg border border-gold-ink/50 bg-background shadow-sm">
      <div className="relative">
        {failed ? (
          <Illustration />
        ) : (
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-t-lg bg-charcoal/10">
            <Image
              src={src}
              alt={alt}
              fill
              loading="lazy"
              sizes="(min-width: 768px) 33vw, 100vw"
              onError={() => setFailed(true)}
              className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
            />
          </div>
        )}
        <span
          className="absolute bottom-0 left-1/2 flex h-12 w-12 -translate-x-1/2 translate-y-1/2 items-center justify-center rounded-full border-2 border-gold-ink bg-background text-gold-ink shadow-sm"
          aria-hidden="true"
        >
          <Icon className="h-7 w-7" />
        </span>
      </div>
      <div className="flex flex-1 flex-col items-center px-6 pb-6 pt-10 text-center">
        <p className="text-sm font-semibold tabular-nums tracking-wider text-gold-ink">{kicker}</p>
        <h3 className="mt-1 font-display text-2xl font-bold text-charcoal sm:text-[1.75rem]">
          {title}
        </h3>
        <p className="mt-2 text-muted">{body}</p>
      </div>
    </article>
  );
}
