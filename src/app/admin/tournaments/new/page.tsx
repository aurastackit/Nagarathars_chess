import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slug";
import { Card } from "@/components/ui";
import { requireAdminPage } from "@/lib/require-admin";
import { logAdminAction } from "@/lib/audit-log";
import { parseTournamentForm, type TournamentFormState } from "@/lib/tournament-form";
import { TournamentForm } from "@/components/admin/tournament-form";

async function createTournament(
  _state: TournamentFormState,
  formData: FormData
): Promise<TournamentFormState> {
  "use server";
  const session = await requireAdminPage();
  const parsed = parseTournamentForm(formData);
  if (!parsed.ok) return parsed.state;

  const data = parsed.data;
  const tournament = await prisma.tournament.create({
    data: {
      title: data.title,
      slug: `${slugify(data.title)}-${Date.now().toString(36)}`,
      description: data.description,
      category: data.category,
      format: data.format,
      startDate: data.startDate,
      endDate: data.endDate,
      venue: data.venue,
      city: data.city,
      entryFee: data.entryFee,
      maxParticipants: data.maxParticipants ?? null,
      registrationDeadline: data.registrationDeadline,
      posterImageUrl: data.posterImageUrl || null,
      brochurePdfUrl: data.brochurePdfUrl || null,
      timeControl: data.timeControl || null,
      rounds: data.rounds ?? null,
      prizeStructure: data.prizeStructure || null,
      rulesText: data.rulesText || null,
      status: "draft",
    },
  });
  await logAdminAction({
    actorEmail: session.user!.email!,
    action: "tournament.create",
    targetType: "Tournament",
    targetId: tournament.id,
    summary: `Created "${tournament.title}"`,
  });
  redirect(`/admin/tournaments/${tournament.id}`);
}

export default async function NewTournamentPage() {
  await requireAdminPage();

  return (
    <div>
      <h1 className="text-2xl font-bold text-charcoal">New Tournament</h1>
      <Card className="mt-6 p-6">
        <TournamentForm
          action={createTournament}
          mode="create"
          initial={{ format: "classical", entryFee: "0" }}
        />
      </Card>
    </div>
  );
}
