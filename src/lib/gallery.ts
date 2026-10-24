import { prisma } from "@/lib/prisma";
import { isValidImageUrl } from "@/lib/image-url";
import type { GallerySectionValue } from "@/lib/gallery-sections";
import { youtubeWatchUrl } from "@/lib/video";

export type GalleryListItem = Awaited<ReturnType<typeof getGallery>>["items"][number];

export async function getGallery({
  section,
  take = 24,
  skip = 0,
}: {
  section?: GallerySectionValue;
  take?: number;
  skip?: number;
}) {
  const items = await prisma.galleryItem.findMany({
    where: {
      isPublished: true,
      ...(section ? { section } : {}),
    },
    orderBy: [{ sortOrder: "asc" }, { takenAt: "desc" }, { createdAt: "desc" }],
    take,
    skip,
  });

  // Video rows aren't filtered through isValidImageUrl: an S3 video's `url` is a bare
  // object key (not a URL at all — see src/lib/video.ts), and YouTube/Drive links are
  // already validated at insert time by detectVideoProvider.
  return {
    items: items.filter((item) => item.mediaType === "VIDEO" || isValidImageUrl(item.url)),
  };
}

/**
 * The first published YouTube highlight, as a plain youtube.com link — YouTube
 * videos open on YouTube, never in an in-page player. Null if there's none.
 */
export async function getHighlightVideoLink() {
  const row = await prisma.galleryItem.findFirst({
    where: {
      isPublished: true,
      section: "HIGHLIGHTS",
      mediaType: "VIDEO",
      videoProvider: "YOUTUBE",
    },
    orderBy: [{ sortOrder: "asc" }, { takenAt: "desc" }, { createdAt: "desc" }],
    select: { url: true, caption: true },
  });
  const href = row ? youtubeWatchUrl(row.url) : null;
  return href ? { href, caption: row?.caption ?? null } : null;
}
