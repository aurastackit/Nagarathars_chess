"use client";

import { useState } from "react";
import type { ShortsItem } from "@/lib/video";
import { ShortsTile } from "@/components/shorts-tile";
import { VideoLightbox } from "@/components/video-lightbox";

/** Horizontal snap-scroll row of 9:16 shorts cards — used on the homepage. Clicking a
 * card opens the same VideoLightbox used by the gallery's Video Highlights grid. */
export function ShortsRow({ items }: { items: ShortsItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <>
      <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2">
        {items.map((item, i) => (
          <div key={item.id} className="w-40 shrink-0 snap-start sm:w-48">
            <ShortsTile item={item} onOpen={() => setOpenIndex(i)} />
          </div>
        ))}
      </div>

      {openIndex !== null && (
        <VideoLightbox items={items} startIndex={openIndex} onClose={() => setOpenIndex(null)} />
      )}
    </>
  );
}
