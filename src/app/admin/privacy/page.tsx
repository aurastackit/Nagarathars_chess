import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui";
import { requireAdminPage } from "@/lib/require-admin";
import { ageProofRetentionReport } from "@/lib/document-retention";
import { DEFAULT_AGE_PROOF_RETENTION_DAYS } from "@/lib/retention";
import { DOCUMENT_URL_TTL_SECONDS, UPLOAD_URL_TTL_SECONDS } from "@/lib/upload-limits";
import { formatDate, formatDateTimeIST } from "@/lib/format";
import { registrationAdminHref } from "@/lib/admin-links";
import { RetentionRunForm } from "@/components/admin/retention-run-form";
import { deleteDueAgeProofsNow } from "./actions";

export const dynamic = "force-dynamic";

type ReportRow = Awaited<ReturnType<typeof ageProofRetentionReport>>["due"][number];

function RetentionTable({ rows, testId }: { rows: ReportRow[]; testId: string }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm" data-testid={testId}>
        <thead className="bg-charcoal/5 text-foreground/60">
          <tr>
            <th className="px-4 py-2 font-medium">Registration</th>
            <th className="px-4 py-2 font-medium">Player</th>
            <th className="px-4 py-2 font-medium">Tournament</th>
            <th className="px-4 py-2 font-medium">Ended</th>
            <th className="px-4 py-2 font-medium">Due on</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-t border-border align-top">
              <td className="whitespace-nowrap px-4 py-2 font-mono text-xs">
                <Link href={registrationAdminHref(r.id)} className="hover:underline">
                  {r.registrationNo ?? r.id}
                </Link>
              </td>
              <td className="px-4 py-2">{r.fullName}</td>
              <td className="px-4 py-2">{r.tournament}</td>
              <td className="whitespace-nowrap px-4 py-2">{formatDate(r.endedOn)}</td>
              <td className="whitespace-nowrap px-4 py-2">{formatDate(r.deleteOn)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Where personal documents stand: what the daily job will delete, recent clean-ups and who viewed age proofs. */
export default async function AdminPrivacyPage() {
  await requireAdminPage();
  const [report, runs, views] = await Promise.all([
    ageProofRetentionReport(),
    prisma.adminActivityLog.findMany({
      where: { action: "retention.age_proofs" },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.registrationEvent.findMany({
      where: { type: "document_viewed", note: "Age proof" },
      orderBy: { createdAt: "desc" },
      take: 25,
      include: { registration: { select: { id: true, registrationNo: true, fullName: true } } },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-charcoal">Privacy &amp; documents</h1>
        <p className="mt-1 text-sm text-foreground/60">
          Age proofs are only needed to check age categories. They&apos;re deleted automatically{" "}
          <strong data-testid="retention-days">{report.days} days</strong> after the tournament
          ends, by the daily job (9:00 am IST). The rest of the registration is kept.
          {report.days === DEFAULT_AGE_PROOF_RETENTION_DAYS
            ? " To change the period, set AGE_PROOF_RETENTION_DAYS in Amplify."
            : ` (Set by AGE_PROOF_RETENTION_DAYS; the default is ${DEFAULT_AGE_PROOF_RETENTION_DAYS}.)`}
        </p>
      </div>

      <Card padding="md">
        <h2 className="text-lg font-semibold text-charcoal">
          Due for deletion now ({report.due.length})
        </h2>
        {report.due.length === 0 ? (
          <p className="mt-2 text-sm text-foreground/60">Nothing is due.</p>
        ) : (
          <div className="mt-3 space-y-4">
            <p className="text-sm text-foreground/70">
              The next daily run deletes these. You can also delete them now.
            </p>
            <RetentionTable rows={report.due} testId="retention-due" />
          </div>
        )}
        {/* Outside the list, so its result still shows once nothing is due. */}
        <RetentionRunForm count={report.due.length} action={deleteDueAgeProofsNow} />
      </Card>

      <Card padding="md">
        <h2 className="text-lg font-semibold text-charcoal">
          Coming up in the next 30 days ({report.upcoming.length})
        </h2>
        {report.upcoming.length === 0 ? (
          <p className="mt-2 text-sm text-foreground/60">Nothing in the next 30 days.</p>
        ) : (
          <div className="mt-3">
            <RetentionTable rows={report.upcoming} testId="retention-upcoming" />
          </div>
        )}
      </Card>

      <Card padding="md">
        <h2 className="text-lg font-semibold text-charcoal">Recent clean-ups</h2>
        {runs.length === 0 ? (
          <p className="mt-2 text-sm text-foreground/60">
            The clean-up hasn&apos;t run yet (it needs CRON_SECRET to reach the site).
          </p>
        ) : (
          <ul className="mt-3 space-y-2 text-sm" data-testid="retention-runs">
            {runs.map((run) => (
              <li key={run.id}>
                <span className="text-foreground/60">{formatDateTimeIST(run.createdAt)}</span> ·{" "}
                {run.actorEmail} · {run.summary}
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card padding="md">
        <h2 className="text-lg font-semibold text-charcoal">Recent age-proof views</h2>
        <p className="mt-1 text-sm text-foreground/60">
          Every time an admin opens an age proof, it&apos;s recorded here and on the
          registration&apos;s timeline.
        </p>
        {views.length === 0 ? (
          <p className="mt-2 text-sm text-foreground/60">No views recorded yet.</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-left text-sm" data-testid="age-proof-views">
              <thead className="bg-charcoal/5 text-foreground/60">
                <tr>
                  <th className="px-4 py-2 font-medium">When</th>
                  <th className="px-4 py-2 font-medium">Admin</th>
                  <th className="px-4 py-2 font-medium">Registration</th>
                </tr>
              </thead>
              <tbody>
                {views.map((v) => (
                  <tr key={v.id} className="border-t border-border">
                    <td className="whitespace-nowrap px-4 py-2 text-foreground/60">
                      {formatDateTimeIST(v.createdAt)}
                    </td>
                    <td className="px-4 py-2">{v.actor ?? "—"}</td>
                    <td className="px-4 py-2">
                      <Link
                        href={registrationAdminHref(v.registration.id)}
                        className="hover:underline"
                      >
                        {v.registration.registrationNo ?? v.registration.id}
                      </Link>{" "}
                      · {v.registration.fullName}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card padding="md">
        <h2 className="text-lg font-semibold text-charcoal">How documents are protected</h2>
        <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-foreground/75">
          <li>
            Photos and age proofs are kept in a private storage bucket with no public access. The
            database stores only each file&apos;s name, never a public link.
          </li>
          <li>
            Files are reached only through signed links: an upload link works for{" "}
            {UPLOAD_URL_TTL_SECONDS / 60} minutes, a viewing link for{" "}
            {DOCUMENT_URL_TTL_SECONDS / 60} minutes.
          </li>
          <li>
            Only signed-in admins can open an age proof. It never appears in emails, exports or ID
            cards.
          </li>
          <li>
            Uploads are checked by what the file contains, not its name — in the browser and again
            on the server — and only from a browser that has verified its email.
          </li>
          <li>
            When a player replaces a document, or a registration is deleted, the old files are
            deleted too.
          </li>
        </ul>
      </Card>
    </div>
  );
}
