import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, LinkButton, Badge } from "@/components/ui";
import { formatDateRange } from "@/lib/format";
import { revalidatePath } from "next/cache";
import { requireAdminPage } from "@/lib/require-admin";
import { logAdminAction } from "@/lib/audit-log";
import { revalidateTournamentPages } from "@/lib/revalidate-public";
import {
  DeleteTournamentButton,
  type DeleteTournamentState,
} from "@/components/admin/delete-tournament-button";

export const dynamic = "force-dynamic";

async function togglePublish(id: string, currentStatus: string, title: string) {
  "use server";
  const session = await requireAdminPage();
  const nextStatus = currentStatus === "published" ? "draft" : "published";
  await prisma.tournament.update({ where: { id }, data: { status: nextStatus } });
  await logAdminAction({
    actorEmail: session.user!.email!,
    action: nextStatus === "published" ? "tournament.publish" : "tournament.unpublish",
    targetType: "Tournament",
    targetId: id,
    summary: `${nextStatus === "published" ? "Published" : "Unpublished"} "${title}"`,
  });
  revalidatePath("/admin/tournaments");
  revalidateTournamentPages();
}

async function deleteTournament(
  id: string,
  _state: DeleteTournamentState,
  formData: FormData
): Promise<DeleteTournamentState> {
  "use server";
  const session = await requireAdminPage();
  const tournament = await prisma.tournament.findUnique({
    where: { id },
    select: { title: true, _count: { select: { registrations: true, galleryItems: true } } },
  });
  if (!tournament) return { error: "This tournament no longer exists." };
  if (tournament._count.registrations > 0) {
    return {
      error: `It has ${tournament._count.registrations} registration(s), so it can't be deleted. Unpublish it instead.`,
    };
  }
  if (String(formData.get("confirmTitle") ?? "").trim() !== tournament.title.trim()) {
    return { error: "The title you typed doesn't match." };
  }
  // Gallery items reference the tournament without a cascade: keep the photos, unlink them.
  await prisma.$transaction([
    prisma.galleryItem.updateMany({ where: { tournamentId: id }, data: { tournamentId: null } }),
    prisma.tournament.delete({ where: { id } }),
  ]);
  const unlinked = tournament._count.galleryItems;
  await logAdminAction({
    actorEmail: session.user!.email!,
    action: "tournament.delete",
    targetType: "Tournament",
    targetId: id,
    summary: `Deleted "${tournament.title}" (had no registrations${unlinked ? `; unlinked ${unlinked} gallery item(s)` : ""})`,
  });
  revalidatePath("/admin/tournaments");
  revalidateTournamentPages();
  return null;
}

export default async function AdminTournamentsPage() {
  await requireAdminPage();

  const tournaments = await prisma.tournament.findMany({
    orderBy: { startDate: "desc" },
    include: { _count: { select: { registrations: true } } },
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-charcoal">Tournaments</h1>
        <LinkButton href="/admin/tournaments/new">New Tournament</LinkButton>
      </div>

      <Card className="mt-6 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-charcoal/5 text-foreground/60">
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
                <td className="px-4 py-2 text-foreground/60">
                  {formatDateRange(t.startDate, t.endDate)}
                </td>
                <td className="px-4 py-2">
                  <Badge tone={t.status === "published" ? "charcoal" : "gray"}>{t.status}</Badge>
                </td>
                <td className="px-4 py-2">
                  <Link
                    href={`/admin/tournaments/${t.id}`}
                    className="font-medium text-charcoal hover:underline"
                  >
                    {t._count.registrations}
                  </Link>
                </td>
                <td className="space-x-3 px-4 py-2 text-right">
                  <form
                    action={togglePublish.bind(null, t.id, t.status, t.title)}
                    className="inline"
                  >
                    <button
                      type="submit"
                      className="text-xs font-medium text-charcoal hover:underline"
                    >
                      {t.status === "published" ? "Unpublish" : "Publish"}
                    </button>
                  </form>
                  <Link
                    href={`/admin/tournaments/${t.id}`}
                    className="text-xs font-medium text-charcoal hover:underline"
                  >
                    Manage
                  </Link>
                  <DeleteTournamentButton
                    title={t.title}
                    registrations={t._count.registrations}
                    action={deleteTournament.bind(null, t.id)}
                  />
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
