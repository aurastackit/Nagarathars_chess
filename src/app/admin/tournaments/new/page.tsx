import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slug";
import { Card, Input, Label, Textarea, Button } from "@/components/ui";

async function createTournament(formData: FormData) {
  "use server";
  const title = String(formData.get("title") ?? "");
  const tournament = await prisma.tournament.create({
    data: {
      title,
      slug: `${slugify(title)}-${Date.now().toString(36)}`,
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
      status: "draft",
    },
  });
  redirect(`/admin/tournaments/${tournament.id}`);
}

export default function NewTournamentPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-charcoal">New Tournament</h1>
      <Card className="mt-6 p-6">
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
              <select id="format" name="format" className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm">
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
              <Input id="maxParticipants" name="maxParticipants" type="number" min={1} placeholder="Optional" />
            </div>
            <div>
              <Label htmlFor="registrationDeadline">Registration deadline</Label>
              <Input id="registrationDeadline" name="registrationDeadline" type="date" required />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="posterImageUrl">Poster image URL</Label>
              <Input id="posterImageUrl" name="posterImageUrl" placeholder="/images/sample-tournament-poster.jpg" />
            </div>
            <div>
              <Label htmlFor="brochurePdfUrl">Brochure PDF URL</Label>
              <Input id="brochurePdfUrl" name="brochurePdfUrl" placeholder="Optional" />
            </div>
          </div>
          <Button type="submit">Create tournament</Button>
        </form>
      </Card>
    </div>
  );
}
