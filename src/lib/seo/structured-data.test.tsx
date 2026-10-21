import { test } from "node:test";
import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import { JsonLd } from "@/components/json-ld";
import { FAQS } from "@/data/faqs";
import { SITE_URL } from "@/lib/site";
import {
  breadcrumbJsonLd,
  faqJsonLd,
  ORGANIZATION_ID,
  organizationJsonLd,
  websiteJsonLd,
} from "@/lib/seo/structured-data";
import { tournamentEventJsonLd } from "@/lib/seo/tournament-event";

// Renders a block exactly as the pages do and parses it back, so the test sees
// what a crawler sees: valid JSON inside one ld+json script.
function render(data: Parameters<typeof JsonLd>[0]["data"]) {
  const html = renderToStaticMarkup(<JsonLd data={data} />);
  const match = html.match(/^<script type="application\/ld\+json">([\s\S]*)<\/script>$/);
  assert.ok(match, `not a single ld+json script: ${html}`);
  return JSON.parse(match[1]);
}

function assertAbsolute(url: unknown, label: string) {
  assert.equal(typeof url, "string", `${label} missing`);
  assert.match(url as string, /^https?:\/\/[^/]+/, `${label} is not absolute: ${url}`);
}

// Shaped like a Prisma row (dates are midnight UTC of the admin-picked day).
const tournament = {
  slug: "chennai-open-2026",
  title: "Chennai Open </script><b>2026</b>",
  description: "A classical open for all ages.",
  venue: "chettinad vidyashram",
  city: "chennai",
  startDate: new Date("2026-12-27T00:00:00Z"),
  endDate: new Date("2026-12-28T00:00:00Z"),
  registrationDeadline: new Date("2026-11-17T00:00:00Z"),
  entryFee: 0,
  maxParticipants: 100,
  posterImageUrl: null,
};
const BEFORE = new Date("2026-10-21T12:00:00+05:30");
const AFTER = new Date("2027-01-05T12:00:00+05:30");

test("JsonLd escapes < so database text can't close the script tag", () => {
  const html = renderToStaticMarkup(<JsonLd data={tournamentEventJsonLd(tournament, 0, BEFORE)} />);
  assert.equal(html.match(/<\/script>/g)?.length, 1);
  assert.equal(render(tournamentEventJsonLd(tournament, 0, BEFORE)).name, tournament.title);
});

test("Organization: SportsOrganization with absolute url and logo", () => {
  const org = render(organizationJsonLd());
  assert.equal(org["@context"], "https://schema.org");
  assert.equal(org["@type"], "SportsOrganization");
  assert.equal(org["@id"], ORGANIZATION_ID);
  assert.equal(org.name, "Nagarathar's Chess Championship");
  assertAbsolute(org.url, "url");
  assertAbsolute(org.logo, "logo");
  assert.equal(org.sport, "Chess");
  assert.equal(org.areaServed, "Chennai, Tamil Nadu, India");
  assert.ok(Array.isArray(org.sameAs));
});

test("WebSite: name, url and publisher reference", () => {
  const site = render(websiteJsonLd());
  assert.equal(site["@type"], "WebSite");
  assert.equal(site.name, "Nagarathar's Chess Championship");
  assert.equal(site.url, `${SITE_URL}/`);
  assert.deepEqual(site.publisher, { "@id": ORGANIZATION_ID });
});

