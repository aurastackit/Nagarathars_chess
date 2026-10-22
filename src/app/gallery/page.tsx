import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { breadcrumbJsonLd } from "@/lib/seo/structured-data";
import { JsonLd } from "@/components/json-ld";
import { prisma } from "@/lib/prisma";
import { GalleryGrid } from "@/components/gallery-grid";
import { isValidImageUrl } from "@/lib/image-url";
import { getGallery } from "@/lib/gallery";
import { resolveVideoPlayback, type ShortsItem } from "@/lib/video";
import { EmptyState } from "@/components/ui";
import { EmptyGallery } from "@/components/illustrations/empty-states";

// Static, regenerated at most every minute or on demand after an admin
// change (lib/revalidate-public).
export const revalidate = 60;

export const metadata: Metadata = pageMetadata({
  title: "Photos & Video Highlights",
  description:
    "Photos and video highlights from Nagarathar's Chess Championship tournaments and classes in Chennai – young players, families and memorable games.",
  path: "/gallery",
});

export default async function GalleryPage() {
  const [curatedGallery, tournaments, classes] = await Promise.all([
    getGallery({ take: 200 }),
    prisma.tournament.findMany({
      where: { posterImageUrl: { not: null } },
      orderBy: { startDate: "desc" },
    }),
    prisma.classProgram.findMany({
      where: { bannerImageUrl: { not: null } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const photoRows = curatedGallery.items.filter((p) => p.mediaType !== "VIDEO");
  const videoRows = curatedGallery.items.filter(
    (p) => p.mediaType === "VIDEO" && p.videoProvider !== "NONE"
  );
  const videoItems: ShortsItem[] = await Promise.all(
    videoRows.map(async (row) => ({
      id: row.id,
      caption: row.caption,
      playback: await resolveVideoPlayback({
        url: row.url,
        videoProvider: row.videoProvider as "YOUTUBE" | "DRIVE" | "S3",
        thumbnailUrl: row.thumbnailUrl,
      }),
    }))
  );

  const realItems = [
    ...photoRows.map((p) => ({
      id: p.id,
      src: p.url,
      title: p.caption ?? "Nagarathar's Chess Championship",
      caption: "Nagarathar's Chess Championship 2026",
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
          Moments from our tournaments and classes — posters, banners, and highlights as our
          community grows.
        </p>
      </div>

      {realItems.length === 0 && videoItems.length === 0 ? (
        <EmptyState
          className="mt-12"
          icon={<EmptyGallery className="h-16 w-16" />}
          message="No photos yet — check back once our next event wraps up."
        />
      ) : (
        <GalleryGrid realItems={realItems} videoItems={videoItems} />
      )}
    </main>
  );
}
