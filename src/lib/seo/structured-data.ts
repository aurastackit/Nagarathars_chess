import type {
  BreadcrumbListLeaf,
  FAQPageLeaf,
  SportsOrganizationLeaf,
  WebSiteLeaf,
  WithContext,
} from "schema-dts";
import { absoluteUrl, SITE_URL } from "@/lib/site";
import { SITE_NAME } from "@/lib/seo";

/**
 * Site-wide JSON-LD. Typed with schema-dts so a misspelt property or an
 * invalid enum value (e.g. an eventStatus schema.org doesn't define) fails
 * type-checking instead of silently dropping out of Google's rich results.
 */

/** Stable node id, so pages can point at the organisation instead of repeating it. */
export const ORGANIZATION_ID = `${SITE_URL}/#organization`;
const WEBSITE_ID = `${SITE_URL}/#website`;

/**
 * Profiles that identify the organisation elsewhere (Instagram, YouTube…).
 * Keep in step with the footer — it has no social links yet, so this is empty.
 */
export const SOCIAL_PROFILES: string[] = [];

/** The organisation as an event's organizer: enough to identify it, by reference. */
export const ORGANIZATION_REF = {
  "@type": "SportsOrganization",
  "@id": ORGANIZATION_ID,
  name: SITE_NAME,
  url: absoluteUrl("/"),
} satisfies SportsOrganizationLeaf;

export function organizationJsonLd(): WithContext<SportsOrganizationLeaf> {
  return {
    "@context": "https://schema.org",
    ...ORGANIZATION_REF,
    logo: absoluteUrl("/images/logo.png"),
    sport: "Chess",
    areaServed: "Chennai, Tamil Nadu, India",
    sameAs: SOCIAL_PROFILES,
  };
}

export function websiteJsonLd(): WithContext<WebSiteLeaf> {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    name: SITE_NAME,
    url: absoluteUrl("/"),
    inLanguage: "en-IN",
    publisher: { "@id": ORGANIZATION_ID },
  };
}

/** Home › … › current page. Paths are site-relative; the last crumb is the page itself. */
export function breadcrumbJsonLd(
  trail: { name: string; path: string }[]
): WithContext<BreadcrumbListLeaf> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [{ name: "Home", path: "/" }, ...trail].map((crumb, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: crumb.name,
      item: absoluteUrl(crumb.path),
    })),
  };
}

/**
 * Pass the same array the page renders — Google requires FAQ markup to match
 * the visible questions and answers word for word.
 */
export function faqJsonLd(faqs: readonly { q: string; a: string }[]): WithContext<FAQPageLeaf> {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}
