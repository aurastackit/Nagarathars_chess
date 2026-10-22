import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatDateRange, formatWeekdayDate } from "@/lib/format";
import { checkActionQuery } from "@/lib/email/action-links";
import { normalizeStatus } from "@/lib/registration-status";
import { RespondForm } from "./respond-form";
import { respondToDateChange } from "./actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "New tournament date",
  robots: { index: false, follow: false },
};

/**
 * Where the "I'll be there" / "Withdraw" buttons in the date-change email
 * land. Opening the link changes nothing; the player confirms here.
 */
export default async function RespondPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { id } = await params;
  const q = await searchParams;
  const r = await prisma.registration.findUnique({
    where: { id },
    include: { tournament: true },
  });
  if (!r) notFound();

  const check = checkActionQuery(id, q, process.env.AUTH_SECRET ?? "");
  const status = normalizeStatus(r.status);
  const shell = (children: React.ReactNode) => (
    <main className="mx-auto flex min-h-[60vh] max-w-lg flex-col justify-center px-4 py-14">
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
        {children}
      </div>
    </main>
  );

  if (!check.ok) {
    return shell(
      <>
        <h1 className="text-xl font-bold text-charcoal">
          {check.reason === "expired" ? "This link has expired" : "This link isn't valid"}
        </h1>
        <p className="mt-2 text-sm text-foreground/70">
          Please use the buttons in your latest email, or{" "}
          <Link href="/contact" className="underline">
            contact the organisers
          </Link>
          .
        </p>
      </>
    );
  }

  const withdraw = check.action === "withdraw-date";
  const already =
    status === "withdrawn"
      ? "Your registration has been withdrawn and your seat released."
      : !withdraw && r.dateChangeResponse === "accepted"
        ? "You've confirmed the new date — thank you! See you there."
        : null;

  return shell(
    <>
      <p className="text-sm font-semibold uppercase tracking-wide text-gold-ink">
        New tournament date
      </p>
      <h1 className="mt-2 text-xl font-bold text-charcoal">{r.tournament.title}</h1>
      <dl className="mt-4 grid grid-cols-[6rem_1fr] gap-y-1.5 text-sm">
        <dt className="text-foreground/55">Player</dt>
        <dd className="font-medium">
          {r.fullName}
          {r.registrationNo ? ` · ${r.registrationNo}` : ""}
        </dd>
        {r.tournament.previousStartDate && (
          <>
            <dt className="text-foreground/55">Was</dt>
            <dd className="line-through decoration-foreground/40">
              {formatWeekdayDate(r.tournament.previousStartDate)}
            </dd>
          </>
        )}
        <dt className="text-foreground/55">Now</dt>
        <dd className="font-semibold">
          {formatDateRange(r.tournament.startDate, r.tournament.endDate)}
        </dd>
        <dt className="text-foreground/55">Venue</dt>
        <dd>
          {r.tournament.venue}, {r.tournament.city}
        </dd>
      </dl>
      {already ? (
        <p role="status" className="mt-6 rounded-md bg-background px-4 py-3 text-sm">
          {already}
        </p>
      ) : (
        <RespondForm
          id={id}
          a={check.action}
          e={q.e ?? ""}
          t={q.t ?? ""}
          withdraw={withdraw}
          action={respondToDateChange}
        />
      )}
      <p className="mt-6 text-xs text-foreground/55">
        <Link href={`/registration/${id}`} className="underline">
          See your registration
        </Link>
      </p>
    </>
  );
}
