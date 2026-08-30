import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const [tournamentCount, registrationCount, classCount, enrollmentCount, recentRegistrations] =
    await Promise.all([
      prisma.tournament.count(),
      prisma.registration.count(),
      prisma.classProgram.count(),
      prisma.classEnrollment.count(),
      prisma.registration.findMany({
        orderBy: { registeredAt: "desc" },
        take: 8,
        include: { tournament: { select: { title: true } } },
      }),
    ]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-navy">Dashboard</h1>

      <div className="mt-6 grid gap-4 sm:grid-cols-4">
        <Stat label="Tournaments" value={tournamentCount} />
        <Stat label="Total registrants" value={registrationCount} />
        <Stat label="Classes" value={classCount} />
        <Stat label="Class enrollments" value={enrollmentCount} />
      </div>

      <section className="mt-10">
        <h2 className="mb-3 text-lg font-semibold text-foreground">Recent registrations</h2>
        <Card className="overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-navy/5 text-foreground/60">
              <tr>
                <th className="px-4 py-2 font-medium">Name</th>
                <th className="px-4 py-2 font-medium">Tournament</th>
                <th className="px-4 py-2 font-medium">Email</th>
                <th className="px-4 py-2 font-medium">Phone</th>
                <th className="px-4 py-2 font-medium">Registered</th>
              </tr>
            </thead>
            <tbody>
              {recentRegistrations.map((r) => (
                <tr key={r.id} className="border-t border-border">
                  <td className="px-4 py-2">{r.fullName}</td>
                  <td className="px-4 py-2">{r.tournament.title}</td>
                  <td className="px-4 py-2">{r.email}</td>
                  <td className="px-4 py-2">{r.phone}</td>
                  <td className="px-4 py-2">{formatDate(r.registeredAt)}</td>
                </tr>
              ))}
              {recentRegistrations.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-foreground/50">
                    No registrations yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Card>
      </section>

      <p className="mt-6 text-sm text-foreground/60">
        Manage listings under{" "}
        <Link href="/admin/tournaments" className="font-medium text-navy hover:underline">
          Tournaments
        </Link>{" "}
        and{" "}
        <Link href="/admin/classes" className="font-medium text-navy hover:underline">
          Classes
        </Link>
        .
      </p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <Card className="p-4">
      <p className="text-sm text-foreground/60">{label}</p>
      <p className="mt-1 text-3xl font-bold text-navy">{value}</p>
    </Card>
  );
}
