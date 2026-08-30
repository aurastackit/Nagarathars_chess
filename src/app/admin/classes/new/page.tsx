import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slug";
import { Card, Input, Label, Textarea, Button } from "@/components/ui";

async function createClass(formData: FormData) {
  "use server";
  const title = String(formData.get("title") ?? "");
  const classProgram = await prisma.classProgram.create({
    data: {
      title,
      slug: `${slugify(title)}-${Date.now().toString(36)}`,
      level: String(formData.get("level") ?? "beginner") as never,
      description: String(formData.get("description") ?? ""),
      scheduleText: String(formData.get("scheduleText") ?? ""),
      instructorName: String(formData.get("instructorName") ?? ""),
      bannerImageUrl: String(formData.get("bannerImageUrl") ?? "") || null,
      isOnline: formData.get("isOnline") === "on",
    },
  });
  redirect(`/admin/classes/${classProgram.id}`);
}

export default function NewClassPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-navy">New Class</h1>
      <Card className="mt-6 p-6">
        <form action={createClass} className="space-y-4">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input id="title" name="title" required />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="level">Level</Label>
              <select id="level" name="level" className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm">
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
            <div className="flex items-end gap-2 pb-2">
              <input id="isOnline" name="isOnline" type="checkbox" defaultChecked className="h-4 w-4" />
              <Label htmlFor="isOnline">Online class</Label>
            </div>
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" rows={4} required />
          </div>
          <div>
            <Label htmlFor="scheduleText">Schedule</Label>
            <Input id="scheduleText" name="scheduleText" placeholder="e.g. Tue–Fri 5–8 PM" required />
          </div>
          <div>
            <Label htmlFor="instructorName">Instructor name</Label>
            <Input id="instructorName" name="instructorName" required />
          </div>
          <div>
            <Label htmlFor="bannerImageUrl">Banner image URL</Label>
            <Input id="bannerImageUrl" name="bannerImageUrl" placeholder="Optional" />
          </div>
          <Button type="submit">Create class</Button>
        </form>
      </Card>
    </div>
  );
}
