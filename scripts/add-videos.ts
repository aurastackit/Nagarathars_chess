/**
 * One-time loader for HIGHLIGHTS video GalleryItems. Upserts by url (looked up manually —
 * GalleryItem.url has no unique constraint, so this avoids a schema change just for this)
 * so it's safe to re-run, e.g. after fixing a caption, without creating duplicates.
 *
 * Fill in VIDEOS below with real links, then run: npx tsx scripts/add-videos.ts
 */
import { PrismaClient } from "@prisma/client";
import { detectVideoProvider } from "../src/lib/video";

const prisma = new PrismaClient();

type VideoInput = { link: string; caption?: string };

// Fill in with real links before running — YouTube/Shorts URL, a Google Drive file-share
// URL ("Anyone with the link"), or an .mp4 key/URL on our S3 bucket.
const VIDEOS: VideoInput[] = [
  {
    link: "https://youtu.be/0pTmLNgkm3s",
    caption: "Nagarathar's Chess Championship — 4 January 2026 highlights",
  },
];

// true: only print what would be created/updated (still reads the database, never writes).
const DRY_RUN = false;

async function main() {
  if (VIDEOS.length === 0) {
    console.log("VIDEOS is empty — add links to scripts/add-videos.ts and re-run.");
    return;
  }

  const existingCount = await prisma.galleryItem.count({ where: { section: "HIGHLIGHTS" } });
  let sortOrder = existingCount * 10;

  for (const { link, caption } of VIDEOS) {
    const detected = detectVideoProvider(link);
    if (detected.provider === "NONE") {
      throw new Error(`Unsupported video link: ${link}`);
    }

    const url = detected.provider === "S3" ? detected.key : link;
    const thumbnailUrl = detected.provider === "YOUTUBE" ? detected.thumbnailUrl : null;

    const existing = await prisma.galleryItem.findFirst({ where: { url } });
    if (DRY_RUN) {
      console.log(
        `[dry run] would ${existing ? `update ${existing.id}` : "create"}:`,
        JSON.stringify(
          {
            provider: detected.provider,
            url,
            caption: caption ?? existing?.caption ?? null,
            thumbnailUrl,
            section: existing?.section ?? "HIGHLIGHTS",
            sortOrder: existing?.sortOrder ?? sortOrder,
          },
          null,
          2
        )
      );
      if (!existing) sortOrder += 10;
      continue;
    }
    if (existing) {
      await prisma.galleryItem.update({
        where: { id: existing.id },
        data: { caption: caption ?? existing.caption, thumbnailUrl },
      });
      console.log(`Updated ${detected.provider} video: ${url}`);
    } else {
      await prisma.galleryItem.create({
        data: {
          url,
          caption: caption ?? null,
          altText: caption ?? null,
          mediaType: "VIDEO",
          videoProvider: detected.provider,
          thumbnailUrl,
          section: "HIGHLIGHTS",
          sortOrder,
        },
      });
      sortOrder += 10;
      console.log(`Created ${detected.provider} video: ${url}`);
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
