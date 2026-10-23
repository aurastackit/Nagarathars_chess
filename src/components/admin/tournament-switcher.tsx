"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

/** Picks which tournament the dashboard shows (?t=<id>, or ?t=all). */
export function TournamentSwitcher({
  tournaments,
  value,
}: {
  /** note: "draft" or "unlisted" — shown after the title. */
  tournaments: { id: string; title: string; year: number; note: string | null }[];
  value: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="text-foreground/60">Showing</span>
      <select
        value={value}
        onChange={(e) => startTransition(() => router.push(`/admin?t=${e.target.value}`))}
        aria-busy={pending}
        className="max-w-[16rem] rounded-md border border-border bg-card px-3 py-2 text-sm font-medium text-charcoal focus:outline-none focus:ring-2 focus:ring-charcoal disabled:opacity-60"
      >
        <option value="all">All tournaments</option>
        {tournaments.map((t) => (
          <option key={t.id} value={t.id}>
            {t.title} ({t.year}){t.note ? ` — ${t.note}` : ""}
          </option>
        ))}
      </select>
    </label>
  );
}
