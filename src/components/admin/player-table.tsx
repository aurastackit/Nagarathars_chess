"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef, useState } from "react";
import type { PlayerRow } from "@/lib/player-list";
import {
  nextSort,
  playerFiltersQuery,
  type PlayerFilters,
  type PlayerSort,
} from "@/lib/player-filters";
import { registrationAdminHref } from "@/lib/admin-links";
import { StatusBadges } from "@/components/admin/status-badge";
import { Modal } from "@/components/modal";
import { Button, buttonClasses } from "@/components/ui";
import type { BulkResult } from "@/app/admin/registrations/actions";

type BulkAction = (state: BulkResult, formData: FormData) => Promise<BulkResult>;

const SHORTCUTS: [string, string][] = [
  ["/", "Search"],
  ["j / k", "Next / previous player"],
  ["x", "Select or unselect the highlighted player"],
  ["o or Enter", "Open the highlighted player"],
  ["Esc", "Clear the selection"],
  ["?", "Show or hide these shortcuts"],
];

function DuplicateFlag({ dup }: { dup: PlayerRow["duplicate"] }) {
  if (!dup) return null;
  const parts = [
    dup.phone.length ? `same phone as ${dup.phone.join(", ")}` : "",
    dup.email.length ? `same email as ${dup.email.join(", ")}` : "",
  ].filter(Boolean);
  return (
    <span
      title={`Possible duplicate: ${parts.join("; ")}`}
      className="ml-1.5 inline-block rounded bg-warning/15 px-1.5 py-0.5 align-middle text-[10px] font-semibold uppercase tracking-wide text-warning"
    >
      {dup.phone.length && dup.email.length
        ? "Dup phone + email"
        : dup.phone.length
          ? "Dup phone"
          : "Dup email"}
      <span className="sr-only">: {parts.join("; ")}</span>
    </span>
  );
}

const sortLink = (filters: PlayerFilters, column: PlayerSort) =>
  `?${playerFiltersQuery({ ...filters, ...nextSort(filters, column), page: 1 })}`;
/** A sortable column header: a link that sorts by the column, or flips the direction if it already does. */
function SortHead({
  filters,
  column,
  children,
  className = "",
}: {
  filters: PlayerFilters;
  column: PlayerSort;
  children: React.ReactNode;
  className?: string;
}) {
  const current = filters.sort === column;
  return (
    <th
      scope="col"
      aria-sort={current ? (filters.dir === "asc" ? "ascending" : "descending") : "none"}
      className={`sticky top-0 z-10 bg-card px-3 py-2 font-medium shadow-[inset_0_-1px_0_var(--border)] ${className}`}
    >
      <Link
        href={sortLink(filters, column)}
        scroll={false}
        className={`inline-flex items-center gap-1 hover:text-charcoal ${current ? "text-charcoal" : ""}`}
      >
        {children}
        <span aria-hidden="true" className="text-[10px]">
          {current ? (filters.dir === "asc" ? "▲" : "▼") : "↕"}
        </span>
      </Link>
    </th>
  );
}

