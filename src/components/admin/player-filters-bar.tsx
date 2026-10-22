"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { AGE_CATEGORIES } from "@/lib/age-category";
import {
  DEFAULT_FILTERS,
  PAGE_SIZES,
  playerFiltersQuery,
  type PlayerFilters,
} from "@/lib/player-filters";

const FIELD =
  "w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-charcoal";
const LABEL = "mb-1 block text-xs font-medium text-foreground/60";

/** Every filter writes to the URL (page back to 1), so the server renders the matching rows. */
export function PlayerFiltersBar({
  filters,
  tournaments,
  kovils,
}: {
  filters: PlayerFilters;
  tournaments: { id: string; title: string; year: number }[];
  kovils: string[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();
  const [q, setQ] = useState(filters.q);
  const firstRender = useRef(true);
  // Phones: only the search box shows until "Filters" is tapped.
  const [showAll, setShowAll] = useState(false);

  const apply = (patch: Partial<PlayerFilters>) =>
    startTransition(() => {
      const query = playerFiltersQuery({ ...filters, ...patch, page: 1 });
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    });

  // Search as you type, once typing pauses.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    const id = setTimeout(() => {
      if (q.trim() !== filters.q) apply({ q: q.trim() });
    }, 300);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only the typed text should trigger this
  }, [q]);

  const active =
    playerFiltersQuery({
      ...filters,
      page: 1,
      sort: DEFAULT_FILTERS.sort,
      dir: DEFAULT_FILTERS.dir,
      per: DEFAULT_FILTERS.per,
    }) !== "";

  const activeCount = [
    filters.t !== "all",
    filters.status,
    filters.category,
    filters.gender,
    filters.kovil,
    filters.dc,
    filters.from,
    filters.to,
    filters.dup,
  ].filter(Boolean).length;

  return (
    <div
      className={`grid grid-cols-2 gap-3 rounded-lg border border-border bg-card p-4 sm:grid-cols-4 lg:grid-cols-6 ${pending ? "opacity-70" : ""}`}
      aria-busy={pending}
    >
      <div className="col-span-2">
        <label htmlFor="player-search" className={LABEL}>
          Search{" "}
          <kbd className="ml-1 rounded border border-border px-1 text-[10px] text-foreground/50">
            /
          </kbd>
        </label>
        <input
          id="player-search"
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Name, email, mobile or reg. no."
          className={FIELD}
        />
      </div>
      <button
        type="button"
        onClick={() => setShowAll((v) => !v)}
        aria-expanded={showAll}
        className="col-span-2 rounded-md border border-border px-3 py-2 text-left text-sm font-semibold text-charcoal sm:hidden"
      >
        {showAll ? "Hide filters" : `Filters${activeCount ? ` (${activeCount} active)` : ""}`}
      </button>
      <div className={`col-span-2 ${showAll ? "" : "max-sm:hidden"}`}>
        <label htmlFor="pf-t" className={LABEL}>
          Tournament
        </label>
        <select
          id="pf-t"
          value={filters.t}
          onChange={(e) => apply({ t: e.target.value })}
          className={FIELD}
        >
          <option value="all">All tournaments</option>
          {tournaments.map((t) => (
            <option key={t.id} value={t.id}>
              {t.title} ({t.year})
            </option>
          ))}
        </select>
      </div>
      <div className={`${showAll ? "" : "max-sm:hidden"}`}>
        <label htmlFor="pf-status" className={LABEL}>
          Status
        </label>
        <select
          id="pf-status"
          value={filters.status}
          onChange={(e) => apply({ status: e.target.value })}
          className={FIELD}
        >
          <option value="">All</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="changes_requested">Changes requested</option>
          <option value="rejected">Rejected</option>
          <option value="withdrawn">Withdrawn</option>
        </select>
      </div>
      <div className={`${showAll ? "" : "max-sm:hidden"}`}>
        <label htmlFor="pf-category" className={LABEL}>
          Category
        </label>
        <select
          id="pf-category"
          value={filters.category}
          onChange={(e) => apply({ category: e.target.value })}
          className={FIELD}
        >
          <option value="">All</option>
          {AGE_CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </div>
      <div className={`${showAll ? "" : "max-sm:hidden"}`}>
        <label htmlFor="pf-gender" className={LABEL}>
          Gender
        </label>
        <select
          id="pf-gender"
          value={filters.gender}
          onChange={(e) => apply({ gender: e.target.value })}
          className={FIELD}
        >
          <option value="">All</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="other">Other</option>
        </select>
      </div>
      <div className={`${showAll ? "" : "max-sm:hidden"}`}>
        <label htmlFor="pf-kovil" className={LABEL}>
          Kovil
        </label>
        <select
          id="pf-kovil"
          value={filters.kovil}
          onChange={(e) => apply({ kovil: e.target.value })}
          className={FIELD}
        >
          <option value="">All</option>
          {kovils.map((k) => (
            <option key={k} value={k}>
              {k}
            </option>
          ))}
        </select>
      </div>
      <div className={`${showAll ? "" : "max-sm:hidden"}`}>
        <label htmlFor="pf-dc" className={LABEL}>
          New date reply
        </label>
        <select
          id="pf-dc"
          value={filters.dc}
          onChange={(e) => apply({ dc: e.target.value })}
          className={FIELD}
        >
          <option value="">Any</option>
          <option value="pending">No reply yet</option>
          <option value="accepted">Accepted</option>
          <option value="declined">Declined</option>
        </select>
      </div>
      <div className={`${showAll ? "" : "max-sm:hidden"}`}>
        <label htmlFor="pf-from" className={LABEL}>
          Registered from
        </label>
        <input
          id="pf-from"
          type="date"
          value={filters.from}
          max={filters.to || undefined}
          onChange={(e) => apply({ from: e.target.value })}
          className={FIELD}
        />
      </div>
      <div className={`${showAll ? "" : "max-sm:hidden"}`}>
        <label htmlFor="pf-to" className={LABEL}>
          Registered to
        </label>
        <input
          id="pf-to"
          type="date"
          value={filters.to}
          min={filters.from || undefined}
          onChange={(e) => apply({ to: e.target.value })}
          className={FIELD}
        />
      </div>
      <div className={`${showAll ? "" : "max-sm:hidden"}`}>
        <label htmlFor="pf-per" className={LABEL}>
          Per page
        </label>
        <select
          id="pf-per"
          value={filters.per}
          onChange={(e) => apply({ per: Number(e.target.value) as PlayerFilters["per"] })}
          className={FIELD}
        >
          {PAGE_SIZES.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </div>
      <div
        className={`col-span-2 flex items-end justify-between gap-3 sm:col-span-4 lg:col-span-6 ${showAll ? "" : "max-sm:hidden"}`}
      >
        <label className="flex items-center gap-2 text-sm text-foreground/80">
          <input
            type="checkbox"
            checked={filters.dup}
            onChange={(e) => apply({ dup: e.target.checked })}
            className="size-4 accent-[var(--charcoal)]"
          />
          Only possible duplicates (same phone or email)
        </label>
        {active && (
          <button
            type="button"
            onClick={() => {
              setQ("");
              apply({ ...DEFAULT_FILTERS, per: filters.per });
            }}
            className="text-sm font-semibold text-charcoal hover:underline"
          >
            Clear filters
          </button>
        )}
      </div>
    </div>
  );
}
