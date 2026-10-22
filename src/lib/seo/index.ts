import type { Metadata } from "next";

export const SITE_NAME = "Nagarathar's Chess Championship";
/** Must match the root layout's title.template. */
export const TITLE_SUFFIX = ` | ${SITE_NAME}`;
/** Link-preview card for every page without its own (tournament pages generate theirs). */
export const DEFAULT_OG_IMAGE = "/brand/og-default.png";
const MAX_TITLE = 60;

/**
 * A page title that reads well in search results: "<title> | <site>" through
 * the root template when that fits in 60 characters, otherwise just the
 * title on its own (also used when the title already names the site, so it
 * never reads "Nagarathar's Chess Championship | Nagarathar's Chess Championship").
 */
export function seoTitle(title: string): Metadata["title"] {
  if (title.includes(SITE_NAME) || title.length + TITLE_SUFFIX.length > MAX_TITLE) return { absolute: title };
  return title;
}

/** The full title text as it will appear in the browser / search result. */
export function fullTitle(title: Metadata["title"]): string {
  if (typeof title === "string") return title + TITLE_SUFFIX;
  if (title && typeof title === "object" && "absolute" in title) return title.absolute ?? "";
  return SITE_NAME;
}

/**
 * Fits generated copy (e.g. a tournament description) to 140–160 characters:
 * appends the optional extra sentence(s) while there is room under 160, and
 * trims an over-long text at a word boundary with an ellipsis.
 */
export function fitDescription(text: string, extras: string[] = [], min = 140, max = 160): string {
  let out = text.replace(/\s+/g, " ").trim();
  for (const extra of extras) {
    if (out.length >= min) break;
    if (`${out} ${extra}`.length <= max) out = `${out} ${extra}`;
  }
  if (out.length > max) {
    const cut = out.slice(0, max - 1);
    out = `${cut.slice(0, cut.lastIndexOf(" ")).replace(/[,.;:–—-]+$/, "")}…`;
  }
  return out;
}

/**
 * Standard per-page metadata: title, description, canonical URL (always the
 * clean path — never ?notice=1 or other query strings), Open Graph and
 * Twitter cards. URLs are relative here and made absolute by the root
 * layout's metadataBase. `image` defaults to the site-wide OG image.
 */
export function pageMetadata({
  title,
  description,
  path,
  image = DEFAULT_OG_IMAGE,
  type = "website",
  noindex = false,
}: {
  title: string;
  description: string;
  path: string;
  image?: string;
  type?: "website" | "article";
  noindex?: boolean;
}): Metadata {
  const t = seoTitle(title);
  const shareTitle = fullTitle(t);
  return {
    title: t,
    description,
    alternates: { canonical: path },
    openGraph: {
      type,
      siteName: SITE_NAME,
      locale: "en_IN",
      url: path,
      title: shareTitle,
      description,
      images: [{ url: image, width: 1200, height: 630, alt: shareTitle }],
    },
    twitter: {
      card: "summary_large_image",
      title: shareTitle,
      description,
      images: [image],
    },
    ...(noindex ? { robots: { index: false, follow: true } } : {}),
  };
}
