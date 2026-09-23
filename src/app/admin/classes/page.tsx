import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, LinkButton, Badge } from "@/components/ui";
import { requireAdminPage } from "@/lib/require-admin";

export const dynamic = "force-dynamic";

export default async function AdminClassesPage() {
  await requireAdminPage();
  const classes = await prisma.classProgram.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { enrollments: true } } },
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-charcoal">Classes</h1>
        <LinkButton href="/admin/classes/new">New Class</LinkButton>
      </div>

      <Card className="mt-6 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-charcoal/5 text-foreground/60">
            <tr>
              <th className="px-4 py-2 font-medium">Title</th>
              <th className="px-4 py-2 font-medium">Level</th>
              <th className="px-4 py-2 font-medium">Mode</th>
              <th className="px-4 py-2 font-medium">Price</th>
              <th className="px-4 py-2 font-medium">Enrollments</th>
              <th className="px-4 py-2 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {classes.map((c) => (
              <tr key={c.id} className="border-t border-border">
                <td className="px-4 py-2 font-medium">{c.title}</td>
                <td className="px-4 py-2">
                  <Badge tone="gold-ink">{c.level}</Badge>
                </td>
                <td className="px-4 py-2 text-foreground/60">
                  {c.isOnline ? "Online" : "In-person"}
                </td>
                <td className="px-4 py-2 text-foreground/60">
                  ₹{c.price} &middot; {c.sessionType === "group" ? "Group" : "1-on-1"}
                </td>
                <td className="px-4 py-2">
                  <Link
                    href={`/admin/classes/${c.id}`}
                    className="font-medium text-charcoal hover:underline"
                  >
                    {c._count.enrollments}
                  </Link>
                </td>
                <td className="px-4 py-2 text-right">
                  <Link
                    href={`/admin/classes/${c.id}`}
                    className="text-xs font-medium text-charcoal hover:underline"
                  >
                    Manage
                  </Link>
                </td>
              </tr>
            ))}
            {classes.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-foreground/50">
                  No classes yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
