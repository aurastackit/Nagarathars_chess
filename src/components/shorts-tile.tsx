"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import type { ShortsItem } from "@/lib/video";
import { PlayIcon } from "@/components/icons/misc";

const DESKTOP_QUERY = "(min-width: 768px)";
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

export function ShortsTile({ item, onOpen }: { item: ShortsItem; onOpen: () => void }) {
  const { playback } = item;
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLButtonElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    if (playback.provider !== "S3") return;
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), {
      threshold: 0.6,
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [playback.provider]);

  useEffect(() => {
    if (playback.provider !== "S3") return;
    const video = videoRef.current;
    if (!video) return;
    const isDesktop = window.matchMedia(DESKTOP_QUERY).matches;
    const reducedMotion = window.matchMedia(REDUCED_MOTION_QUERY).matches;
    if (inView && isDesktop && !reducedMotion) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  }, [inView, playback.provider]);

  return (
    <button
      ref={containerRef}
      type="button"
      onClick={onOpen}
      aria-label={`Play video${item.caption ? `: ${item.caption}` : ""}`}
      className="group relative aspect-[9/16] w-full shrink-0 overflow-hidden rounded-lg border border-border bg-charcoal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-charcoal focus-visible:ring-offset-2"
    >
      {playback.provider === "S3" ? (
        <video
          ref={videoRef}
          src={playback.videoUrl}
          poster={playback.thumbnailUrl ?? undefined}
          muted
          loop
          playsInline
          preload="metadata"
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : playback.thumbnailUrl ? (
        <Image
          src={playback.thumbnailUrl}
          alt=""
          fill
          sizes="(max-width: 640px) 50vw, 220px"
          className="object-cover"
        />
      ) : (
        <div className="absolute inset-0 bg-charcoal" />
      )}

      <div className="absolute inset-0 flex items-center justify-center bg-black/20 transition-colors group-hover:bg-black/30">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90 text-charcoal shadow-lg">
          <PlayIcon className="h-5 w-5 translate-x-0.5" />
        </span>
      </div>

      {item.caption && (
        <p className="absolute inset-x-0 bottom-0 line-clamp-2 bg-gradient-to-t from-black/70 to-transparent p-3 text-left text-sm font-medium text-white">
          {item.caption}
        </p>
      )}
    </button>
  );
}
