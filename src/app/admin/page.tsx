import Link from "next/link";
import { Badge, Card } from "@/components/ui";
import { requireAdminPage } from "@/lib/require-admin";
import { formatDateRange, formatDateTimeIST } from "@/lib/format";
import { endOfDayIST } from "@/lib/datetime";
import {
  CHART_DAYS,
  getDashboard,
  getDashboardTournaments,
  type AttentionItem,
} from "@/lib/admin-dashboard";
import { RegistrationsVsEditsChart } from "@/components/admin/charts-lazy";
import { TournamentSwitcher } from "@/components/admin/tournament-switcher";

export const dynamic = "force-dynamic";

const KIND_LABEL: Record<AttentionItem["kind"], string> = {
  pending: "Review",
  changes: "Changes",
  date: "New date",
  email: "Email",
};

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ t?: string }>;
}) {
  await requireAdminPage();
  const { t } = await searchParams;
  // An explicit ?t= can load in parallel with the switcher's list; otherwise
  // the list decides the default tournament first.
  const explicit = t && t !== "all" ? t : null;
  const [{ list, defaultId }, early] = await Promise.all([
    getDashboardTournaments(),
    t === "all" ? getDashboard(null) : explicit ? getDashboard(explicit) : null,
  ]);
  const selected = t === "all" ? null : (list.find((x) => x.id === t)?.id ?? defaultId);
  const d =
    early && (t === "all" || early.tournament?.id === selected)
      ? early
      : await getDashboard(selected);
  const tour = d.tournament;
  const s = d.statuses;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-charcoal">Dashboard</h1>
          {tour ? (
            <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-foreground/60">
              <span>{formatDateRange(tour.startDate, tour.endDate)}</span>
              <span aria-hidden="true">·</span>
              <span>
                Registration closes {formatDateTimeIST(endOfDayIST(tour.registrationDeadline))} IST
              </span>
              <Badge tone={tour.status === "published" ? "success" : "gray"}>{tour.status}</Badge>
              <Link
                href={`/admin/tournaments/${tour.id}`}
                className="font-semibold text-charcoal hover:underline"
              >
                Manage →
              </Link>
            </p>
          ) : (
            <p className="mt-1 text-sm text-foreground/60">Totals across every tournament.</p>
          )}
        </div>
        <TournamentSwitcher
          value={selected ?? "all"}
          tournaments={list.map((x) => ({
            id: x.id,
            title: x.title,
            year: x.startDate.getUTCFullYear(),
            note: x.status === "draft" || x.status === "unlisted" ? x.status : null,
          }))}
        />
      </div>

      <section
        aria-label="Key figures"
        className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5"
      >
        <Kpi label="Applications" value={s.total} hint="All statuses" />
        <Kpi label="Waiting for review" value={s.pending} attention={s.pending > 0} />
        <Kpi label="Confirmed" value={s.confirmed} />
        <Kpi
          label="Changes requested"
          value={s.changesRequested}
          attention={s.changesRequested > 0}
          hint="Seat held 7 days"
        />
        <Kpi label="Rejected" value={s.rejected} />
        <Kpi label="Withdrawn" value={s.withdrawn} />
        <Kpi
          label="Seats left"
          value={d.seats.left ?? "—"}
          hint={
            !tour
              ? "Pick a tournament"
              : d.seats.max === null
                ? "No seat limit"
                : `${d.seats.taken} of ${d.seats.max} taken`
          }
        />
        <Kpi
          label="Approval rate"
          value={d.approvalRate === null ? "—" : `${d.approvalRate}%`}
          hint={d.approvalRate === null ? "Nothing decided yet" : "Confirmed of decided"}
        />
        <Kpi
          label="New date accepted"
          value={d.dateChange.accepted}
          hint={
            tour && !tour.dateChangedAt ? "Date not changed" : `${d.dateChange.declined} declined`
          }
        />
        <Kpi
          label="New date: no reply"
          value={d.dateChange.pending}
          attention={d.dateChange.pending > 0}
          hint={tour && !tour.dateChangedAt ? "Date not changed" : "Waiting for players"}
        />
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="min-w-0 p-5 lg:col-span-2">
          <h2 className="text-sm font-semibold text-charcoal">
            Registrations vs edits — last {CHART_DAYS} days
          </h2>
          <p className="mt-0.5 text-xs text-foreground/50">
            New applications and players&apos; resubmissions per day (IST).
          </p>
          <div className="mt-3">
            <RegistrationsVsEditsChart data={d.chart} />
          </div>
        </Card>

        <Card className="min-w-0 p-5">
          <h2 className="text-sm font-semibold text-charcoal">Category × gender</h2>
          <p className="mt-0.5 text-xs text-foreground/50">
            Pending, confirmed and changes requested.
          </p>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm tabular-nums">
              <thead className="text-xs text-foreground/50">
                <tr>
                  <th className="py-1.5 text-left font-medium">Category</th>
                  <th className="py-1.5 text-right font-medium">Male</th>
                  <th className="py-1.5 text-right font-medium">Female</th>
                  <th className="py-1.5 text-right font-medium">Other</th>
                  {d.showUnknownGender && (
                    <th className="py-1.5 text-right font-medium">Not given</th>
                  )}
                  <th className="py-1.5 text-right font-medium text-charcoal">Total</th>
                </tr>
              </thead>
              <tbody>
                {d.categoryRows.map((r) => (
                  <tr key={r.label} className="border-t border-border">
                    <td className="py-2">{r.label}</td>
                    <td className="py-2 text-right">{r.male}</td>
                    <td className="py-2 text-right">{r.female}</td>
                    <td className="py-2 text-right">{r.other}</td>
                    {d.showUnknownGender && <td className="py-2 text-right">{r.unknown}</td>}
                    <td className="py-2 text-right font-semibold text-charcoal">{r.total}</td>
                  </tr>
                ))}
                <tr className="border-t-2 border-border font-semibold text-charcoal">
                  <td className="py-2">Total</td>
                  {(["male", "female", "other"] as const).map((g) => (
                    <td key={g} className="py-2 text-right">
                      {d.categoryRows.reduce((a, r) => a + r[g], 0)}
                    </td>
                  ))}
                  {d.showUnknownGender && (
                    <td className="py-2 text-right">
                      {d.categoryRows.reduce((a, r) => a + r.unknown, 0)}
                    </td>
                  )}
                  <td className="py-2 text-right">
                    {d.categoryRows.reduce((a, r) => a + r.total, 0)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="min-w-0 p-5 lg:col-span-2">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-sm font-semibold text-charcoal">Needs attention</h2>
            <span className="text-xs text-foreground/50">
              {d.attention.length} item{d.attention.length === 1 ? "" : "s"}
            </span>
          </div>
          {d.attention.length === 0 ? (
            <p className="mt-6 pb-4 text-center text-sm text-foreground/50">
              All caught up — nothing is waiting on you.
            </p>
          ) : (
            <ul className="mt-3 divide-y divide-border">
              {d.attention.slice(0, 8).map((a) => (
                <li key={a.id}>
                  <Link
                    href={a.href}
                    className="flex items-start gap-3 py-2.5 hover:bg-charcoal/[0.03]"
                  >
                    <span
                      className={`mt-0.5 min-w-[4.75rem] flex-none whitespace-nowrap rounded px-1.5 py-0.5 text-center text-[11px] font-semibold uppercase tracking-wide ${
                        a.urgent ? "bg-warning/15 text-warning" : "bg-charcoal/5 text-foreground/60"
                      }`}
                    >
                      {KIND_LABEL[a.kind]}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-charcoal">
                        {a.who}
                      </span>
                      <span className="block text-xs text-foreground/60">
                        {a.title} — {a.detail}
                        {a.urgent && (
                          <span className="font-semibold text-warning"> · overdue or due soon</span>
                        )}
                      </span>
                    </span>
                    <span className="flex-none text-xs font-semibold text-gold-ink">Open →</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          {d.attention.length > 8 && (
            <p className="mt-2 text-xs text-foreground/50">…and {d.attention.length - 8} more.</p>
          )}
        </Card>

        <Card className="min-w-0 p-5">
          <h2 className="text-sm font-semibold text-charcoal">Email health</h2>
          <p className="mt-0.5 text-xs text-foreground/50">Last {d.email.windowDays} days</p>
          <dl className="mt-4 grid grid-cols-2 gap-3">
            <div>
              <dt className="text-xs text-foreground/60">Sent</dt>
              <dd className="text-2xl font-bold tabular-nums text-charcoal">{d.email.sent}</dd>
            </div>
            <div>
              <dt className="text-xs text-foreground/60">Failed</dt>
              <dd
                className={`text-2xl font-bold tabular-nums ${d.email.failed ? "text-red-700" : "text-charcoal"}`}
              >
                {d.email.failed}
              </dd>
            </div>
          </dl>
          <p className="mt-4 flex items-start gap-2 text-sm">
            {d.email.failed === 0 ? (
              <>
                <Badge tone="success">OK</Badge>
                <span className="text-foreground/70">
                  {d.email.sent
                    ? "Every email was handed to the mail service."
                    : "No emails in this period."}
                </span>
              </>
            ) : (
              <>
                <Badge tone="danger">Failing</Badge>
                <span className="text-foreground/70">
                  Last failure {d.email.lastFailure?.when} ({d.email.lastFailure?.who}):{" "}
                  {d.email.lastFailure?.note}
                </span>
              </>
            )}
          </p>
        </Card>
      </div>

      <Card className="p-5">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-sm font-semibold text-charcoal">Recent activity</h2>
          <Link
            href="/admin/activity"
            className="text-xs font-semibold text-gold-ink hover:underline"
          >
            Admin activity log →
          </Link>
        </div>
        {d.recent.length === 0 ? (
          <p className="mt-6 pb-4 text-center text-sm text-foreground/50">
            No registration activity yet.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-border">
            {d.recent.map((r) => (
              <li key={r.id} className="py-2 text-sm sm:flex sm:items-baseline sm:gap-3">
                {/* Phones: time and who-did-it on one line above the text; wider: one row. */}
                <div className="flex justify-between gap-3 text-xs text-foreground/50 sm:contents">
                  <time dateTime={r.at.toISOString()} className="sm:w-24 sm:flex-none">
                    {r.when}
                  </time>
                  <span className="truncate sm:order-last sm:flex-none">{r.actor}</span>
                </div>
                <Link
                  href={r.href}
                  className="mt-0.5 block min-w-0 hover:underline sm:mt-0 sm:flex-1"
                >
                  <span className="font-medium text-charcoal">{r.who}</span>
                  {r.registrationNo && (
                    <span className="text-foreground/50"> · {r.registrationNo}</span>
                  )}
                  <span className="text-foreground/70"> — {r.what}</span>
                  {!tour && <span className="text-foreground/50"> · {r.tournament}</span>}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function Kpi({
  label,
  value,
  hint,
  attention = false,
}: {
  label: string;
  value: number | string;
  hint?: string;
  /** Something is waiting on the organisers: tint the value. */
  attention?: boolean;
}) {
  return (
    <Card className="p-4">
      <p className="text-xs font-medium text-foreground/60">{label}</p>
      <p
        className={`mt-1 text-2xl font-bold tabular-nums ${attention ? "text-warning" : "text-charcoal"}`}
      >
        {value}
      </p>
      {hint && <p className="mt-0.5 truncate text-xs text-foreground/50">{hint}</p>}
    </Card>
  );
}
