import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { isRazorpayConfigured } from "@/lib/razorpay";
import { Badge, buttonClasses } from "@/components/ui";
import { formatDate, formatDateRange } from "@/lib/format";
import { capitalizeWords } from "@/lib/text";
import {
  canRegisterFor,
  getTournamentStatus,
  TOURNAMENT_STATUS_LABEL,
  TOURNAMENT_FORMAT_LABEL,
} from "@/lib/tournament-status";
import { registrationAckCookie } from "@/lib/registration-flow";
import { parseRules } from "@/lib/rules";
import { SITE_URL } from "@/lib/site";
import { fitDescription, pageMetadata } from "@/lib/seo";
import { breadcrumbJsonLd } from "@/lib/seo/structured-data";
import { tournamentEventJsonLd } from "@/lib/seo/tournament-event";
import { isTestContent } from "@/lib/next-tournament";
import { JsonLd } from "@/components/json-ld";
import { isValidImageUrl } from "@/lib/image-url";
import { RulesAccordion } from "@/components/rules-accordion";
import { VenueMap } from "@/components/venue-map";
import { CalendarIcon, WhatsAppIcon } from "@/components/icons/misc";
import { RegistrationWizard } from "@/components/registration-wizard/registration-wizard-lazy";
import { RegistrationGate } from "@/components/registration-wizard/registration-gate";
import { RegistrationNotice } from "@/components/registration-wizard/registration-notice";
import { TournamentPlaceholder } from "@/components/illustrations/tournament-placeholder";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const tournament = await prisma.tournament.findUnique({ where: { slug } });
  if (!tournament || tournament.status === "draft") return {};

  const city = capitalizeWords(tournament.city);
  const venue = capitalizeWords(tournament.venue);
  const fee = tournament.entryFee === 0 ? "Free entry" : `Entry fee ₹${tournament.entryFee}`;
  const registration = canRegisterFor(tournament)
    ? `register by ${formatDate(tournament.registrationDeadline)}`
    : "registration has closed";
  const path = `/tournaments/${tournament.slug}`;

  return pageMetadata({
    title: `${tournament.title} – ${formatDate(tournament.startDate)}, ${city}`,
    description: fitDescription(
      `${tournament.title}: ${formatDateRange(tournament.startDate, tournament.endDate)} at ${venue}, ${city}. ${fee}; ${registration}.`,
      ["Open to non-rated players of every age.", "No FIDE rating needed."]
    ),
    // Canonical is always the clean URL — the registration pop-up lives at ?notice=1.
    path,
    image: `${path}/opengraph-image`,
    noindex: isTestContent(tournament.title),
  });
}

