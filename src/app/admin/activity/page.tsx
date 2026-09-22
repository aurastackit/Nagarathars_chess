import { prisma } from "@/lib/prisma";
import { Card, EmptyState } from "@/components/ui";
import { requireAdminPage } from "@/lib/require-admin";

export const dynamic = "force-dynamic";

const dateTimeFormatter = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

const ACTION_LABEL: Record<string, string> = {
  "tournament.create": "Created tournament",
  "tournament.update": "Updated tournament",
  "tournament.publish": "Published tournament",
  "tournament.unpublish": "Unpublished tournament",
  "tournament.delete": "Deleted tournament",
  "registration.confirm": "Confirmed registration",
  "registration.reject": "Rejected registration",
  "class.create": "Created class",
  "class.update": "Updated class",
};

export default async function AdminActivityPage() {
  await requireAdminPage();

  const entries = await prisma.adminActivityLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-charcoal">Activity log</h1>
      <p className="mt-1 text-sm text-foreground/60">The last {entries.length} admin actions.</p>

      {entries.length === 0 ? (
        <EmptyState className="mt-6" message="No admin actions recorded yet." />
      ) : (
        <Card className="mt-6 overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-charcoal/5 text-foreground/60">
              <tr>
                <th className="px-4 py-2 font-medium">When</th>
                <th className="px-4 py-2 font-medium">Actor</th>
                <th className="px-4 py-2 font-medium">Action</th>
                <th className="px-4 py-2 font-medium">Details</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr key={e.id} className="border-t border-border align-top">
                  <td className="whitespace-nowrap px-4 py-2 text-foreground/60">{dateTimeFormatter.format(e.createdAt)}</td>
                  <td className="px-4 py-2">{e.actorEmail}</td>
                  <td className="whitespace-nowrap px-4 py-2 font-medium text-charcoal">{ACTION_LABEL[e.action] ?? e.action}</td>
                  <td className="px-4 py-2 text-foreground/70">{e.summary}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
