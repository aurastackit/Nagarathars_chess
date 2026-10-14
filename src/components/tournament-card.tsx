import Image from "next/image";
import Link from "next/link";
import { Badge, Card } from "@/components/ui";
import { formatDateRange } from "@/lib/format";
import { capitalizeWords } from "@/lib/text";
import { registerPath } from "@/lib/registration-flow";
import {
  canRegisterFor,
  getTournamentStatus,
  TOURNAMENT_FORMAT_LABEL,
} from "@/lib/tournament-status";
import { isValidImageUrl } from "@/lib/image-url";
import { TournamentPlaceholder } from "@/components/illustrations/tournament-placeholder";

export type TournamentCardData = {
  id: string;
  slug: string;
  title: string;
  status: string;
  format: string;
  startDate: Date;
  endDate: Date;
  venue: string;
  city: string;
  entryFee: number;
  maxParticipants: number | null;
  registrationDeadline: Date;
  posterImageUrl: string | null;
  _count: { registrations: number };
};

export function TournamentCard({ tournament: t }: { tournament: TournamentCardData }) {
  const status = getTournamentStatus(t);
  const open = canRegisterFor(t);
  const seatsUsed = t._count.registrations;
  const seatsPct = t.maxParticipants
    ? Math.min(100, Math.round((seatsUsed / t.maxParticipants) * 100))
    : null;

  return (
    // Open tournaments go straight to the registration pop-up; closed or finished
    // ones just open their page.
    <Link href={open ? registerPath(t.slug) : `/tournaments/${t.slug}`}>
      <Card className="group flex h-full flex-col overflow-hidden transition-shadow hover:shadow-md">
        {isValidImageUrl(t.posterImageUrl) ? (
          <div className="relative aspect-video w-full bg-background">
            <Image
              src={t.posterImageUrl}
              alt={t.title}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-contain"
            />
          </div>
        ) : (
          <div className="aspect-video w-full">
            <TournamentPlaceholder />
          </div>
        )}

        <div className="flex flex-1 flex-col p-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="charcoal">{TOURNAMENT_FORMAT_LABEL[t.format] ?? t.format}</Badge>
            {status === "open" && <Badge tone="success">Registration open</Badge>}
            {status === "closing-soon" && <Badge tone="gold-ink">Closing soon</Badge>}
            {status === "closed" && <Badge tone="gray">Closed</Badge>}
            {status === "completed" && <Badge tone="gray">Completed</Badge>}
          </div>

          <h3 className="h3 mt-2 text-foreground">{t.title}</h3>
          <p className="mt-1 text-sm text-muted">
            {formatDateRange(t.startDate, t.endDate)} &middot; {capitalizeWords(t.venue)},{" "}
            {capitalizeWords(t.city)}
          </p>

          {t.maxParticipants && seatsPct !== null && (
            <div className="mt-3">
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-charcoal/10">
                <div
                  className={`h-full rounded-full ${seatsPct >= 90 ? "bg-gold" : "bg-charcoal/40"}`}
                  style={{ width: `${seatsPct}%` }}
                />
              </div>
              <p className="mt-1 text-xs text-foreground/50">
                {seatsUsed} / {t.maxParticipants} seats filled
              </p>
            </div>
          )}

          <div className="mt-auto pt-3">
            {open ? (
              <span className="inline-flex items-center rounded-full bg-gold px-3 py-1.5 text-xs font-semibold text-charcoal shadow-sm transition-colors group-hover:bg-gold/90">
                {t.entryFee === 0 ? "Register — Free Entry" : `Register — ₹${t.entryFee}`}
              </span>
            ) : (
              <span className="text-sm font-semibold text-gold-ink">View details &rarr;</span>
            )}
          </div>
        </div>
      </Card>
    </Link>
  );
}
