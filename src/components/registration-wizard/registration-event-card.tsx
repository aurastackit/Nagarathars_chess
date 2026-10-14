import Image from "next/image";
import { buttonClasses } from "@/components/ui";
import { CalendarIcon, MapPinIcon } from "@/components/icons/misc";
import { formatDateRange, formatWeekdayDate } from "@/lib/format";
import { buildGoogleCalendarUrl } from "@/lib/ics";
import { qrDataUrl } from "@/lib/qr";
import { capitalizeWords } from "@/lib/text";

const LINK_BUTTON = buttonClasses("outline", "sm");

/**
 * Event details shown in the briefing before the registration form: date,
 * venue, map/calendar links and a QR code for each. Server component, so the
 * QR codes are drawn here and ship as plain images.
 */
export async function RegistrationEventCard({
  tournament,
}: {
  tournament: {
    slug: string;
    title: string;
    venue: string;
    city: string;
    startDate: Date;
    endDate: Date;
  };
}) {
  const place = `${capitalizeWords(tournament.venue)}, ${capitalizeWords(tournament.city)}`;
  const singleDay = tournament.startDate.toDateString() === tournament.endDate.toDateString();
  const when = singleDay
    ? formatWeekdayDate(tournament.startDate)
    : formatDateRange(tournament.startDate, tournament.endDate);

  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${tournament.venue}, ${tournament.city}`
  )}`;
  const calendarUrl = buildGoogleCalendarUrl(tournament);
  const [mapsQr, calendarQr] = await Promise.all([qrDataUrl(mapsUrl), qrDataUrl(calendarUrl)]);

  return (
    <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
      <div className="min-w-0">
        <h3 className="text-base font-semibold text-charcoal">{tournament.title}</h3>
        <dl className="mt-3 space-y-2 text-sm text-foreground/80">
          <div className="flex items-start gap-2">
            <CalendarIcon className="mt-0.5 h-4 w-4 flex-none text-gold-ink" aria-hidden="true" />
            <div>
              <dt className="sr-only">Date</dt>
              <dd>{when}</dd>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <MapPinIcon className="mt-0.5 h-4 w-4 flex-none text-gold-ink" aria-hidden="true" />
            <div>
              <dt className="sr-only">Venue</dt>
              <dd>{place}</dd>
            </div>
          </div>
        </dl>
        <div className="mt-4 flex flex-wrap gap-2">
          <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className={LINK_BUTTON}>
            Open in Google Maps
          </a>
          <a href={calendarUrl} target="_blank" rel="noopener noreferrer" className={LINK_BUTTON}>
            Add to Google Calendar
          </a>
          <a href={`/api/tournaments/${tournament.slug}/ics`} className={LINK_BUTTON}>
            Download .ics
          </a>
        </div>
      </div>

      {/* A phone can't scan its own screen, and the buttons do the same job there. */}
      <div className="hidden flex-none gap-4 md:flex">
        <figure className="text-center">
          <Image
            src={mapsQr}
            alt="QR code that opens the venue location in Google Maps"
            width={128}
            height={128}
            unoptimized
            className="rounded border border-border bg-white"
          />
          <figcaption className="mt-1 text-xs text-muted">Visit the location</figcaption>
        </figure>
        <figure className="text-center">
          <Image
            src={calendarQr}
            alt="QR code that adds the tournament date to Google Calendar"
            width={128}
            height={128}
            unoptimized
            className="rounded border border-border bg-white"
          />
          <figcaption className="mt-1 text-xs text-muted">Scan to save the date</figcaption>
        </figure>
      </div>
    </div>
  );
}
