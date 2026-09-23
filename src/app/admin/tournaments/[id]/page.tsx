import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { Card, Input, Label, Textarea, Button, Badge } from "@/components/ui";
import { tournamentSchema } from "@/lib/validations";
import { requireAdminPage } from "@/lib/require-admin";
import { logAdminAction } from "@/lib/audit-log";
import { sendRegistrationDecisionEmail } from "@/lib/notify";
import { RegistrantsPanel } from "@/components/admin/registrants-panel";
import Link from "next/link";

export const dynamic = "force-dynamic";

function toDateInputValue(date: Date) {
  return date.toISOString().slice(0, 10);
}

export default async function ManageTournamentPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  await requireAdminPage();
  const { id } = await params;
  const { error } = await searchParams;
  const tournament = await prisma.tournament.findUnique({
    where: { id },
    include: { registrations: { orderBy: { registeredAt: "desc" } } },
  });

  if (!tournament) notFound();

  async function updateTournament(formData: FormData) {
    "use server";
    const session = await requireAdminPage();
    const parsed = tournamentSchema.safeParse({
      title: formData.get("title"),
      description: formData.get("description"),
      category: formData.get("category"),
      format: formData.get("format"),
      startDate: formData.get("startDate"),
      endDate: formData.get("endDate"),
      venue: formData.get("venue"),
      city: formData.get("city"),
      entryFee: formData.get("entryFee") || 0,
      maxParticipants: formData.get("maxParticipants") || undefined,
      registrationDeadline: formData.get("registrationDeadline"),
      posterImageUrl: formData.get("posterImageUrl"),
      brochurePdfUrl: formData.get("brochurePdfUrl"),
      timeControl: formData.get("timeControl"),
      rounds: formData.get("rounds") || undefined,
      prizeStructure: formData.get("prizeStructure"),
      rulesText: formData.get("rulesText"),
    });

    if (!parsed.success) {
      redirect(
        `/admin/tournaments/${id}?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Invalid input")}`
      );
    }

    const data = parsed.data;
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
        status: String(formData.get("status") ?? "draft") as never,
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
    revalidatePath("/tournaments");
    revalidatePath(`/tournaments/${tournament!.slug}`);
  }

  async function setRegistrationStatus(formData: FormData) {
    "use server";
    const session = await requireAdminPage();
    const registrationId = String(formData.get("registrationId") ?? "");
    const next = String(formData.get("next") ?? "") as "confirmed" | "rejected";
    if (!registrationId || (next !== "confirmed" && next !== "rejected")) return;
    const reason = next === "rejected" ? String(formData.get("reason") ?? "").trim() || null : null;

    const registration = await prisma.registration.update({
      where: { id: registrationId },
      data: { status: next, rejectionReason: reason },
      include: { tournament: true },
    });

    await logAdminAction({
      actorEmail: session.user!.email!,
      action: next === "confirmed" ? "registration.confirm" : "registration.reject",
      targetType: "Registration",
      targetId: registrationId,
      summary: `${next === "confirmed" ? "Confirmed" : "Rejected"} ${registration.fullName}'s registration for "${registration.tournament.title}"${reason ? ` — ${reason}` : ""}`,
    });

    await sendRegistrationDecisionEmail({
      to: registration.email,
      fullName: registration.fullName,
      registrationId: registration.id,
      tournamentTitle: registration.tournament.title,
      decision: next,
      reason,
    });

    revalidatePath(`/admin/tournaments/${id}`);
    revalidatePath(`/registration/${registrationId}`);
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
        {error && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}
        <form action={updateTournament} className="space-y-4">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input id="title" name="title" defaultValue={tournament.title} required />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              rows={4}
              defaultValue={tournament.description}
              required
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label htmlFor="category">Category</Label>
              <Input id="category" name="category" defaultValue={tournament.category} required />
            </div>
            <div>
              <Label htmlFor="format">Format</Label>
              <select
                id="format"
                name="format"
                defaultValue={tournament.format}
                className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm"
              >
                <option value="classical">Classical</option>
                <option value="rapid">Rapid</option>
                <option value="blitz">Blitz</option>
              </select>
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                name="status"
                defaultValue={tournament.status}
                className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="closed">Closed</option>
                <option value="completed">Completed</option>
              </select>
              <p className="mt-1 text-xs text-foreground/50">
                Only &ldquo;Published&rdquo; tournaments appear on the public site.
              </p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="startDate">Start date</Label>
              <Input
                id="startDate"
                name="startDate"
                type="date"
                defaultValue={toDateInputValue(tournament.startDate)}
                required
              />
            </div>
            <div>
              <Label htmlFor="endDate">End date</Label>
              <Input
                id="endDate"
                name="endDate"
                type="date"
                defaultValue={toDateInputValue(tournament.endDate)}
                required
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="venue">Venue</Label>
              <Input id="venue" name="venue" defaultValue={tournament.venue} required />
            </div>
            <div>
              <Label htmlFor="city">City</Label>
              <Input id="city" name="city" defaultValue={tournament.city} required />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label htmlFor="entryFee">Entry fee (₹, 0 = free)</Label>
              <Input
                id="entryFee"
                name="entryFee"
                type="number"
                min={0}
                defaultValue={tournament.entryFee}
              />
            </div>
            <div>
              <Label htmlFor="maxParticipants">Max participants</Label>
              <Input
                id="maxParticipants"
                name="maxParticipants"
                type="number"
                min={1}
                defaultValue={tournament.maxParticipants ?? undefined}
                placeholder="Optional"
              />
            </div>
            <div>
              <Label htmlFor="registrationDeadline">Registration deadline</Label>
              <Input
                id="registrationDeadline"
                name="registrationDeadline"
                type="date"
                defaultValue={toDateInputValue(tournament.registrationDeadline)}
                required
              />
              <p className="mt-1 text-xs text-foreground/50">Must be before the start date.</p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="posterImageUrl">Poster image URL</Label>
              <Input
                id="posterImageUrl"
                name="posterImageUrl"
                defaultValue={tournament.posterImageUrl ?? ""}
              />
            </div>
            <div>
              <Label htmlFor="brochurePdfUrl">Brochure PDF URL</Label>
              <Input
                id="brochurePdfUrl"
                name="brochurePdfUrl"
                defaultValue={tournament.brochurePdfUrl ?? ""}
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="timeControl">Time control</Label>
              <Input
                id="timeControl"
                name="timeControl"
                defaultValue={tournament.timeControl ?? ""}
                placeholder="e.g. 90 min + 30 sec increment"
              />
            </div>
            <div>
              <Label htmlFor="rounds">Rounds</Label>
              <Input
                id="rounds"
                name="rounds"
                type="number"
                min={1}
                defaultValue={tournament.rounds ?? undefined}
                placeholder="Optional"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="prizeStructure">Prize structure</Label>
            <Textarea
              id="prizeStructure"
              name="prizeStructure"
              rows={3}
              defaultValue={tournament.prizeStructure ?? ""}
              placeholder={"1st place — ₹5,000\n2nd place — ₹3,000\nBest U-11 — ₹1,000"}
            />
          </div>
          <div>
            <Label htmlFor="rulesText">Rules</Label>
            <Textarea
              id="rulesText"
              name="rulesText"
              rows={4}
              defaultValue={tournament.rulesText ?? ""}
              placeholder={
                "Eligibility|Open to all age categories, no FIDE rating required.\nTiebreaks|Standard FIDE tiebreak rules apply."
              }
            />
            <p className="mt-1 text-xs text-foreground/50">
              One rule per line, formatted as Title|Details.
            </p>
          </div>
          <Button type="submit">Save changes</Button>
        </form>
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
