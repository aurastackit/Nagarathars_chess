import Link from "next/link";
import { requireAdminPage } from "@/lib/require-admin";
import { parsePlayerFilters, playerFiltersQuery } from "@/lib/player-filters";
import { getPlayerList } from "@/lib/player-list";
import { EmptyState, buttonClasses } from "@/components/ui";
import { PlayerFiltersBar } from "@/components/admin/player-filters-bar";
import { PlayerTable } from "@/components/admin/player-table";
import { bulkApprove, bulkRequestChanges } from "./actions";

export const dynamic = "force-dynamic";

/** Every registration, filterable, sortable and exportable — the organisers' working list. */
export default async function PlayersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdminPage();
  const params = await searchParams;
  const filters = parsePlayerFilters(params);
  // Set by the detail page after a delete.
  const deleted = typeof params.deleted === "string" ? params.deleted.slice(0, 40) : null;
  const filesKept = params.files === "kept";
  const { total, rows, tournaments, kovils } = await getPlayerList(filters);
  const pages = Math.max(1, Math.ceil(total / filters.per));
  const first = total === 0 ? 0 : (filters.page - 1) * filters.per + 1;
  const last = Math.min(total, filters.page * filters.per);
  const exportQuery = playerFiltersQuery({ ...filters, page: 1 });
  const pageHref = (page: number) => `?${playerFiltersQuery({ ...filters, page })}`;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-charcoal">Players</h1>
          <p className="mt-1 text-sm text-foreground/60">
            {total} {total === 1 ? "registration matches" : "registrations match"} these filters.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a
            href={`/admin/registrations/export.csv${exportQuery ? `?${exportQuery}` : ""}`}
            className={buttonClasses("outline", "sm")}
          >
            Export CSV
          </a>
          <a
            href={`/admin/registrations/export.xlsx${exportQuery ? `?${exportQuery}` : ""}`}
            className={buttonClasses("outline", "sm")}
          >
            Export Excel
          </a>
        </div>
      </div>

      {deleted && (
        <p
          role="status"
          className="rounded-md border border-green-200 bg-green-50 px-4 py-2 text-sm text-green-800"
        >
          Deleted registration {deleted}
          {filesKept
            ? " — but some of its stored files couldn't be removed (see Activity)."
            : " and its stored files."}
        </p>
      )}

      <PlayerFiltersBar filters={filters} tournaments={tournaments} kovils={kovils} />

      {total === 0 ? (
        <EmptyState
          title="No players match"
          message="Try widening the date range or clearing a filter."
        />
      ) : (
        <>
          <PlayerTable
            rows={rows}
            filters={filters}
            offset={first - 1}
            approve={bulkApprove}
            requestChanges={bulkRequestChanges}
          />
          <nav
            aria-label="Pages"
            className="flex flex-wrap items-center justify-between gap-3 text-sm"
          >
            <p className="text-foreground/60">
              Showing {first}–{last} of {total}
            </p>
            <div className="flex items-center gap-2">
              {filters.page > 1 ? (
                <Link href={pageHref(filters.page - 1)} className={buttonClasses("outline", "sm")}>
                  ← Previous
                </Link>
              ) : (
                <span className={buttonClasses("outline", "sm", "pointer-events-none opacity-40")}>
                  ← Previous
                </span>
              )}
              <span className="px-2 tabular-nums text-foreground/70">
                Page {filters.page} of {pages}
              </span>
              {filters.page < pages ? (
                <Link href={pageHref(filters.page + 1)} className={buttonClasses("outline", "sm")}>
                  Next →
                </Link>
              ) : (
                <span className={buttonClasses("outline", "sm", "pointer-events-none opacity-40")}>
                  Next →
                </span>
              )}
            </div>
          </nav>
        </>
      )}
    </div>
  );
}
