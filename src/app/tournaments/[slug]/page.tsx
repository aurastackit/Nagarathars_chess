import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui";
import { formatDate, formatDateRange } from "@/lib/format";
import { capitalizeWords } from "@/lib/text";
import { getTournamentStatus, TOURNAMENT_STATUS_LABEL } from "@/lib/tournament-status";
import { parseRules } from "@/lib/rules";
import { SITE_URL } from "@/lib/site";
import { RegistrationWizard } from "@/components/registration-wizard/registration-wizard";
import { RulesAccordion } from "@/components/rules-accordion";
import { VenueMap } from "@/components/venue-map";
import { CalendarIcon, WhatsAppIcon } from "@/components/icons/misc";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const tournament = await prisma.tournament.findUnique({ where: { slug } });
  if (!tournament || tournament.status === "draft") return {};

  const description = `${formatDateRange(tournament.startDate, tournament.endDate)} at ${tournament.venue}, ${tournament.city}. ${tournament.description}`.slice(0, 160);

  return {
    title: `${tournament.title} | Nagarathar's Chess Championship`,
    description,
    openGraph: {
      title: tournament.title,
      description,
      type: "website",
      url: `${SITE_URL}/tournaments/${tournament.slug}`,
    },
  };
}

export default async function TournamentDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tournament = await prisma.tournament.findUnique({
    where: { slug },
    include: { _count: { select: { registrations: true } } },
  });

  if (!tournament || tournament.status === "draft") {
    notFound();
  }

  const status = getTournamentStatus(tournament);
  const canRegister = tournament.status === "published" && status !== "closed" && status !== "completed";
  const rules = parseRules(tournament.rulesText);
  const seatsUsed = tournament._count.registrations;
  const seatsPct = tournament.maxParticipants
    ? Math.min(100, Math.round((seatsUsed / tournament.maxParticipants) * 100))
    : null;

  const timeline = [
    { label: "Registration closes", date: tournament.registrationDeadline },
    { label: "Tournament begins", date: tournament.startDate },
    { label: "Tournament ends", date: tournament.endDate },
  ].filter((step, i, arr) => i === 0 || step.date.getTime() !== arr[i - 1].date.getTime());

  const now = new Date();
  const detailUrl = `${SITE_URL}/tournaments/${tournament.slug}`;
  const whatsappText = encodeURIComponent(
    `${tournament.title} — ${formatDateRange(tournament.startDate, tournament.endDate)} at ${tournament.venue}, ${tournament.city}. ${detailUrl}`
  );

  return (
    <main>
      <section className="relative overflow-hidden bg-charcoal text-white">
        {tournament.posterImageUrl ? (
          <div className="relative h-64 w-full sm:h-80">
            <Image src={tournament.posterImageUrl} alt={tournament.title} fill className="object-cover opacity-40" />
            <div className="absolute inset-0 bg-charcoal/60" />
          </div>
        ) : (
          <div className="chess-pattern h-56 w-full sm:h-64" />
        )}
        <div className="mx-auto max-w-4xl px-4 pb-8 pt-6 sm:absolute sm:inset-x-0 sm:bottom-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="gold">{tournament.format}</Badge>
            <Badge tone="charcoal">{tournament.category}</Badge>
            <span className="inline-block rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-medium text-white">
              {TOURNAMENT_STATUS_LABEL[status]}
            </span>
          </div>
          <h1 className="mt-3 max-w-2xl text-3xl font-bold sm:text-4xl">{tournament.title}</h1>
          <p className="mt-2 text-white/70">
            {formatDateRange(tournament.startDate, tournament.endDate)} &middot; {capitalizeWords(tournament.venue)}, {capitalizeWords(tournament.city)}
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-4xl px-4 py-10">
        <dl className="grid grid-cols-2 gap-4 rounded-lg border border-border bg-card p-4 text-sm sm:grid-cols-4">
          <div>
            <dt className="text-foreground/50">Dates</dt>
            <dd className="font-medium">{formatDateRange(tournament.startDate, tournament.endDate)}</dd>
          </div>
          <div>
            <dt className="text-foreground/50">Venue</dt>
            <dd className="font-medium">
              {capitalizeWords(tournament.venue)}, {capitalizeWords(tournament.city)}
            </dd>
          </div>
          <div>
            <dt className="text-foreground/50">Entry fee</dt>
            <dd className="font-medium">{tournament.entryFee === 0 ? "Free" : `₹${tournament.entryFee}`}</dd>
          </div>
          <div>
            <dt className="text-foreground/50">Registration closes</dt>
            <dd className="font-medium">{formatDate(tournament.registrationDeadline)}</dd>
          </div>
          {tournament.timeControl && (
            <div>
              <dt className="text-foreground/50">Time control</dt>
              <dd className="font-medium">{tournament.timeControl}</dd>
            </div>
          )}
          {tournament.rounds && (
            <div>
              <dt className="text-foreground/50">Rounds</dt>
              <dd className="font-medium">{tournament.rounds}</dd>
            </div>
          )}
          <div>
            <dt className="text-foreground/50">Format</dt>
            <dd className="font-medium capitalize">{tournament.format}</dd>
          </div>
          <div>
            <dt className="text-foreground/50">Category</dt>
            <dd className="font-medium">{tournament.category}</dd>
          </div>
        </dl>

        {tournament.maxParticipants && seatsPct !== null && (
          <div className="mt-4 rounded-lg border border-border bg-card p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-foreground">Seats filled</span>
              <span className="text-foreground/60">
                {seatsUsed} / {tournament.maxParticipants}
              </span>
            </div>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-charcoal/10">
              <div
                className={`h-full rounded-full ${seatsPct >= 90 ? "bg-gold" : "bg-charcoal/40"}`}
                style={{ width: `${seatsPct}%` }}
              />
            </div>
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-3">
          <a
            href={`/api/tournaments/${tournament.slug}/ics`}
            className="inline-flex items-center gap-2 rounded-md border border-charcoal px-4 py-2 text-sm font-semibold text-charcoal transition-colors hover:bg-charcoal hover:text-background"
          >
            <CalendarIcon className="h-4 w-4" />
            Add to Calendar
          </a>
          <a
            href={`https://wa.me/?text=${whatsappText}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-md border border-charcoal px-4 py-2 text-sm font-semibold text-charcoal transition-colors hover:bg-charcoal hover:text-background"
          >
            <WhatsAppIcon className="h-4 w-4" />
            Share on WhatsApp
          </a>
          {tournament.brochurePdfUrl && (
            <a
              href={tournament.brochurePdfUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center rounded-md border border-charcoal px-4 py-2 text-sm font-semibold text-charcoal transition-colors hover:bg-charcoal hover:text-background"
            >
              Download brochure
            </a>
          )}
        </div>

        <div className="mt-10 whitespace-pre-line text-foreground/80">{tournament.description}</div>

        <section className="mt-10">
          <h2 className="text-xl font-semibold text-charcoal">Schedule</h2>
          <ol className="mt-4 space-y-4 border-l border-border pl-4">
            {timeline.map((step) => {
              const passed = step.date < now;
              return (
                <li key={step.label} className="relative">
                  <span
                    className={`absolute -left-[21px] mt-1.5 h-2.5 w-2.5 rounded-full ${
                      passed ? "bg-charcoal/30" : "bg-gold"
                    }`}
                  />
                  <p className={`text-sm font-semibold ${passed ? "text-foreground/50" : "text-foreground"}`}>
                    {step.label}
                  </p>
                  <p className="text-sm text-foreground/60">{formatDate(step.date)}</p>
                </li>
              );
            })}
          </ol>
        </section>

        {tournament.prizeStructure && (
          <section className="mt-10">
            <h2 className="text-xl font-semibold text-charcoal">Prizes</h2>
            <div className="mt-4 whitespace-pre-line rounded-lg border border-border bg-card p-4 text-sm text-foreground/80">
              {tournament.prizeStructure}
            </div>
          </section>
        )}

        {rules.length > 0 && (
          <section className="mt-10">
            <h2 className="text-xl font-semibold text-charcoal">Rules</h2>
            <div className="mt-4">
              <RulesAccordion sections={rules} />
            </div>
          </section>
        )}

        <section className="mt-10">
          <h2 className="text-xl font-semibold text-charcoal">Venue</h2>
          <div className="mt-4">
            <VenueMap venue={tournament.venue} city={tournament.city} />
          </div>
        </section>

        <section className="mt-10 rounded-lg border border-border bg-card p-6">
          <h2 className="text-xl font-semibold text-charcoal">Register</h2>
          {!canRegister ? (
            <div className="mt-3 rounded-lg border border-dashed border-border bg-background p-6 text-center">
              <p className="font-semibold text-charcoal">
                {status === "completed" ? "This tournament has concluded" : "Registration is closed"}
              </p>
              <p className="mt-1 text-sm text-foreground/60">
                {status === "completed"
                  ? "Check our other tournaments to find your next event."
                  : `Registration closed on ${formatDate(tournament.registrationDeadline)}.`}
              </p>
            </div>
          ) : (
            <div className="mt-4">
              <RegistrationWizard
                tournamentSlug={tournament.slug}
                tournamentTitle={tournament.title}
                tournamentStartDate={tournament.startDate}
                entryFee={tournament.entryFee}
              />
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