test("SportsEvent: upcoming tournament has every required field and an offer", () => {
  const event = render(tournamentEventJsonLd(tournament, 12, BEFORE));
  assert.equal(event["@type"], "SportsEvent");
  assert.equal(event.name, tournament.title);
  assert.equal(event.description, tournament.description);
  assert.equal(event.startDate, "2026-12-27T00:00:00+05:30");
  assert.equal(event.endDate, "2026-12-28T23:59:59+05:30");
  assert.equal(event.eventStatus, "https://schema.org/EventScheduled");
  assert.equal(event.eventAttendanceMode, "https://schema.org/OfflineEventAttendanceMode");
  assert.deepEqual(event.location, {
    "@type": "Place",
    name: "Chettinad Vidyashram",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Chennai",
      addressRegion: "Tamil Nadu",
      addressCountry: "IN",
    },
  });
  assert.equal(event.image.length, 1);
  assert.equal(event.image[0], `${SITE_URL}/tournaments/${tournament.slug}/opengraph-image`);
  assert.equal(event.organizer["@id"], ORGANIZATION_ID);
  assert.equal(event.organizer.name, "Nagarathar's Chess Championship");
  assertAbsolute(event.organizer.url, "organizer.url");

  const offer = event.offers;
  assert.equal(offer["@type"], "Offer");
  assert.equal(offer.price, 0);
  assert.equal(offer.priceCurrency, "INR");
  assert.equal(offer.availability, "https://schema.org/InStock");
  // End of the deadline day in IST — the same cutoff registration uses.
  assert.equal(offer.validThrough, "2026-11-17T23:59:59+05:30");
  assert.equal(offer.url, `${SITE_URL}/tournaments/${tournament.slug}`);
});

test("SportsEvent: fee, poster and a full field", () => {
  const event = render(
    tournamentEventJsonLd(
      { ...tournament, entryFee: 500, posterImageUrl: "/uploads/poster.jpg" },
      100,
      BEFORE
    )
  );
  assert.equal(event.offers.price, 500);
  assert.equal(event.offers.availability, "https://schema.org/SoldOut");
  assert.deepEqual(event.image, [
    `${SITE_URL}/uploads/poster.jpg`,
    `${SITE_URL}/tournaments/${tournament.slug}/opengraph-image`,
  ]);
});

test("SportsEvent: no seat limit is never sold out", () => {
  const event = render(tournamentEventJsonLd({ ...tournament, maxParticipants: null }, 500, BEFORE));
  assert.equal(event.offers.availability, "https://schema.org/InStock");
});

test("SportsEvent: completed tournament keeps its dates but drops the offer", () => {
  const event = render(tournamentEventJsonLd(tournament, 12, AFTER));
  assert.equal(event.eventStatus, "https://schema.org/EventScheduled");
  assert.equal(event.offers, undefined);
  assert.equal(event.startDate, "2026-12-27T00:00:00+05:30");
});

test("BreadcrumbList: Home first, positions from 1, absolute items", () => {
  const crumbs = render(
    breadcrumbJsonLd([
      { name: "Tournaments", path: "/tournaments" },
      { name: tournament.title, path: `/tournaments/${tournament.slug}` },
    ])
  );
  assert.equal(crumbs["@type"], "BreadcrumbList");
  assert.deepEqual(
    crumbs.itemListElement.map((c: { position: number; name: string }) => [c.position, c.name]),
    [
      [1, "Home"],
      [2, "Tournaments"],
      [3, tournament.title],
    ]
  );
  for (const c of crumbs.itemListElement) {
    assert.equal(c["@type"], "ListItem");
    assertAbsolute(c.item, `crumb ${c.name}`);
  }
  assert.equal(crumbs.itemListElement[0].item, `${SITE_URL}/`);

  for (const [name, path] of [
    ["About", "/about"],
    ["Gallery", "/gallery"],
    ["Online Classes", "/classes"],
  ]) {
    const page = render(breadcrumbJsonLd([{ name, path }]));
    assert.equal(page.itemListElement.length, 2);
    assert.equal(page.itemListElement[1].item, `${SITE_URL}${path}`);
  }
});

test("FAQPage: matches the visible home-page questions and answers exactly", () => {
  const faq = render(faqJsonLd(FAQS));
  assert.equal(faq["@type"], "FAQPage");
  assert.deepEqual(
    faq.mainEntity.map((q: { name: string; acceptedAnswer: { text: string } }) => ({
      q: q.name,
      a: q.acceptedAnswer.text,
    })),
    FAQS
  );
  for (const q of faq.mainEntity) {
    assert.equal(q["@type"], "Question");
    assert.equal(q.acceptedAnswer["@type"], "Answer");
  }
});
