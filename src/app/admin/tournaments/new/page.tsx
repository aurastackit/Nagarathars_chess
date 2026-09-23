import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slug";
import { Card, Input, Label, Textarea, Button } from "@/components/ui";
import { tournamentSchema } from "@/lib/validations";
import { requireAdminPage } from "@/lib/require-admin";
import { logAdminAction } from "@/lib/audit-log";

async function createTournament(formData: FormData) {
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
      `/admin/tournaments/new?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Invalid input")}`
    );
  }

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

export default async function NewTournamentPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await requireAdminPage();
  const { error } = await searchParams;

  return (
    <div>
      <h1 className="text-2xl font-bold text-charcoal">New Tournament</h1>
      <Card className="mt-6 p-6">
        {error && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}
        <form action={createTournament} className="space-y-4">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input id="title" name="title" required />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" rows={4} required />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="category">Category</Label>
              <Input id="category" name="category" placeholder="e.g. Open, U-15, School" required />
            </div>
            <div>
              <Label htmlFor="format">Format</Label>
              <select
                id="format"
                name="format"
                className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm"
              >
                <option value="classical">Classical</option>
                <option value="rapid">Rapid</option>
                <option value="blitz">Blitz</option>
              </select>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="startDate">Start date</Label>
              <Input id="startDate" name="startDate" type="date" required />
            </div>
            <div>
              <Label htmlFor="endDate">End date</Label>
              <Input id="endDate" name="endDate" type="date" required />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="venue">Venue</Label>
              <Input id="venue" name="venue" required />
            </div>
            <div>
              <Label htmlFor="city">City</Label>
              <Input id="city" name="city" required />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label htmlFor="entryFee">Entry fee (₹, 0 = free)</Label>
              <Input id="entryFee" name="entryFee" type="number" min={0} defaultValue={0} />
            </div>
            <div>
              <Label htmlFor="maxParticipants">Max participants</Label>
              <Input
                id="maxParticipants"
                name="maxParticipants"
                type="number"
                min={1}
                placeholder="Optional"
              />
            </div>
            <div>
              <Label htmlFor="registrationDeadline">Registration deadline</Label>
              <Input id="registrationDeadline" name="registrationDeadline" type="date" required />
              <p className="mt-1 text-xs text-foreground/50">Must be before the start date.</p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="posterImageUrl">Poster image URL</Label>
              <Input
                id="posterImageUrl"
                name="posterImageUrl"
                placeholder="/images/sample-tournament-poster.jpg"
              />
            </div>
            <div>
              <Label htmlFor="brochurePdfUrl">Brochure PDF URL</Label>
              <Input id="brochurePdfUrl" name="brochurePdfUrl" placeholder="Optional" />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="timeControl">Time control</Label>
              <Input
                id="timeControl"
                name="timeControl"
                placeholder="e.g. 90 min + 30 sec increment"
              />
            </div>
            <div>
              <Label htmlFor="rounds">Rounds</Label>
              <Input id="rounds" name="rounds" type="number" min={1} placeholder="Optional" />
            </div>
          </div>
          <div>
            <Label htmlFor="prizeStructure">Prize structure</Label>
            <Textarea
              id="prizeStructure"
              name="prizeStructure"
              rows={3}
              placeholder={"1st place — ₹5,000\n2nd place — ₹3,000\nBest U-11 — ₹1,000"}
            />
          </div>
          <div>
            <Label htmlFor="rulesText">Rules</Label>
            <Textarea
              id="rulesText"
              name="rulesText"
              rows={4}
              placeholder={
                "Eligibility|Open to all age categories, no FIDE rating required.\nTiebreaks|Standard FIDE tiebreak rules apply."
              }
            />
            <p className="mt-1 text-xs text-foreground/50">
              One rule per line, formatted as Title|Details.
            </p>
          </div>
          <Button type="submit">Create tournament</Button>
        </form>
      </Card>
    </div>
  );
}
