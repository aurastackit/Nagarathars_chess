"use client";

import { type ReactNode } from "react";
import { createPortal } from "react-dom";

/**
 * Centered modal with a dimmed backdrop, rendered via a portal to document.body.
 * Must be a portal: callers that open it from inside a <form> (e.g. the
 * registration wizard) would otherwise nest a <form> inside a <form>, which
 * is invalid HTML and makes the browser submit the wrong one.
 */
export function Modal({
  onClose,
  title,
  children,
}: {
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal/50 px-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="w-full max-w-sm rounded-lg bg-card p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-charcoal">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-foreground/50 hover:text-foreground"
          >
            ✕
          </button>
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </div>,
    document.body
  );
}
