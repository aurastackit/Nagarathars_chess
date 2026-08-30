import { notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { Card, Input, Label, Textarea, Button, Badge } from "@/components/ui";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

function toDateInputValue(date: Date) {
  return date.toISOString().slice(0, 10);
}

export default async function ManageTournamentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tournament = await prisma.tournament.findUnique({
    where: { id },
    include: { registrations: { orderBy: { registeredAt: "desc" } } },
  });

  if (!tournament) notFound();

  async function updateTournament(formData: FormData) {
    "use server";
    await prisma.tournament.update({
      where: { id },
      data: {
        title: String(formData.get("title") ?? ""),
        description: String(formData.get("description") ?? ""),
        category: String(formData.get("category") ?? ""),
        format: String(formData.get("format") ?? "classical") as never,
        startDate: new Date(String(formData.get("startDate"))),
        endDate: new Date(String(formData.get("endDate"))),
        venue: String(formData.get("venue") ?? ""),
        city: String(formData.get("city") ?? ""),
        entryFee: Number(formData.get("entryFee") ?? 0),
        maxParticipants: formData.get("maxParticipants")
          ? Number(formData.get("maxParticipants"))
          : null,
        registrationDeadline: new Date(String(formData.get("registrationDeadline"))),
        posterImageUrl: String(formData.get("posterImageUrl") ?? "") || null,
        brochurePdfUrl: String(formData.get("brochurePdfUrl") ?? "") || null,
        status: String(formData.get("status") ?? "draft") as never,
      },
    });
    revalidatePath(`/admin/tournaments/${id}`);
    revalidatePath("/admin/tournaments");
    revalidatePath("/tournaments");
  }

  return (
    <div>
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold text-navy">{tournament.title}</h1>
        <Badge tone={tournament.status === "published" ? "navy" : "gray"}>{tournament.status}</Badge>
      </div>

      <Card className="mt-6 p-6">
        <form action={updateTournament} className="space-y-4">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input id="title" name="title" defaultValue={tournament.title} required />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" rows={4} defaultValue={tournament.description} required />
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
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="startDate">Start date</Label>
              <Input id="startDate" name="startDate" type="date" defaultValue={toDateInputValue(tournament.startDate)} required />
            </div>
            <div>
              <Label htmlFor="endDate">End date</Label>
              <Input id="endDate" name="endDate" type="date" defaultValue={toDateInputValue(tournament.endDate)} required />
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
              <Input id="entryFee" name="entryFee" type="number" min={0} defaultValue={tournament.entryFee} />
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
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="posterImageUrl">Poster image URL</Label>
              <Input id="posterImageUrl" name="posterImageUrl" defaultValue={tournament.posterImageUrl ?? ""} />
            </div>
            <div>
              <Label htmlFor="brochurePdfUrl">Brochure PDF URL</Label>
              <Input id="brochurePdfUrl" name="brochurePdfUrl" defaultValue={tournament.brochurePdfUrl ?? ""} />
            </div>
          </div>
          <Button type="submit">Save changes</Button>
        </form>
      </Card>

      <section className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">
            Registrants ({tournament.registrations.length})
          </h2>
          <a
            href={`/admin/tournaments/${tournament.id}/registrations.csv`}
            className="text-sm font-semibold text-navy hover:underline"
          >
            Export CSV
          </a>
        </div>
        <Card className="mt-3 overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-navy/5 text-foreground/60">
              <tr>
                <th className="px-4 py-2 font-medium">Name</th>
                <th className="px-4 py-2 font-medium">Email</th>
                <th className="px-4 py-2 font-medium">Phone</th>
                <th className="px-4 py-2 font-medium">City</th>
                <th className="px-4 py-2 font-medium">Registered</th>
              </tr>
            </thead>
            <tbody>
              {tournament.registrations.map((r) => (
                <tr key={r.id} className="border-t border-border">
                  <td className="px-4 py-2">{r.fullName}</td>
                  <td className="px-4 py-2">{r.email}</td>
                  <td className="px-4 py-2">{r.phone}</td>
                  <td className="px-4 py-2">{r.city ?? "—"}</td>
                  <td className="px-4 py-2">{formatDate(r.registeredAt)}</td>
                </tr>
              ))}
              {tournament.registrations.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-foreground/50">
                    No registrants yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Card>
      </section>
    </div>
  );
}
