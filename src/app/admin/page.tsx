import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui";
import { formatDate } from "@/lib/format";
import { requireAdminPage } from "@/lib/require-admin";
import { AGE_CATEGORIES } from "@/lib/age-category";
import { CategoryBreakdownChart, RegistrationsOverTimeChart, TournamentsBarList } from "@/components/admin/charts";

export const dynamic = "force-dynamic";

const DAYS_WINDOW = 30;
const chartDateFormatter = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short" });

export default async function AdminDashboardPage() {
  await requireAdminPage();

  const windowStart = new Date();
  windowStart.setDate(windowStart.getDate() - (DAYS_WINDOW - 1));
  windowStart.setHours(0, 0, 0, 0);

  const [
    tournamentCount,
    registrationCount,
    classCount,
    enrollmentCount,
    recentRegistrations,
    topTournaments,
    categoryGroups,
    paidRegistrations,
    recentRegistrationDates,
  ] = await Promise.all([
    prisma.tournament.count(),
    prisma.registration.count(),
    prisma.classProgram.count(),
    prisma.classEnrollment.count(),
    prisma.registration.findMany({
      orderBy: { registeredAt: "desc" },
      take: 8,
      include: { tournament: { select: { title: true } } },
    }),
    prisma.tournament.findMany({
      orderBy: { registrations: { _count: "desc" } },
      take: 8,
      select: { title: true, _count: { select: { registrations: true } } },
    }),
    prisma.registration.groupBy({ by: ["ageCategory"], _count: true }),
    prisma.registration.findMany({
      where: { paymentStatus: "paid", tournament: { entryFee: { gt: 0 } } },
      select: { amountPaid: true, tournament: { select: { entryFee: true } } },
    }),
    prisma.registration.findMany({
      where: { registeredAt: { gte: windowStart } },
      select: { registeredAt: true },
    }),
  ]);

  const tournamentsWithRegistrants = topTournaments.filter((t) => t._count.registrations > 0);

  const categoryCounts = new Map(categoryGroups.map((g) => [g.ageCategory, g._count]));
  const categoryData = AGE_CATEGORIES.map((c) => ({ label: c.label, count: categoryCounts.get(c.value) ?? 0 }));

  // Guard is redundant with the query's `tournament.entryFee > 0` filter — kept explicit here
  // so this only ever reflects real payments for fee-bearing tournaments, never free entries.
  const paymentsCollected = paidRegistrations
    .filter((r) => r.tournament.entryFee > 0)
    .reduce((sum, r) => sum + (r.amountPaid ?? r.tournament.entryFee), 0);

  const dayBuckets = new Map<string, number>();
  for (let i = 0; i < DAYS_WINDOW; i++) {
    const d = new Date(windowStart);
    d.setDate(d.getDate() + i);
    dayBuckets.set(d.toDateString(), 0);
  }
  for (const r of recentRegistrationDates) {
    const key = r.registeredAt.toDateString();
    dayBuckets.set(key, (dayBuckets.get(key) ?? 0) + 1);
  }
  const overTimeData = [...dayBuckets.entries()].map(([key, count]) => ({
    date: chartDateFormatter.format(new Date(key)),
    count,
  }));

  return (
    <div>
      <h1 className="text-2xl font-bold text-charcoal">Dashboard</h1>

      <div className="mt-6 grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <Stat label="Tournaments" value={tournamentCount} />
        <Stat label="Total registrants" value={registrationCount} />
        <Stat label="Payments collected" value={`₹${paymentsCollected.toLocaleString("en-IN")}`} />
        <Stat label="Classes" value={classCount} />
        <Stat label="Class enrollments" value={enrollmentCount} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <h2 className="text-sm font-semibold text-charcoal">Registrations over the last {DAYS_WINDOW} days</h2>
          <div className="mt-2">
            <RegistrationsOverTimeChart data={overTimeData} />
          </div>
        </Card>
        <Card className="p-5">
          <h2 className="text-sm font-semibold text-charcoal">Category breakdown</h2>
          <div className="mt-2">
            <CategoryBreakdownChart data={categoryData} />
          </div>
        </Card>
      </div>

      <Card className="mt-6 p-5">
        <h2 className="text-sm font-semibold text-charcoal">Registrations per tournament</h2>
        <div className="mt-4">
          <TournamentsBarList data={tournamentsWithRegistrants.map((t) => ({ title: t.title, count: t._count.registrations }))} />
        </div>
      </Card>

      <section className="mt-10">
        <h2 className="mb-3 text-lg font-semibold text-foreground">Recent registrations</h2>
        <Card className="overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-charcoal/5 text-foreground/60">
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
        <Link href="/admin/tournaments" className="font-medium text-charcoal hover:underline">
          Tournaments
        </Link>{" "}
        and{" "}
        <Link href="/admin/classes" className="font-medium text-charcoal hover:underline">
          Classes
        </Link>
        . See who did what in the{" "}
        <Link href="/admin/activity" className="font-medium text-charcoal hover:underline">
          Activity log
        </Link>
        .
      </p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <Card className="p-4">
      <p className="text-sm text-foreground/60">{label}</p>
      <p className="mt-1 text-2xl font-bold text-charcoal">{value}</p>
    </Card>
  );
}