export function PlayerTable({
  rows,
  filters,
  offset,
  approve,
  requestChanges,
}: {
  rows: PlayerRow[];
  filters: PlayerFilters;
  /** Number of rows on earlier pages, for the # column. */
  offset: number;
  approve: BulkAction;
  requestChanges: BulkAction;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [active, setActive] = useState(-1);
  const [help, setHelp] = useState(false);
  const [asking, setAsking] = useState(false);
  const [result, setResult] = useState<BulkResult>(null);
  const rowRefs = useRef<(HTMLElement | null)[]>([]);

  // Run a bulk action, then: show its summary, clear the selection if anything
  // changed, close the dialog unless the input was rejected, and refresh the rows.
  const after = (action: BulkAction) => async (state: BulkResult, formData: FormData) => {
    const r = await action(state, formData);
    if (r && (r.done > 0 || r.skipped > 0)) {
      if (r.done > 0) setSelected(new Set());
      setAsking(false);
      setResult(r);
      router.refresh();
    }
    return r;
  };
  const [, approveAction, approving] = useActionState(after(approve), null);
  const [changesState, changesAction, requesting] = useActionState(after(requestChanges), null);

  const toggle = (id: string) =>
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const allOnPage = rows.length > 0 && rows.every((r) => selected.has(r.id));

  // Keyboard shortcuts (ignored while typing or with a dialog open).
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const el = e.target as HTMLElement;
      if (asking || e.metaKey || e.ctrlKey || e.altKey) return;
      if (el.closest("input, textarea, select, [contenteditable=true]")) {
        if (e.key === "Escape") (el as HTMLElement).blur();
        return;
      }
      const go = (i: number) => {
        const next = Math.max(0, Math.min(rows.length - 1, i));
        setActive(next);
        rowRefs.current[next]?.scrollIntoView({ block: "nearest" });
      };
      if (e.key === "/") {
        e.preventDefault();
        document.getElementById("player-search")?.focus();
      } else if (e.key === "j") go(active + 1);
      else if (e.key === "k") go(active - 1);
      else if (e.key === "x" && rows[active]) toggle(rows[active].id);
      else if ((e.key === "o" || e.key === "Enter") && rows[active] && !el.closest("a, button")) {
        router.push(registrationAdminHref(rows[active].tournamentId, rows[active].id));
      } else if (e.key === "Escape") setSelected(new Set());
      else if (e.key === "?") setHelp((h) => !h);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, asking, rows, router]);

  const plainHead =
    "sticky top-0 z-10 bg-card px-3 py-2 font-medium shadow-[inset_0_-1px_0_var(--border)]";
  const ids = [...selected];

  return (
    <div className="space-y-3">
      {/* Bulk actions for the selection. */}
      <div className="flex min-h-11 flex-wrap items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm">
        <label className="flex items-center gap-2 font-medium text-charcoal">
          <input
            type="checkbox"
            checked={allOnPage}
            onChange={() => setSelected(allOnPage ? new Set() : new Set(rows.map((r) => r.id)))}
            aria-label="Select every player on this page"
            className="size-4 accent-[var(--charcoal)]"
          />
          {selected.size ? `${selected.size} selected` : "Select"}
        </label>
        {selected.size > 0 && (
          <>
            <form
              action={approveAction}
              onSubmit={(e) => {
                if (
                  !window.confirm(
                    `Approve ${selected.size} registration(s)? Each player gets a confirmation email. Ones that aren't pending are skipped.`
                  )
                )
                  e.preventDefault();
              }}
            >
              {ids.map((id) => (
                <input key={id} type="hidden" name="ids" value={id} />
              ))}
              <Button type="submit" size="sm" disabled={approving}>
                {approving ? "Approving…" : "Approve"}
              </Button>
            </form>
            <Button type="button" size="sm" variant="outline" onClick={() => setAsking(true)}>
              Request changes
            </Button>
            <a
              href={`/admin/registrations/export.csv?${new URLSearchParams({ ids: ids.join(",") })}`}
              className={buttonClasses("outline", "sm")}
            >
              Export selected
            </a>
            <button
              type="button"
              disabled
              title="Arrives with ID cards"
              className={buttonClasses("outline", "sm")}
            >
              Print ID cards
            </button>
            <button
              type="button"
              onClick={() => setSelected(new Set())}
              className="ml-auto text-xs font-semibold text-foreground/60 hover:text-charcoal"
            >
              Clear
            </button>
          </>
        )}
        <button
          type="button"
          onClick={() => setHelp((h) => !h)}
          className={`${selected.size ? "" : "ml-auto"} hidden text-xs font-medium text-foreground/50 hover:text-charcoal sm:inline`}
          aria-expanded={help}
        >
          Keyboard shortcuts <kbd className="rounded border border-border px-1">?</kbd>
        </button>
      </div>

      {result?.message && (
        <p
          role="status"
          className={`rounded-md border px-4 py-2 text-sm ${result.done ? "border-green-200 bg-green-50 text-green-800" : "border-amber-200 bg-amber-50 text-amber-900"}`}
        >
          {result.message}
        </p>
      )}

      {help && (
        <div className="rounded-lg border border-border bg-card p-4 text-sm">
          <p className="font-semibold text-charcoal">Keyboard shortcuts</p>
          <dl className="mt-2 grid gap-x-6 gap-y-1 sm:grid-cols-2">
            {SHORTCUTS.map(([k, v]) => (
              <div key={k} className="flex gap-3">
                <dt className="w-24 flex-none">
                  <kbd className="rounded border border-border px-1.5 text-xs">{k}</kbd>
                </dt>
                <dd className="text-foreground/70">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      {/* Wide screens: table with a sticky header. */}
      <div className="hidden max-h-[70vh] overflow-auto rounded-lg border border-border bg-card shadow-sm sm:block">
        <table className="w-full min-w-[60rem] text-left text-sm">
          <thead className="text-foreground/60">
            <tr>
              <th scope="col" className={`${plainHead} w-10`}>
                <span className="sr-only">Select</span>
              </th>
              <th scope="col" className={`${plainHead} w-10`}>
                #
              </th>
              <SortHead filters={filters} column="fullName" className="min-w-[15rem]">
                Player
              </SortHead>
              <SortHead filters={filters} column="registrationNo">
                Reg. no.
              </SortHead>
              <SortHead filters={filters} column="gender">
                Gender
              </SortHead>
              <SortHead filters={filters} column="ageCategory">
                Category
              </SortHead>
              <SortHead filters={filters} column="kovil">
                Kovil
              </SortHead>
              <SortHead filters={filters} column="native">
                Native
              </SortHead>
              <SortHead filters={filters} column="status">
                Status
              </SortHead>
              <SortHead filters={filters} column="registeredAt">
                Registered (IST)
              </SortHead>
              <th scope="col" className={plainHead}>
                <span className="sr-only">View</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr
                key={r.id}
                ref={(el) => {
                  rowRefs.current[i] = el;
                }}
                className={`border-t border-border align-top ${i === active ? "bg-gold/10 outline outline-2 -outline-offset-2 outline-gold" : selected.has(r.id) ? "bg-charcoal/[0.03]" : ""}`}
              >
                <td className="px-3 py-2.5">
                  <input
                    type="checkbox"
                    checked={selected.has(r.id)}
                    onChange={() => toggle(r.id)}
                    aria-label={`Select ${r.fullName}`}
                    className="size-4 accent-[var(--charcoal)]"
                  />
                </td>
                <td className="px-3 py-2.5 tabular-nums text-foreground/50">{offset + i + 1}</td>
                <td className="px-3 py-2.5">
                  <span className="font-medium text-charcoal">{r.fullName}</span>
                  <DuplicateFlag dup={r.duplicate} />
                  <span className="block break-all text-xs text-foreground/60">{r.email}</span>
                  <span className="block text-xs tabular-nums text-foreground/60">{r.phone}</span>
                  {filters.t === "all" && (
                    <span className="block text-xs text-foreground/40">{r.tournamentTitle}</span>
                  )}
                </td>
                <td className="whitespace-nowrap px-3 py-2.5 font-mono text-xs">
                  {r.registrationNo ?? "—"}
                </td>
                <td className="px-3 py-2.5 capitalize">{r.gender ?? "—"}</td>
                <td className="whitespace-nowrap px-3 py-2.5">{r.categoryLabel}</td>
                <td className="px-3 py-2.5">{r.kovil ?? "—"}</td>
                <td className="px-3 py-2.5">{r.native ?? "—"}</td>
                <td className="px-3 py-2.5">
                  <StatusBadges status={r.status} dateChange={r.dateChangeResponse} />
                </td>
                <td className="whitespace-nowrap px-3 py-2.5 text-xs text-foreground/60">
                  <time dateTime={r.registeredAt}>{r.registeredLabel}</time>
                </td>
                <td className="px-3 py-2.5 text-right">
                  <Link
                    href={registrationAdminHref(r.tournamentId, r.id)}
                    className={buttonClasses("outline", "sm")}
                  >
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Phones: one card per player. */}
      <ul className="space-y-3 sm:hidden">
        {rows.map((r, i) => (
          <li
            key={r.id}
            ref={(el) => {
              if (window.matchMedia?.("(max-width: 639px)").matches) rowRefs.current[i] = el;
            }}
            className={`rounded-lg border bg-card p-4 shadow-sm ${i === active ? "border-gold" : "border-border"}`}
          >
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={selected.has(r.id)}
                onChange={() => toggle(r.id)}
                aria-label={`Select ${r.fullName}`}
                className="mt-1 size-4 flex-none accent-[var(--charcoal)]"
              />
              <div className="min-w-0 flex-1">
                <p className="font-medium text-charcoal">
                  {r.fullName}
                  <DuplicateFlag dup={r.duplicate} />
                </p>
                <p className="font-mono text-xs text-foreground/60">{r.registrationNo ?? "—"}</p>
                <div className="mt-2">
                  <StatusBadges status={r.status} dateChange={r.dateChangeResponse} />
                </div>
                <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
                  <dt className="text-foreground/50">Email</dt>
                  <dd className="truncate">{r.email}</dd>
                  <dt className="text-foreground/50">Mobile</dt>
                  <dd className="tabular-nums">{r.phone}</dd>
                  <dt className="text-foreground/50">Category</dt>
                  <dd>
                    {r.categoryLabel} · <span className="capitalize">{r.gender ?? "—"}</span>
                  </dd>
                  <dt className="text-foreground/50">Kovil · Native</dt>
                  <dd>
                    {r.kovil ?? "—"} · {r.native ?? "—"}
                  </dd>
                  <dt className="text-foreground/50">Registered</dt>
                  <dd>{r.registeredLabel}</dd>
                </dl>
              </div>
            </div>
            <Link
              href={registrationAdminHref(r.tournamentId, r.id)}
              className={buttonClasses("outline", "sm", "mt-3 w-full")}
            >
              View
            </Link>
          </li>
        ))}
      </ul>

      {asking && (
        <Modal
          title={`Request changes from ${selected.size} player${selected.size === 1 ? "" : "s"}`}
          onClose={() => setAsking(false)}
        >
          <form action={changesAction} className="space-y-3 text-sm">
            {ids.map((id) => (
              <input key={id} type="hidden" name="ids" value={id} />
            ))}
            <label htmlFor="bulk-reason" className="block text-foreground/80">
              What needs changing? Each player sees this in an email with a &ldquo;Fix by&rdquo;
              date 7 days from now; their seat is held until then.
            </label>
            <textarea
              id="bulk-reason"
              name="reason"
              required
              minLength={5}
              rows={4}
              autoFocus
              className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-charcoal"
            />
            {changesState && !changesState.done && changesState.message && (
              <p className="text-red-700">{changesState.message}</p>
            )}
            <div className="flex gap-2">
              <Button type="submit" disabled={requesting}>
                {requesting ? "Sending…" : "Send request"}
              </Button>
              <Button type="button" variant="outline" onClick={() => setAsking(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
