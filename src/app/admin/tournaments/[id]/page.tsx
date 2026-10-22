import { notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { Card, Badge } from "@/components/ui";
import { parseTournamentForm, type TournamentFormState } from "@/lib/tournament-form";
import { TournamentForm } from "@/components/admin/tournament-form";
import { requireAdminPage } from "@/lib/require-admin";
import { logAdminAction } from "@/lib/audit-log";
import { sendRegistrationDecisionEmail } from "@/lib/notify";
import { RegistrantsPanel } from "@/components/admin/registrants-panel";
import Link from "next/link";
import { revalidateTournamentPages, revalidateTournamentSeats } from "@/lib/revalidate-public";
import { StaleStatusError, changeRegistrationStatus } from "@/lib/registration-workflow";
import { InvalidTransitionError } from "@/lib/registration-status";
import { sendRegistrationEmail } from "@/lib/registration-events";

export const dynamic = "force-dynamic";

function toDateInputValue(date: Date) {
  return date.toISOString().slice(0, 10);
}

export default async function ManageTournamentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdminPage();
  const { id } = await params;
  const tournament = await prisma.tournament.findUnique({
    where: { id },
    include: { registrations: { orderBy: { registeredAt: "desc" } } },
  });

  if (!tournament) notFound();

  async function updateTournament(
    state: TournamentFormState,
    formData: FormData
  ): Promise<TournamentFormState> {
    "use server";
    const session = await requireAdminPage();
    const parsed = parseTournamentForm(formData, { withStatus: true });
    if (!parsed.ok) return parsed.state;

    const { data, status } = parsed;
    await prisma.tournament.update({
      where: { id },
      data: {
        title: data.title,
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
        status,
      },
    });
    await logAdminAction({
      actorEmail: session.user!.email!,
      action: "tournament.update",
      targetType: "Tournament",
      targetId: id,
      summary: `Updated "${data.title}"`,
    });
    revalidatePath(`/admin/tournaments/${id}`);
    revalidatePath("/admin/tournaments");
    revalidateTournamentPages();
    return { saves: (state?.saves ?? 0) + 1 };
  }

  async function setRegistrationStatus(formData: FormData) {
    "use server";
    const session = await requireAdminPage();
    const registrationId = String(formData.get("registrationId") ?? "");
    const next = String(formData.get("next") ?? "") as "confirmed" | "rejected";
    if (!registrationId || (next !== "confirmed" && next !== "rejected")) return;
    const reason = next === "rejected" ? String(formData.get("reason") ?? "").trim() || null : null;

    const admin = session.user!.email!;
    let registration;
    try {
      registration = await changeRegistrationStatus({
        registrationId,
        to: next,
        actor: { type: "admin", email: admin },
        reason,
      });
    } catch (err) {
      // Not allowed from its current status, or changed meanwhile: the reloaded page shows the real status.
      if (err instanceof InvalidTransitionError || err instanceof StaleStatusError) {
        revalidatePath(`/admin/tournaments/${id}`);
        return;
      }
      throw err;
    }

    await logAdminAction({
      actorEmail: admin,
      action: next === "confirmed" ? "registration.confirm" : "registration.reject",
      targetType: "Registration",
      targetId: registrationId,
      summary: `${next === "confirmed" ? "Confirmed" : "Rejected"} ${registration.fullName}'s registration for "${registration.tournament.title}"${reason ? ` — ${reason}` : ""}`,
    });

    await sendRegistrationEmail(
      registration.id,
      next === "confirmed" ? "Confirmation" : "Rejection",
      () =>
        sendRegistrationDecisionEmail({
          to: registration.email,
          fullName: registration.fullName,
          registrationId: registration.id,
          tournamentTitle: registration.tournament.title,
          decision: next,
          reason,
        })
    );

    revalidatePath(`/admin/tournaments/${id}`);
    revalidatePath(`/registration/${registrationId}`);
    // A rejection frees a seat.
    revalidateTournamentSeats(registration.tournament.slug);
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-charcoal">{tournament.title}</h1>
          <Badge tone={tournament.status === "published" ? "charcoal" : "gray"}>
            {tournament.status}
          </Badge>
        </div>
        <Link
          href={`/admin/tournaments/${tournament.id}/results`}
          className="text-sm font-semibold text-gold-ink hover:underline"
        >
          Manage results &rarr;
        </Link>
      </div>

      <Card className="mt-6 p-6">
        <TournamentForm
          action={updateTournament}
          mode="edit"
          initial={{
            title: tournament.title,
            description: tournament.description,
            category: tournament.category,
            format: tournament.format,
            status: tournament.status,
            startDate: toDateInputValue(tournament.startDate),
            endDate: toDateInputValue(tournament.endDate),
            venue: tournament.venue,
            city: tournament.city,
            entryFee: String(tournament.entryFee),
            maxParticipants: tournament.maxParticipants?.toString() ?? "",
            registrationDeadline: toDateInputValue(tournament.registrationDeadline),
            posterImageUrl: tournament.posterImageUrl ?? "",
            brochurePdfUrl: tournament.brochurePdfUrl ?? "",
            timeControl: tournament.timeControl ?? "",
            rounds: tournament.rounds?.toString() ?? "",
            prizeStructure: tournament.prizeStructure ?? "",
            rulesText: tournament.rulesText ?? "",
          }}
        />
      </Card>

      <section className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">
            Registrants ({tournament.registrations.length})
          </h2>
          <div className="flex gap-4">
            <a
              href={`/admin/tournaments/${tournament.id}/registrations.csv`}
              className="text-sm font-semibold text-charcoal hover:underline"
            >
              Export CSV
            </a>
            <a
              href={`/admin/tournaments/${tournament.id}/registrations.xlsx`}
              className="text-sm font-semibold text-charcoal hover:underline"
            >
              Export Excel
            </a>
          </div>
        </div>
        <RegistrantsPanel
          registrations={tournament.registrations}
          setRegistrationStatus={setRegistrationStatus}
        />
      </section>
    </div>
  );
}
