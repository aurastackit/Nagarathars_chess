import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatDateRange } from "@/lib/format";
import { Badge, LinkButton, buttonClasses } from "@/components/ui";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Registration status",
  description: "Check the status of your tournament registration.",
  robots: { index: false, follow: false },
};

const STATUS_META: Record<string, { label: string; tone: "warning" | "success" | "danger" }> = {
  pending: { label: "Pending review", tone: "warning" },
  confirmed: { label: "Confirmed", tone: "success" },
  rejected: { label: "Rejected", tone: "danger" },
  // Legacy rows created before the review workflow existed.
  registered: { label: "Confirmed", tone: "success" },
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
        <Badge tone={statusMeta.tone} size="lg">
          {statusMeta.label}
        </Badge>
        <h1 className="h2 mt-4 text-charcoal">{registration.fullName}</h1>
        <p className="text-body mt-1 text-muted">{registration.tournament.title}</p>
        <p className="text-small mt-1 text-foreground/50">
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
            className={buttonClasses("outline")}
          >
            Add to Calendar
          </a>
          <LinkButton href={`/tournaments/${registration.tournament.slug}`} variant="outline">
            View tournament
          </LinkButton>
          {certificateAvailable && (
            <a
              href={`/api/registration/${registration.id}/certificate`}
              className={buttonClasses("primary")}
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
