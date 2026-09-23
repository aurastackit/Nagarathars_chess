"use client";

import { useState } from "react";
import Image from "next/image";
import { GalleryPlaceholderTile } from "@/components/gallery-tile";
import type { GalleryPlaceholder } from "@/lib/gallery-placeholders";

type RealItem = { id: string; src: string; title: string; caption: string };
type Item = ({ kind: "real" } & RealItem) | ({ kind: "placeholder" } & GalleryPlaceholder);

const INITIAL_COUNT = 12;
const PAGE_SIZE = 9;

export function GalleryGrid({
  realItems,
  placeholders,
}: {
  realItems: RealItem[];
  placeholders: GalleryPlaceholder[];
}) {
  const items: Item[] = [
    ...realItems.map((r) => ({ kind: "real" as const, ...r })),
    ...placeholders.map((p) => ({ kind: "placeholder" as const, ...p })),
  ];
  const [visible, setVisible] = useState(INITIAL_COUNT);
  const shown = items.slice(0, visible);
  const hasMore = visible < items.length;

  return (
    <>
      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((item) =>
          item.kind === "real" ? (
            <figure
              key={item.id}
              className="overflow-hidden rounded-lg border border-border bg-card shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="relative h-48 w-full bg-gray-100">
                <Image
                  src={item.src}
                  alt={item.title}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-contain"
                />
              </div>
              <figcaption className="p-4">
                <p className="font-semibold text-foreground">{item.title}</p>
                <p className="text-sm text-foreground/60">{item.caption}</p>
              </figcaption>
            </figure>
          ) : (
            <figure
              key={item.id}
              className="overflow-hidden rounded-lg border border-border bg-card shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="relative h-48 w-full">
                <GalleryPlaceholderTile {...item} />
              </div>
              <figcaption className="p-4">
                <p className="font-semibold text-foreground">{item.caption}</p>
                <p className="text-sm text-foreground/60">Sample placeholder</p>
              </figcaption>
            </figure>
          )
        )}
      </div>
      {hasMore && (
        <div className="mt-10 text-center">
          <button
            type="button"
            onClick={() => setVisible((v) => v + PAGE_SIZE)}
            className="rounded-md border border-charcoal px-6 py-2.5 text-sm font-semibold text-charcoal transition-colors hover:bg-charcoal hover:text-white"
          >
            Load more ({items.length - visible} remaining)
          </button>
        </div>
      )}
    </>
  );
}
