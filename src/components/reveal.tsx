"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * Fades a block up the first time it scrolls into view.
 *
 * Rendered fully visible on the server, so nothing depends on JS loading:
 * after hydration, only a block that's still below the fold is hidden
 * (data-reveal="pending", where nobody can see the switch), and it's shown
 * again when it scrolls in. Blocks already on screen are left alone, and
 * nothing is armed under prefers-reduced-motion. Styles are in globals.css.
 */
export function Reveal({
  children,
  className = "",
  delay = 0,
  style,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || el.dataset.reveal === "in") return;
    if (!("IntersectionObserver" in window)) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (el.getBoundingClientRect().top < window.innerHeight) return;

    el.dataset.reveal = "pending";
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        el.dataset.reveal = "in";
        observer.disconnect();
      },
      // threshold 0 so a block taller than the screen still triggers.
      { rootMargin: "0px 0px -10% 0px" }
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      if (el.dataset.reveal === "pending") el.removeAttribute("data-reveal");
    };
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      style={delay ? { transitionDelay: `${delay}ms`, ...style } : style}
    >
      {children}
    </div>
  );
}
