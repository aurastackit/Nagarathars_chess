import Image from "next/image";
import Link from "next/link";
import { Badge, Card } from "@/components/ui";
import { formatDateRange } from "@/lib/format";
import { capitalizeWords } from "@/lib/text";
import { getTournamentStatus, TOURNAMENT_STATUS_LABEL } from "@/lib/tournament-status";
import { isValidImageUrl } from "@/lib/image-url";

export type TournamentCardData = {
  id: string;
  slug: string;
  title: string;
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
  const seatsUsed = t._count.registrations;
  const seatsPct = t.maxParticipants
    ? Math.min(100, Math.round((seatsUsed / t.maxParticipants) * 100))
    : null;

  return (
    <Link href={`/tournaments/${t.slug}`}>
      <Card className="group flex h-full flex-col overflow-hidden transition-shadow hover:shadow-md">
        {isValidImageUrl(t.posterImageUrl) ? (
          <div className="relative h-40 w-full bg-gray-100">
            <Image
              src={t.posterImageUrl}
              alt={t.title}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-contain"
            />
          </div>
        ) : (
          <div className="chess-pattern flex h-40 w-full items-center justify-center bg-charcoal">
            <span className="text-lg font-semibold text-white/70">{t.format}</span>
          </div>
        )}

        <div className="flex flex-1 flex-col p-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="charcoal">{t.format}</Badge>
            {status === "closing-soon" && <Badge tone="gold-ink">Closing soon</Badge>}
            {status === "closed" && <Badge tone="gray">Registration closed</Badge>}
            {status === "completed" && <Badge tone="gray">Completed</Badge>}
          </div>

          <h3 className="mt-2 font-semibold text-foreground">{t.title}</h3>
          <p className="mt-1 text-sm text-foreground/60">
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

          <div className="mt-auto flex items-center justify-between pt-3">
            <span className="inline-flex items-center rounded-full bg-gold px-3 py-1.5 text-xs font-semibold text-charcoal shadow-sm transition-colors group-hover:bg-gold/90">
              {t.entryFee === 0 ? "Register — Free Entry" : `Register — ₹${t.entryFee}`}
            </span>
            <p className="text-xs text-foreground/50">{TOURNAMENT_STATUS_LABEL[status]}</p>
          </div>
        </div>
      </Card>
    </Link>
  );
}
