import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { SiteFooter } from "@/components/site-footer";
import { SITE_URL } from "@/lib/site";
import "./globals.css";

export const dynamic = "force-dynamic";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const playfairDisplay = Playfair_Display({
  variable: "--font-display",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Nagarathar's Chess Championship",
    template: "%s | Nagarathar's Chess Championship",
  },
  description:
    "Chess tournaments and online coaching for local, non-rated players — register for upcoming tournaments and classes.",
  openGraph: {
    siteName: "Nagarathar's Chess Championship",
    type: "website",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} ${playfairDisplay.variable} h-full antialiased`}>
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
      </body>
    </html>
  );
}
