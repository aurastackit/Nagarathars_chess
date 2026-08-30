import Image from "next/image";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui";
import { formatDateRange } from "@/lib/format";
import { RegistrationForm } from "@/components/registration-form";

export const dynamic = "force-dynamic";

export default async function TournamentDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tournament = await prisma.tournament.findUnique({ where: { slug } });

  if (!tournament || tournament.status === "draft") {
    notFound();
  }

  const isClosed =
    tournament.status !== "published" || new Date() > tournament.registrationDeadline;

  return (
    <main className="mx-auto max-w-4xl px-4 py-12">
      {tournament.posterImageUrl && (
        <div className="relative mb-6 h-64 w-full overflow-hidden rounded-lg bg-gray-100 sm:h-96">
          <Image src={tournament.posterImageUrl} alt={tournament.title} fill className="object-cover" />
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <Badge tone="navy">{tournament.format}</Badge>
        <Badge tone="gray">{tournament.category}</Badge>
      </div>

      <h1 className="mt-3 text-3xl font-bold text-navy">{tournament.title}</h1>

      <dl className="mt-4 grid grid-cols-2 gap-4 rounded-lg border border-border bg-card p-4 text-sm sm:grid-cols-4">
        <div>
          <dt className="text-foreground/50">Dates</dt>
          <dd className="font-medium">{formatDateRange(tournament.startDate, tournament.endDate)}</dd>
        </div>
        <div>
          <dt className="text-foreground/50">Venue</dt>
          <dd className="font-medium">{tournament.venue}, {tournament.city}</dd>
        </div>
        <div>
          <dt className="text-foreground/50">Entry fee</dt>
          <dd className="font-medium">{tournament.entryFee === 0 ? "Free" : `₹${tournament.entryFee}`}</dd>
        </div>
        <div>
          <dt className="text-foreground/50">Registration closes</dt>
          <dd className="font-medium">{formatDateRange(tournament.registrationDeadline, tournament.registrationDeadline)}</dd>
        </div>
      </dl>

      <div className="mt-6 whitespace-pre-line text-foreground/80">{tournament.description}</div>

      {tournament.brochurePdfUrl && (
        <a
          href={tournament.brochurePdfUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-4 inline-block text-sm font-semibold text-navy hover:underline"
        >
          Download brochure &rarr;
        </a>
      )}

      <section className="mt-10 rounded-lg border border-border bg-card p-6">
        <h2 className="text-xl font-semibold text-navy">Register</h2>
        {isClosed ? (
          <p className="mt-3 text-sm text-foreground/60">
            Registration for this tournament is closed.
          </p>
        ) : (
          <div className="mt-4">
            <RegistrationForm tournamentSlug={tournament.slug} />
          </div>
        )}
      </section>
    </main>
  );
}
