import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, LinkButton, Badge } from "@/components/ui";
import { formatDateRange } from "@/lib/format";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

async function togglePublish(id: string, currentStatus: string) {
  "use server";
  const nextStatus = currentStatus === "published" ? "draft" : "published";
  await prisma.tournament.update({ where: { id }, data: { status: nextStatus } });
  revalidatePath("/admin/tournaments");
  revalidatePath("/tournaments");
}

export default async function AdminTournamentsPage() {
  const tournaments = await prisma.tournament.findMany({
    orderBy: { startDate: "desc" },
    include: { _count: { select: { registrations: true } } },
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-navy">Tournaments</h1>
        <LinkButton href="/admin/tournaments/new">New Tournament</LinkButton>
      </div>

      <Card className="mt-6 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-navy/5 text-foreground/60">
            <tr>
              <th className="px-4 py-2 font-medium">Title</th>
              <th className="px-4 py-2 font-medium">Dates</th>
              <th className="px-4 py-2 font-medium">Status</th>
              <th className="px-4 py-2 font-medium">Registrants</th>
              <th className="px-4 py-2 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {tournaments.map((t) => (
              <tr key={t.id} className="border-t border-border">
                <td className="px-4 py-2 font-medium">{t.title}</td>
                <td className="px-4 py-2 text-foreground/60">{formatDateRange(t.startDate, t.endDate)}</td>
                <td className="px-4 py-2">
                  <Badge tone={t.status === "published" ? "navy" : "gray"}>{t.status}</Badge>
                </td>
                <td className="px-4 py-2">
                  <Link href={`/admin/tournaments/${t.id}`} className="font-medium text-navy hover:underline">
                    {t._count.registrations}
                  </Link>
                </td>
                <td className="space-x-3 px-4 py-2 text-right">
                  <form action={togglePublish.bind(null, t.id, t.status)} className="inline">
                    <button type="submit" className="text-xs font-medium text-navy hover:underline">
                      {t.status === "published" ? "Unpublish" : "Publish"}
                    </button>
                  </form>
                  <Link href={`/admin/tournaments/${t.id}`} className="text-xs font-medium text-navy hover:underline">
                    Manage
                  </Link>
                </td>
              </tr>
            ))}
            {tournaments.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-foreground/50">
                  No tournaments yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
