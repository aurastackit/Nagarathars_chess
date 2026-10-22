import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { SiteFooter } from "@/components/site-footer";
import { SITE_URL, absoluteUrl } from "@/lib/site";
import { DEFAULT_OG_IMAGE, SITE_NAME } from "@/lib/seo";
import { organizationJsonLd, websiteJsonLd } from "@/lib/seo/structured-data";
import { JsonLd } from "@/components/json-ld";
import "./globals.css";

// Default for every page: static, regenerated at most every minute (the
// header and announcement bar read the next tournament). Admin, registration
// status, player and results pages opt out with force-dynamic; API routes are
// dynamic anyway.
export const revalidate = 60;

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const playfairDisplay = Playfair_Display({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
});

// Site-wide defaults; each public page overrides title/description/canonical
// through pageMetadata() in lib/seo. The template must match TITLE_SUFFIX there.
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: SITE_NAME,
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  description:
    "Free chess tournaments in Chennai for kids and adults – no FIDE rating needed. Register online for Nagarathar's Chess Championship and join online classes.",
  openGraph: {
    siteName: SITE_NAME,
    type: "website",
    locale: "en_IN",
    images: [{ url: absoluteUrl(DEFAULT_OG_IMAGE), width: 1200, height: 630, alt: SITE_NAME }],
  },
  twitter: { card: "summary_large_image", images: [absoluteUrl(DEFAULT_OG_IMAGE)] },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en-IN"
      className={`${inter.variable} ${playfairDisplay.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {/* First tab stop on every page; hidden above the viewport until focused.
            Targets the page wrapper in template.tsx. */}
        <a
          href="#main-content"
          className="fixed left-4 top-4 z-[80] -translate-y-[200%] rounded-md bg-charcoal px-4 py-2 text-sm font-semibold text-white focus:translate-y-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold"
        >
          Skip to content
        </a>
        {/* children here is actually template.tsx's output (SiteHeader + page) —
            moved there because, unlike this layout, templates re-run on every
            navigation. See the comment on getNextTournament() for why. */}
        {children}
        <SiteFooter />
        <JsonLd data={organizationJsonLd()} />
        <JsonLd data={websiteJsonLd()} />
      </body>
    </html>
  );
}
