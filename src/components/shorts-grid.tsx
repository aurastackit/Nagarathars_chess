"use client";

import { useState } from "react";
import type { ShortsItem } from "@/lib/video";
import { ShortsTile } from "@/components/shorts-tile";
import { VideoLightbox } from "@/components/video-lightbox";

/** Grid of 9:16 shorts cards — used on the gallery's Video Highlights tab. Clicking a
 * card opens the same VideoLightbox used by the homepage shorts row. */
export function ShortsGrid({ items }: { items: ShortsItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {items.map((item, i) => (
          <ShortsTile key={item.id} item={item} onOpen={() => setOpenIndex(i)} />
        ))}
      </div>

      {openIndex !== null && (
        <VideoLightbox items={items} startIndex={openIndex} onClose={() => setOpenIndex(null)} />
      )}
    </>
  );
}
