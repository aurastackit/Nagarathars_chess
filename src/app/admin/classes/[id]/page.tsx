import { notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { Card, Input, Label, Textarea, Button, Badge } from "@/components/ui";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function ManageClassPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const classProgram = await prisma.classProgram.findUnique({
    where: { id },
    include: { enrollments: { orderBy: { enrolledAt: "desc" } } },
  });

  if (!classProgram) notFound();

  async function updateClass(formData: FormData) {
    "use server";
    await prisma.classProgram.update({
      where: { id },
      data: {
        title: String(formData.get("title") ?? ""),
        level: String(formData.get("level") ?? "beginner") as never,
        sessionType: String(formData.get("sessionType") ?? "group") as never,
        price: Number(formData.get("price") ?? 0),
        maxGroupSize: formData.get("maxGroupSize") ? Number(formData.get("maxGroupSize")) : null,
        durationMinutes: Number(formData.get("durationMinutes") ?? 60),
        description: String(formData.get("description") ?? ""),
        scheduleText: String(formData.get("scheduleText") ?? ""),
        instructorName: String(formData.get("instructorName") ?? ""),
        bannerImageUrl: String(formData.get("bannerImageUrl") ?? "") || null,
        isOnline: formData.get("isOnline") === "on",
      },
    });
    revalidatePath(`/admin/classes/${id}`);
    revalidatePath("/admin/classes");
    revalidatePath("/classes");
  }

  return (
    <div>
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold text-charcoal">{classProgram.title}</h1>
        <Badge tone="gold">{classProgram.level}</Badge>
      </div>

      <Card className="mt-6 p-6">
        <form action={updateClass} className="space-y-4">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input id="title" name="title" defaultValue={classProgram.title} required />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="level">Level</Label>
              <select
                id="level"
                name="level"
                defaultValue={classProgram.level}
                className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm"
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
            <div className="flex items-end gap-2 pb-2">
              <input
                id="isOnline"
                name="isOnline"
                type="checkbox"
                defaultChecked={classProgram.isOnline}
                className="h-4 w-4"
              />
              <Label htmlFor="isOnline">Online class</Label>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-4">
            <div>
              <Label htmlFor="sessionType">Session type</Label>
              <select
                id="sessionType"
                name="sessionType"
                defaultValue={classProgram.sessionType}
                className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm"
              >
                <option value="group">Group</option>
                <option value="individual">1-on-1</option>
              </select>
            </div>
            <div>
              <Label htmlFor="price">Price (₹ per session)</Label>
              <Input id="price" name="price" type="number" min={0} defaultValue={classProgram.price} />
            </div>
            <div>
              <Label htmlFor="maxGroupSize">Max group size</Label>
              <Input
                id="maxGroupSize"
                name="maxGroupSize"
                type="number"
                min={1}
                defaultValue={classProgram.maxGroupSize ?? undefined}
                placeholder="Group sessions only"
              />
            </div>
            <div>
              <Label htmlFor="durationMinutes">Duration (min)</Label>
              <Input
                id="durationMinutes"
                name="durationMinutes"
                type="number"
                min={15}
                defaultValue={classProgram.durationMinutes}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" rows={4} defaultValue={classProgram.description} required />
          </div>
          <div>
            <Label htmlFor="scheduleText">Schedule</Label>
            <Input id="scheduleText" name="scheduleText" defaultValue={classProgram.scheduleText} required />
          </div>
          <div>
            <Label htmlFor="instructorName">Instructor name</Label>
            <Input id="instructorName" name="instructorName" defaultValue={classProgram.instructorName} required />
          </div>
          <div>
            <Label htmlFor="bannerImageUrl">Banner image URL</Label>
            <Input id="bannerImageUrl" name="bannerImageUrl" defaultValue={classProgram.bannerImageUrl ?? ""} />
          </div>
          <Button type="submit">Save changes</Button>
        </form>
      </Card>

      <section className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">
            Enrollments ({classProgram.enrollments.length})
          </h2>
          <div className="flex gap-4">
            <a
              href={`/admin/classes/${classProgram.id}/enrollments.csv`}
              className="text-sm font-semibold text-charcoal hover:underline"
            >
              Export CSV
            </a>
            <a
              href={`/admin/classes/${classProgram.id}/enrollments.xlsx`}
              className="text-sm font-semibold text-charcoal hover:underline"
            >
              Export Excel
            </a>
          </div>
        </div>
        <Card className="mt-3 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-charcoal/5 text-foreground/60">
                <tr>
                  <th className="px-4 py-2 font-medium">Name</th>
                  <th className="px-4 py-2 font-medium">Email</th>
                  <th className="px-4 py-2 font-medium">Phone</th>
                  <th className="px-4 py-2 font-medium">FIDE ID</th>
                  <th className="px-4 py-2 font-medium">Message</th>
                  <th className="px-4 py-2 font-medium">Enrolled</th>
                </tr>
              </thead>
              <tbody>
                {classProgram.enrollments.map((e) => (
                  <tr key={e.id} className="border-t border-border">
                    <td className="px-4 py-2">{e.fullName}</td>
                    <td className="px-4 py-2">{e.email}</td>
                    <td className="px-4 py-2">{e.phone}</td>
                    <td className="px-4 py-2">{e.fideId ?? "—"}</td>
                    <td className="px-4 py-2 text-foreground/60">{e.message ?? "—"}</td>
                    <td className="px-4 py-2">{formatDate(e.enrolledAt)}</td>
                  </tr>
                ))}
                {classProgram.enrollments.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-foreground/50">
                      No enrollments yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </section>
    </div>
  );
}
