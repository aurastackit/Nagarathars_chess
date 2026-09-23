import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatDateRange } from "@/lib/format";
import { LinkButton } from "@/components/ui";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Registration status",
  robots: { index: false, follow: false },
};

const STATUS_META: Record<string, { label: string; tone: string }> = {
  pending: { label: "Pending review", tone: "bg-gold/15 text-gold-ink" },
  confirmed: { label: "Confirmed", tone: "bg-green-100 text-green-700" },
  rejected: { label: "Rejected", tone: "bg-red-100 text-red-700" },
  // Legacy rows created before the review workflow existed.
  registered: { label: "Confirmed", tone: "bg-green-100 text-green-700" },
};

const PAYMENT_META: Record<string, string> = {
  paid: "Paid",
  pending: "Payment pending",
  failed: "Payment failed",
  not_required: "Free entry",
};

export default async function RegistrationStatusPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const registration = await prisma.registration.findUnique({
    where: { id },
    include: { tournament: true },
  });

  if (!registration) notFound();

  const statusMeta = STATUS_META[registration.status] ?? STATUS_META.pending;
  const isConfirmed = registration.status === "confirmed" || registration.status === "registered";
  const tournamentConcluded = new Date() >= registration.tournament.endDate;
  const certificateAvailable = isConfirmed && tournamentConcluded;

  return (
    <main className="mx-auto max-w-2xl px-4 py-14">
      <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
        <span
          className={`inline-block rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${statusMeta.tone}`}
        >
          {statusMeta.label}
        </span>
        <h1 className="mt-4 text-2xl font-bold text-charcoal">{registration.fullName}</h1>
        <p className="mt-1 text-foreground/60">{registration.tournament.title}</p>
        <p className="mt-1 text-sm text-foreground/50">
          {formatDateRange(registration.tournament.startDate, registration.tournament.endDate)}{" "}
          &middot; {registration.tournament.venue}, {registration.tournament.city}
        </p>

        <dl className="mt-6 grid grid-cols-2 gap-4 rounded-lg border border-border bg-background p-4 text-left text-sm">
          <div>
            <dt className="text-foreground/50">Registration ID</dt>
            <dd className="break-all font-mono text-xs font-medium">{registration.id}</dd>
          </div>
          <div>
            <dt className="text-foreground/50">Payment</dt>
            <dd className="font-medium">
              {PAYMENT_META[registration.paymentStatus] ?? registration.paymentStatus}
            </dd>
          </div>
        </dl>

        <div className="mt-6 flex flex-wrap justify-center gap-4">
          <a
            href={`/api/tournaments/${registration.tournament.slug}/ics`}
            className="rounded-md border border-charcoal px-4 py-2 text-sm font-semibold text-charcoal transition-colors hover:bg-charcoal hover:text-background"
          >
            Add to Calendar
          </a>
          <LinkButton href={`/tournaments/${registration.tournament.slug}`} variant="outline">
            View tournament
          </LinkButton>
          {certificateAvailable && (
            <a
              href={`/api/registration/${registration.id}/certificate`}
              className="rounded-md bg-gold px-4 py-2 text-sm font-semibold text-charcoal transition-colors hover:bg-gold/90"
            >
              Download Certificate
            </a>
          )}
          {registration.tournament.resultsPublished && (
            <LinkButton
              href={`/tournaments/${registration.tournament.slug}/results`}
              variant="outline"
            >
              View Results
            </LinkButton>
          )}
        </div>

        {registration.status === "pending" && (
          <p className="mt-6 text-xs text-foreground/50">
            Organizers review new registrations before confirming them — check back here for
            updates.
          </p>
        )}
      </div>

      <p className="mt-6 text-center text-sm text-foreground/50">
        Questions about your registration?{" "}
        <Link href="/contact" className="font-semibold text-gold-ink hover:underline">
          Contact us
        </Link>
        .
      </p>
    </main>
  );
}
