"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { ShortsItem } from "@/lib/video";

/** Shared full-bleed viewer for both the homepage shorts row and the gallery's Video
 * Highlights tab — not the small <Modal> dialog (sized for confirmations, no room for
 * prev/next chrome or a 9:16 player). Follows the same portal + focus-trap idiom as
 * Modal and the mobile site menu. */
export function VideoLightbox({
  items,
  startIndex,
  onClose,
}: {
  items: ShortsItem[];
  startIndex: number;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(startIndex);
  const [reducedMotion, setReducedMotion] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const touchStartX = useRef<number | null>(null);

  const goPrev = useCallback(() => {
    setIndex((i) => (i - 1 + items.length) % items.length);
  }, [items.length]);
  const goNext = useCallback(() => {
    setIndex((i) => (i + 1) % items.length);
  }, [items.length]);

  useEffect(() => {
    function checkReducedMotion() {
      setReducedMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    }
    checkReducedMotion();
  }, []);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    const container = containerRef.current;
    const focusable = container
      ? Array.from(container.querySelectorAll<HTMLElement>("button:not([disabled])"))
      : [];
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowLeft") {
        goPrev();
      } else if (e.key === "ArrowRight") {
        goNext();
      } else if (e.key === "Tab" && focusable.length > 0) {
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    }
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose, goPrev, goNext]);

  if (typeof document === "undefined") return null;
  const item = items[index];
  if (!item) return null;
  const { playback } = item;

  return createPortal(
    <div
      ref={containerRef}
      role="dialog"
      aria-modal="true"
      aria-label={item.caption ?? "Video"}
      className="fixed inset-0 z-[70] flex flex-col items-center justify-center bg-charcoal/95 p-4"
      onClick={onClose}
      onTouchStart={(e) => {
        touchStartX.current = e.touches[0]?.clientX ?? null;
      }}
      onTouchEnd={(e) => {
        if (touchStartX.current === null) return;
        const dx = (e.changedTouches[0]?.clientX ?? 0) - touchStartX.current;
        if (Math.abs(dx) > 50) {
          if (dx > 0) goPrev();
          else goNext();
        }
        touchStartX.current = null;
      }}
    >
      <div className="absolute right-4 top-4 z-10 text-sm text-white/70">
        {index + 1} / {items.length}
      </div>
      <button
        ref={closeButtonRef}
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="absolute left-4 top-4 z-10 rounded-full p-2 text-2xl leading-none text-white hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
      >
        &times;
      </button>

      <div
        className="relative aspect-[9/16] max-h-[80vh] w-full max-w-sm"
        onClick={(e) => e.stopPropagation()}
      >
        {playback.provider === "YOUTUBE" || playback.provider === "DRIVE" ? (
          <iframe
            key={item.id}
            src={
              playback.provider === "YOUTUBE"
                ? `${playback.embedUrl}?autoplay=${reducedMotion ? 0 : 1}&mute=1&rel=0`
                : playback.embedUrl
            }
            className="h-full w-full rounded-lg"
            allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title={item.caption ?? "Video"}
          />
        ) : (
          <video
            key={item.id}
            src={playback.videoUrl}
            poster={playback.thumbnailUrl ?? undefined}
            controls
            autoPlay={!reducedMotion}
            muted
            playsInline
            className="h-full w-full rounded-lg bg-black object-contain"
          >
            <track kind="captions" />
          </video>
        )}

        {items.length > 1 && (
          <>
            <button
              type="button"
              onClick={goPrev}
              aria-label="Previous video"
              className="absolute left-0 top-1/2 -translate-x-full -translate-y-1/2 rounded-full bg-black/40 p-3 text-xl text-white hover:bg-black/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold max-sm:left-2 max-sm:translate-x-0"
            >
              &lsaquo;
            </button>
            <button
              type="button"
              onClick={goNext}
              aria-label="Next video"
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-full rounded-full bg-black/40 p-3 text-xl text-white hover:bg-black/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold max-sm:right-2 max-sm:translate-x-0"
            >
              &rsaquo;
            </button>
          </>
        )}
      </div>

      {item.caption && (
        <p
          className="mt-4 max-w-sm text-center text-sm font-medium text-white"
          onClick={(e) => e.stopPropagation()}
        >
          {item.caption}
        </p>
      )}
    </div>,
    document.body
  );
}
