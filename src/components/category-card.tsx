"use client";

import { useState } from "react";
import Image from "next/image";
import { KingIcon, KnightIcon, PawnIcon } from "@/components/icons/chess-pieces";
import type { AgeCategoryValue } from "@/lib/age-category";

const ART: Record<AgeCategoryValue, { Icon: typeof PawnIcon; src: string; alt: string }> = {
  under_11: {
    Icon: PawnIcon,
    src: "/images/categories/under-11.jpg",
    alt: "Young players at a Nagarathar's Chess tournament",
  },
  "11_to_18": {
    Icon: KnightIcon,
    src: "/images/categories/under-19.jpg",
    alt: "School-age players at a Nagarathar's Chess tournament",
  },
  above_19: {
    Icon: KingIcon,
    src: "/images/categories/above-19.jpg",
    alt: "Adult players at a Nagarathar's Chess tournament",
  },
};

/**
 * One home-page age category: a photo (with the category's chess piece in a
 * gold circle on its bottom edge), the age range, name and who it's for. If
 * the photo can't be loaded, the plain icon panel is shown instead.
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
  const [failed, setFailed] = useState(false);

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-lg border border-border bg-card shadow-sm">
      {failed ? (
        <div className="vignette-panel flex aspect-[4/3] w-full items-center justify-center border-b border-border">
          <Icon className="h-20 w-20 text-gold-ink" aria-hidden="true" />
        </div>
      ) : (
        <div className="relative">
          <div className="relative aspect-[4/3] w-full overflow-hidden bg-charcoal/10">
            <Image
              src={src}
              alt={alt}
              fill
              loading="lazy"
              sizes="(min-width: 768px) 33vw, 100vw"
              onError={() => setFailed(true)}
              className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
            />
            <div
              className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-charcoal/60 to-transparent"
              aria-hidden="true"
            />
          </div>
          <span
            className="absolute bottom-0 left-5 flex h-12 w-12 translate-y-1/2 items-center justify-center rounded-full bg-gold text-charcoal shadow-md ring-4 ring-card"
            aria-hidden="true"
          >
            <Icon className="h-7 w-7" />
          </span>
        </div>
      )}
      <div className={`flex flex-1 flex-col p-6 ${failed ? "" : "pt-9"}`}>
        <p className="text-sm font-bold tabular-nums tracking-wider text-gold-ink">{kicker}</p>
        <h3 className="h3 mt-1 text-foreground">{title}</h3>
        <p className="text-small mt-2 text-muted">{body}</p>
      </div>
    </article>
  );
}
