import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { breadcrumbJsonLd } from "@/lib/seo/structured-data";
import { JsonLd } from "@/components/json-ld";
import { prisma } from "@/lib/prisma";
import { LISTED_STATUSES } from "@/lib/tournament-status";
import { GalleryGrid } from "@/components/gallery-grid";
import { YouTubeLink } from "@/components/youtube-link";
import { isValidImageUrl } from "@/lib/image-url";
import { getGallery, getHighlightVideoLink } from "@/lib/gallery";
import { EmptyState } from "@/components/ui";
import { EmptyGallery } from "@/components/illustrations/empty-states";
import { CLASSES_ENABLED } from "@/lib/features";

// Static, regenerated at most every minute or on demand after an admin
// change (lib/revalidate-public).
export const revalidate = 60;

export const metadata: Metadata = pageMetadata({
  title: "Photos & Video Highlights",
  description: CLASSES_ENABLED
    ? "Photos and video highlights from Nagarathar's Chess Championship tournaments and classes in Chennai – young players, families and memorable games."
    : "Photos and video highlights from Nagarathar's Chess Championship tournaments in Chennai – young players, families, posters and memorable games on the board.",
  path: "/gallery",
});

export default async function GalleryPage() {
  const [curatedGallery, tournaments, classes, highlight] = await Promise.all([
    getGallery({ take: 200 }),
    prisma.tournament.findMany({
      where: { posterImageUrl: { not: null }, status: { in: LISTED_STATUSES } },
      orderBy: { startDate: "desc" },
    }),
    // No class data on public pages while classes are coming soon (lib/features).
    CLASSES_ENABLED
      ? prisma.classProgram.findMany({
          where: { bannerImageUrl: { not: null } },
          orderBy: { createdAt: "desc" },
        })
      : Promise.resolve([]),
    getHighlightVideoLink(),
  ]);

  const photoRows = curatedGallery.items.filter((p) => p.mediaType !== "VIDEO");
  // Videos aren't shown in the grid; the YouTube highlight is a link out (below the subtitle).

  const realItems = [
    ...photoRows.map((p) => ({
      id: p.id,
      src: p.url,
      // Photo cards show their caption only — no event name or year.
      title: p.caption,
      alt: p.altText ?? p.caption ?? "Photo from one of our chess tournaments",
      section: p.section,
      fit: "cover" as const,
    })),
    ...tournaments
      .filter((t) => isValidImageUrl(t.posterImageUrl))
      .map((t) => ({
        id: `tournament-${t.id}`,
        src: t.posterImageUrl!,
        title: t.title,
        caption: t.city,
        section: "TOURNAMENT_DAY" as const,
        fit: "contain" as const,
      })),
    ...classes
      .filter((c) => isValidImageUrl(c.bannerImageUrl))
      .map((c) => ({
        id: `class-${c.id}`,
        src: c.bannerImageUrl!,
        title: c.title,
        caption: "Online class",
        section: "CLASSES" as const,
        fit: "contain" as const,
      })),
  ];

  return (
    <main className="mx-auto max-w-6xl px-4 py-14">
      <JsonLd data={breadcrumbJsonLd([{ name: "Gallery", path: "/gallery" }])} />
      <div className="text-center">
        <h1 className="h1 text-charcoal">Gallery</h1>
        <p className="text-body mx-auto mt-2 max-w-xl text-muted">
          {CLASSES_ENABLED
            ? "Moments from our tournaments and classes — posters, banners, and highlights as our community grows."
            : "Moments from our tournaments — posters, banners, and highlights as our community grows."}
        </p>
        {highlight && (
          <YouTubeLink href={highlight.href} className="mt-5">
            Watch the 4 January highlights on YouTube
          </YouTubeLink>
        )}
      </div>

      {realItems.length === 0 ? (
        <EmptyState
          className="mt-12"
          icon={<EmptyGallery className="h-16 w-16" />}
          message="No photos yet — check back once our next event wraps up."
        />
      ) : (
        <GalleryGrid realItems={realItems} />
      )}
    </main>
  );
}
