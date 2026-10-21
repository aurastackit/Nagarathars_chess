import type { OfferLeaf, SportsEventLeaf, WithContext } from "schema-dts";
import { absoluteUrl } from "@/lib/site";
import { isValidImageUrl } from "@/lib/image-url";
import { capitalizeWords } from "@/lib/text";
import { getTournamentStatus } from "@/lib/tournament-status";
import { ORGANIZATION_REF } from "@/lib/seo/structured-data";

type TournamentForEvent = {
  slug: string;
  title: string;
  description: string;
  venue: string;
  city: string;
  startDate: Date;
  endDate: Date;
  registrationDeadline: Date;
  entryFee: number;
  maxParticipants: number | null;
  posterImageUrl: string | null;
};

/**
 * Tournament dates are stored as midnight UTC of the calendar date picked in
 * admin (an `<input type="date">` value), so the date part is the real day.
 * Re-attach it to an IST wall-clock time rather than converting the instant,
 * which would read as 05:30 IST.
 */
function istDateTime(date: Date, time: string) {
  return `${date.toISOString().slice(0, 10)}T${time}+05:30`;
}

/**
 * schema.org SportsEvent for a tournament page. Finished tournaments keep
 * EventScheduled — schema.org has no "completed" status, and Google reads a
 * past endDate as finished — but drop their offer, since entry no longer exists.
 */
export function tournamentEventJsonLd(
  tournament: TournamentForEvent,
  seatsUsed: number,
  now: Date = new Date()
): WithContext<SportsEventLeaf> {
  const url = absoluteUrl(`/tournaments/${tournament.slug}`);
  const completed = getTournamentStatus(tournament, now) === "completed";
  const soldOut = tournament.maxParticipants !== null && seatsUsed >= tournament.maxParticipants;
  // The poster first, then the 1200×630 share card: Google prefers large images
  // and posters are often small or portrait.
  const ogImage = `${url}/opengraph-image`;
  const image = isValidImageUrl(tournament.posterImageUrl)
    ? [new URL(tournament.posterImageUrl, absoluteUrl("/")).toString(), ogImage]
    : [ogImage];

  const offers: OfferLeaf = {
    "@type": "Offer",
    url,
    price: tournament.entryFee,
    priceCurrency: "INR",
    availability: soldOut ? "https://schema.org/SoldOut" : "https://schema.org/InStock",
    validThrough: istDateTime(tournament.registrationDeadline, "23:59:59"),
  };

  return {
    "@context": "https://schema.org",
    "@type": "SportsEvent",
    name: tournament.title,
    description: tournament.description,
    url,
    sport: "Chess",
    startDate: istDateTime(tournament.startDate, "00:00:00"),
    endDate: istDateTime(tournament.endDate, "23:59:59"),
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: {
      "@type": "Place",
      name: capitalizeWords(tournament.venue),
      address: {
        "@type": "PostalAddress",
        addressLocality: capitalizeWords(tournament.city),
        addressRegion: "Tamil Nadu",
        addressCountry: "IN",
      },
    },
    image,
    organizer: ORGANIZATION_REF,
    ...(completed ? {} : { offers }),
  };
}