export default async function TournamentDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { slug } = await params;
  const { notice } = await searchParams;
  const tournament = await prisma.tournament.findUnique({
    where: { slug },
    include: { _count: { select: { registrations: true } } },
  });

  if (!tournament || tournament.status === "draft") {
    notFound();
  }

  const status = getTournamentStatus(tournament);
  const canRegister = canRegisterFor(tournament);
  // Registering starts with the notice pop-up: anyone who hasn't accepted it yet
  // sees it as a modal over the (inert) page, and Register buttons open it with
  // ?notice. Accepting sets this cookie and closes it. It's rendered in place
  // rather than via a redirect so the page keeps one URL — crawlers get the full
  // event details, and visitors get no second page load or layout shift.
  const acknowledged = (await cookies()).get(registrationAckCookie(tournament.slug))?.value === "1";
  const showNotice = canRegister && (notice !== undefined || !acknowledged);
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
      <JsonLd data={tournamentEventJsonLd(tournament, seatsUsed, now)} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Tournaments", path: "/tournaments" },
          { name: tournament.title, path: `/tournaments/${tournament.slug}` },
        ])}
      />
      {showNotice && (
        <RegistrationGate
          slug={tournament.slug}
          notice={<RegistrationNotice tournament={tournament} />}
        />
      )}
      <div inert={showNotice}>
          <section className="relative overflow-hidden bg-charcoal text-white">
            {isValidImageUrl(tournament.posterImageUrl) ? (
              <div className="relative h-64 w-full sm:h-80">
                <Image
                  src={tournament.posterImageUrl}
                  alt={tournament.title}
                  fill
                  sizes="100vw"
                  priority
                  className="object-cover opacity-40"
                />
                <div className="absolute inset-0 bg-charcoal/60" />
              </div>
            ) : (
              <div className="h-56 w-full sm:h-64">
                <TournamentPlaceholder />
              </div>
            )}
            <div className="mx-auto max-w-4xl px-4 pb-8 pt-6 sm:absolute sm:inset-x-0 sm:bottom-0">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="gold">
                  {TOURNAMENT_FORMAT_LABEL[tournament.format] ?? tournament.format}
                </Badge>
                <Badge tone="charcoal">{tournament.category}</Badge>
                <Badge tone="white">{TOURNAMENT_STATUS_LABEL[status]}</Badge>
              </div>
              <h1 className="h1 mt-3 max-w-2xl">{tournament.title}</h1>
              <p className="mt-2 text-white/70">
                {formatDateRange(tournament.startDate, tournament.endDate)} &middot;{" "}
                {capitalizeWords(tournament.venue)}, {capitalizeWords(tournament.city)}
              </p>
              {tournament.resultsPublished && (
                <Link
                  href={`/tournaments/${tournament.slug}/results`}
                  className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-gold hover:underline"
                >
                  View results &amp; standings &rarr;
                </Link>
              )}
            </div>
          </section>

          <div className="mx-auto max-w-4xl px-4 py-10">
            <dl className="grid grid-cols-2 gap-4 rounded-lg border border-border bg-card p-4 text-sm sm:grid-cols-4">
              <div>
                <dt className="text-foreground/50">Dates</dt>
                <dd className="font-medium">
                  {formatDateRange(tournament.startDate, tournament.endDate)}
                </dd>
              </div>
              <div>
                <dt className="text-foreground/50">Venue</dt>
                <dd className="font-medium">
                  {capitalizeWords(tournament.venue)}, {capitalizeWords(tournament.city)}
                </dd>
              </div>
              <div>
                <dt className="text-foreground/50">Entry fee</dt>
                <dd className="font-medium">
                  {tournament.entryFee === 0 ? "Free" : `₹${tournament.entryFee}`}
                </dd>
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
            </dl>

            {tournament.maxParticipants && seatsPct !== null && (
              <div className="mt-4 rounded-lg border border-border bg-card p-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-foreground">Seats filled</span>
                  <span className="text-muted">
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
                className={buttonClasses("outline", "md", "gap-2")}
              >
                <CalendarIcon className="h-4 w-4" />
                Add to Calendar
              </a>
              <a
                href={`https://wa.me/?text=${whatsappText}`}
                target="_blank"
                rel="noreferrer"
                className={buttonClasses("outline", "md", "gap-2")}
              >
                <WhatsAppIcon className="h-4 w-4" />
                Share on WhatsApp
              </a>
              {tournament.brochurePdfUrl && (
                <a
                  href={tournament.brochurePdfUrl}
                  target="_blank"
                  rel="noreferrer"
                  className={buttonClasses("outline")}
                >
                  Download brochure
                </a>
              )}
            </div>

            <div className="mt-10 whitespace-pre-line text-foreground/80">
              {tournament.description}
            </div>

            <section className="mt-10">
              <h2 className="h3 text-charcoal">Schedule</h2>
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
                      <p
                        className={`text-sm font-semibold ${passed ? "text-foreground/50" : "text-foreground"}`}
                      >
                        {step.label}
                      </p>
                      <p className="text-small text-muted">{formatDate(step.date)}</p>
                    </li>
                  );
                })}
              </ol>
            </section>

            {tournament.prizeStructure && (
              <section className="mt-10">
                <h2 className="h3 text-charcoal">Prizes</h2>
                <div className="mt-4 whitespace-pre-line rounded-lg border border-border bg-card p-4 text-sm text-foreground/80">
                  {tournament.prizeStructure}
                </div>
              </section>
            )}

            {rules.length > 0 && (
              <section className="mt-10">
                <h2 className="h3 text-charcoal">Rules</h2>
                <div className="mt-4">
                  <RulesAccordion sections={rules} />
                </div>
              </section>
            )}

            <section className="mt-10">
              <h2 className="h3 text-charcoal">Venue</h2>
              <div className="mt-4">
                <VenueMap venue={tournament.venue} city={tournament.city} />
              </div>
            </section>

            <section
              id="register"
              className="mt-10 scroll-mt-28 rounded-lg border border-border bg-card p-6"
            >
              <h2 className="h3 text-charcoal">Register</h2>
              {!canRegister ? (
                <div className="mt-3 rounded-lg border border-dashed border-border bg-background p-6 text-center">
                  <p className="font-semibold text-charcoal">
                    {status === "completed"
                      ? "This tournament has concluded"
                      : "Registration is closed"}
                  </p>
                  <p className="mt-1 text-small text-muted">
                    {status === "completed"
                      ? "Check our other tournaments to find your next event."
                      : `Registration closed on ${formatDate(tournament.registrationDeadline)}.`}
                  </p>
                </div>
              ) : (
                <div className="mt-4">
                  {/* The form can't be used until the notice is accepted, so don't load
                      its code (react-hook-form, zod, six steps) behind the notice — same
                      placeholder as the lazy loader, so accepting doesn't shift the page. */}
                  {showNotice ? (
                    <div className="h-64 rounded-lg bg-charcoal/5" aria-hidden="true" />
                  ) : (
                    <RegistrationWizard
                      tournamentSlug={tournament.slug}
                      tournamentTitle={tournament.title}
                      tournamentStartDate={tournament.startDate}
                      entryFee={isRazorpayConfigured() ? tournament.entryFee : 0}
                    />
                  )}
                </div>
              )}
            </section>
          </div>
      </div>
    </main>
  );
}
