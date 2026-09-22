"use client";

import { useMemo, useState } from "react";
import { EmptyState, Select } from "@/components/ui";
import { TournamentCard, type TournamentCardData } from "@/components/tournament-card";
import { getTournamentStatus, TOURNAMENT_STATUS_LABEL, type TournamentStatus } from "@/lib/tournament-status";
import { capitalizeWords } from "@/lib/text";

const monthFormatter = new Intl.DateTimeFormat("en-IN", { month: "short", year: "numeric" });

function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function TournamentFilters({ tournaments }: { tournaments: TournamentCardData[] }) {
  const [format, setFormat] = useState("all");
  const [city, setCity] = useState("all");
  const [month, setMonth] = useState("all");
  const [fee, setFee] = useState("all");
  const [status, setStatus] = useState("all");
  const [now] = useState(() => Date.now());

  const cities = useMemo(
    () => [...new Set(tournaments.map((t) => t.city))].sort((a, b) => a.localeCompare(b)),
    [tournaments]
  );
  const months = useMemo(() => {
    const map = new Map<string, Date>();
    for (const t of tournaments) {
      const key = monthKey(t.startDate);
      if (!map.has(key)) map.set(key, t.startDate);
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [tournaments]);

  const filtered = useMemo(() => {
    return tournaments
      .filter((t) => format === "all" || t.format === format)
      .filter((t) => city === "all" || t.city === city)
      .filter((t) => month === "all" || monthKey(t.startDate) === month)
      .filter((t) => fee === "all" || (fee === "free" ? t.entryFee === 0 : t.entryFee > 0))
      .filter((t) => status === "all" || getTournamentStatus(t, new Date(now)) === (status as TournamentStatus))
      .sort((a, b) => Math.abs(a.startDate.getTime() - now) - Math.abs(b.startDate.getTime() - now));
  }, [tournaments, format, city, month, fee, status, now]);

  const hasActiveFilters = format !== "all" || city !== "all" || month !== "all" || fee !== "all" || status !== "all";

  return (
    <div>
      <div className="grid gap-3 rounded-lg border border-border bg-card p-4 sm:grid-cols-2 lg:grid-cols-5">
        <div>
          <label className="mb-1 block text-xs font-medium text-foreground/60">Format</label>
          <Select value={format} onChange={(e) => setFormat(e.target.value)}>
            <option value="all">All formats</option>
            <option value="classical">Classical</option>
            <option value="rapid">Rapid</option>
            <option value="blitz">Blitz</option>
          </Select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-foreground/60">City</label>
          <Select value={city} onChange={(e) => setCity(e.target.value)}>
            <option value="all">All cities</option>
            {cities.map((c) => (
              <option key={c} value={c}>
                {capitalizeWords(c)}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-foreground/60">Month</label>
          <Select value={month} onChange={(e) => setMonth(e.target.value)}>
            <option value="all">All months</option>
            {months.map(([key, date]) => (
              <option key={key} value={key}>
                {monthFormatter.format(date)}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-foreground/60">Fee</label>
          <Select value={fee} onChange={(e) => setFee(e.target.value)}>
            <option value="all">Free &amp; paid</option>
            <option value="free">Free</option>
            <option value="paid">Paid</option>
          </Select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-foreground/60">Status</label>
          <Select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="all">Any status</option>
            {(Object.keys(TOURNAMENT_STATUS_LABEL) as TournamentStatus[]).map((s) => (
              <option key={s} value={s}>
                {TOURNAMENT_STATUS_LABEL[s]}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <p className="mt-3 text-sm text-foreground/50">
        {filtered.length} tournament{filtered.length === 1 ? "" : "s"}
        {hasActiveFilters && (
          <>
            {" "}
            &middot;{" "}
            <button
              type="button"
              className="font-semibold text-gold hover:underline"
              onClick={() => {
                setFormat("all");
                setCity("all");
                setMonth("all");
                setFee("all");
                setStatus("all");
              }}
            >
              Clear filters
            </button>
          </>
        )}
      </p>

      {filtered.length === 0 ? (
        <EmptyState className="mt-4" message="No tournaments match these filters — try widening your search." />
      ) : (
        <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((t) => (
            <TournamentCard key={t.id} tournament={t} />
          ))}
        </div>
      )}
    </div>
  );
}
