import type { ReactNode } from "react";

/**
 * Wraps heading text with a gold underline that ScrollMotion draws
 * left-to-right once, the first time it scrolls into view. Server HTML shows
 * the underline fully drawn (also the reduced-motion / no-JS state). Styles
 * are in globals.css.
 */
export function DrawUnderline({ children }: { children: ReactNode }) {
  return (
    <span data-draw-underline className="relative inline-block pb-2">
      {children}
      <span
        aria-hidden="true"
        className="draw-line absolute bottom-0 left-0 h-[3px] w-full origin-left rounded-full bg-gold"
      />
    </span>
  );
}
