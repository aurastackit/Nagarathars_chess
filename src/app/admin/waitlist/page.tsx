import { prisma } from "@/lib/prisma";
import { Card, EmptyState } from "@/components/ui";
import { requireAdminPage } from "@/lib/require-admin";
import { formatDateTimeIST } from "@/lib/format";
import { WAITLIST_INTEREST_LABEL, WAITLIST_INTEREST_LEVELS } from "@/lib/validations";
import { ExportLinks } from "@/components/admin/export-links";

export const dynamic = "force-dynamic";

/** Read-only list of people waiting for online classes to open. */
export default async function AdminWaitlistPage() {
  await requireAdminPage();
  const entries = await prisma.classWaitlist.findMany({ orderBy: { createdAt: "desc" } });
  const countFor = (level: string | null) =>
    entries.filter((e) => (e.interestLevel ?? null) === level).length;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-charcoal">Classes waitlist</h1>
          <p className="mt-1 text-sm text-foreground/60">
            {entries.length} {entries.length === 1 ? "person is" : "people are"} waiting to hear
            when online classes open.
          </p>
        </div>
        {entries.length > 0 && (
          <ExportLinks csv="/admin/waitlist/waitlist.csv" xlsx="/admin/waitlist/waitlist.xlsx" />
        )}
      </div>

      {entries.length === 0 ? (
        <EmptyState className="mt-6" message="Nobody has joined the classes waitlist yet." />
      ) : (
        <>
          <ul className="mt-6 flex flex-wrap gap-2 text-xs font-medium">
            {[...WAITLIST_INTEREST_LEVELS, null].map((level) => (
              <li
                key={level ?? "none"}
                className="rounded-full bg-charcoal/5 px-3 py-1 text-charcoal"
              >
                {level ? WAITLIST_INTEREST_LABEL[level] : "No level given"}: {countFor(level)}
              </li>
            ))}
          </ul>
          <Card className="mt-4 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[36rem] text-left text-sm">
                <thead className="bg-charcoal/5 text-foreground/60">
                  <tr>
                    <th className="px-4 py-2 font-medium">Joined (IST)</th>
                    <th className="px-4 py-2 font-medium">Email</th>
                    <th className="px-4 py-2 font-medium">Phone</th>
                    <th className="px-4 py-2 font-medium">Interested in</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((e) => (
                    <tr key={e.id} className="border-t border-border">
                      <td className="whitespace-nowrap px-4 py-2 text-foreground/60">
                        {formatDateTimeIST(e.createdAt)}
                      </td>
                      <td className="px-4 py-2">
                        <a href={`mailto:${e.email}`} className="hover:underline">
                          {e.email}
                        </a>
                      </td>
                      <td className="whitespace-nowrap px-4 py-2">{e.phone ?? "—"}</td>
                      <td className="px-4 py-2">
                        {e.interestLevel
                          ? (WAITLIST_INTEREST_LABEL[e.interestLevel] ?? e.interestLevel)
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
