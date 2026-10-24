"use client";

import { useState } from "react";
import Image from "next/image";
import type { ShortsItem } from "@/lib/video";
import { PlayIcon } from "@/components/icons/misc";
import { VideoLightbox } from "@/components/video-lightbox";

/**
 * The gallery's featured highlights video (id="highlights", linked from
 * /about): a 16:9 thumbnail with a play button that opens the shared video
 * lightbox in its landscape frame.
 */
export function FeaturedVideo({ item }: { item: ShortsItem }) {
  const [open, setOpen] = useState(false);
  const title = item.caption ?? "Video highlights";
  const thumbnail = item.playback.thumbnailUrl;

  return (
    <section id="highlights" className="mx-auto mt-10 max-w-4xl scroll-mt-24">
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Play video: ${title}`}
        className="group relative block aspect-video w-full overflow-hidden rounded-lg border border-border bg-charcoal shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-charcoal focus-visible:ring-offset-2"
      >
        {thumbnail && (
          <Image
            src={thumbnail}
            alt=""
            fill
            priority
            sizes="(min-width: 896px) 896px, 100vw"
            className="object-cover"
          />
        )}
        <span className="absolute inset-0 flex items-center justify-center bg-black/25 transition-colors group-hover:bg-black/35">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/90 text-charcoal shadow-lg transition-transform group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100">
            <PlayIcon className="h-7 w-7 translate-x-0.5" />
          </span>
        </span>
      </button>
      <h2 className="h3 mt-4 text-center text-charcoal">{title}</h2>
      {open && (
        <VideoLightbox items={[item]} startIndex={0} onClose={() => setOpen(false)} landscape />
      )}
    </section>
  );
}
