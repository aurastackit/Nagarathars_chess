/** The live site. Used whenever NEXT_PUBLIC_SITE_URL is missing in a production build. */
export const PRODUCTION_URL = "https://nagaratharschesschampionship.org";

function resolveSiteUrl() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/+$/, "");
  const isLocal = !configured || /\/\/(localhost|127\.0\.0\.1)(:|$)/.test(configured);
  // A production build must never hand out localhost links (sitemap, canonical
  // URLs, OG images, e-mails) — that happened when the env var didn't reach the
  // Amplify runtime. Local dev keeps localhost so links work on this machine.
  if (process.env.NODE_ENV === "production" && isLocal) return PRODUCTION_URL;
  return configured || "http://localhost:3000";
}

/** Canonical site origin, without a trailing slash. */
export const SITE_URL = resolveSiteUrl();

/** Absolute URL on the canonical origin for a path like "/about". */
export const absoluteUrl = (path = "/") => `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
