"use client";

import { useEffect } from "react";

/**
 * One client component that drives every once-on-scroll effect on the page,
 * so the cards and headings themselves stay plain server HTML (nothing to
 * hydrate). Renders nothing.
 *
 * - [data-vignette-card]: data-vignette "pending" (animations held on their
 *   first frame) → "play" when it scrolls in; replays on hover / focus.
 * - [data-draw-underline]: data-draw "pending" (underline retracted) → "in".
 *
 * Nothing is armed under prefers-reduced-motion, so the finished state
 * rendered on the server stays put. Keyframes live in globals.css.
 */
export function ScrollMotion() {
  useEffect(() => {
    if (!("IntersectionObserver" in window)) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const cards = [...document.querySelectorAll<HTMLElement>("[data-vignette-card]")];
    const lines = [...document.querySelectorAll<HTMLElement>("[data-draw-underline]")];
    cards.forEach((c) => (c.dataset.vignette = "pending"));
    lines.forEach((l) => (l.dataset.draw = "pending"));

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const el = entry.target as HTMLElement;
          if (el.hasAttribute("data-vignette-card")) el.dataset.vignette = "play";
          else el.dataset.draw = "in";
          observer.unobserve(el);
        }
      },
      { threshold: 0.35 }
    );
    [...cards, ...lines].forEach((el) => observer.observe(el));

    function replay(event: Event) {
      const el = event.currentTarget as HTMLElement;
      if (el.dataset.vignette !== "play") return;
      // Dropping the attribute removes the animations; re-adding it after a reflow restarts them.
      delete el.dataset.vignette;
      void el.offsetWidth;
      el.dataset.vignette = "play";
    }
    cards.forEach((c) => {
      c.addEventListener("mouseenter", replay);
      c.addEventListener("focusin", replay);
    });

    return () => {
      observer.disconnect();
      cards.forEach((c) => {
        c.removeEventListener("mouseenter", replay);
        c.removeEventListener("focusin", replay);
        delete c.dataset.vignette;
      });
      lines.forEach((l) => delete l.dataset.draw);
    };
  }, []);

  return null;
}
