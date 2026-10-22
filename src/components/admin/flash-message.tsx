"use client";

import { useEffect, type ReactNode } from "react";

const TONES = {
  error: "border-red-200 bg-red-50 text-red-700",
  success: "border-green-200 bg-green-50 text-green-700",
};

/**
 * A one-off message passed in the URL (e.g. `?error=` after a server action
 * redirect). It stays on screen, but the parameter is removed from the address
 * bar straight away, so a refresh or a bookmark doesn't show it again.
 */
export function FlashMessage({
  tone,
  param,
  className = "",
  children,
}: {
  tone: keyof typeof TONES;
  /** The search parameter(s) that carried the message. */
  param: string | string[];
  className?: string;
  children: ReactNode;
}) {
  const params = Array.isArray(param) ? param.join(",") : param;

  useEffect(() => {
    const url = new URL(window.location.href);
    for (const p of params.split(",")) url.searchParams.delete(p);
    // replaceState, not router.replace: no re-render, so the message stays visible.
    window.history.replaceState(window.history.state, "", url);
  }, [params]);

  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={`rounded-md border px-4 py-3 text-sm ${TONES[tone]} ${className}`}
    >
      {children}
    </div>
  );
}
