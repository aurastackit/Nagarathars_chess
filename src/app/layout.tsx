import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { getNextTournament } from "@/lib/next-tournament";
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
  title: "Nagarathar's Chess Championship",
  description:
    "Chess tournaments and online coaching for local, non-rated players — register for upcoming tournaments and classes.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const nextTournament = await getNextTournament();

  return (
    <html
      lang="en"
      className={`${inter.variable} ${playfairDisplay.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <SiteHeader
          nextTournament={
            nextTournament
              ? {
                  title: nextTournament.title,
                  slug: nextTournament.slug,
                  registrationDeadline: nextTournament.registrationDeadline.toISOString(),
                }
              : null
          }
        />
        <div className="flex-1">{children}</div>
        <SiteFooter />
      </body>
    </html>
  );
}
