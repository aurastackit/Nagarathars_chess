import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { generateGalleryPlaceholders } from "@/lib/gallery-placeholders";
import { GalleryGrid } from "@/components/gallery-grid";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Gallery — Nagarathar's Chess Championship",
  description: "Photos from our tournaments and classes.",
};

const GALLERY_TARGET = 50;

export default async function GalleryPage() {
  const [tournaments, classes] = await Promise.all([
    prisma.tournament.findMany({
      where: { posterImageUrl: { not: null } },
      orderBy: { startDate: "desc" },
    }),
    prisma.classProgram.findMany({
      where: { bannerImageUrl: { not: null } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const realItems = [
    ...tournaments.map((t) => ({
      id: `tournament-${t.id}`,
      src: t.posterImageUrl!,
      title: t.title,
      caption: t.city,
    })),
    ...classes.map((c) => ({
      id: `class-${c.id}`,
      src: c.bannerImageUrl!,
      title: c.title,
      caption: "Online class",
    })),
  ];

  const placeholders = generateGalleryPlaceholders(Math.max(0, GALLERY_TARGET - realItems.length));

  return (
    <main className="mx-auto max-w-6xl px-4 py-14">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-navy">Gallery</h1>
        <p className="mx-auto mt-2 max-w-xl text-foreground/60">
          Moments from our tournaments and classes — posters, banners, and highlights as our
          community grows.
        </p>
      </div>

      <GalleryGrid realItems={realItems} placeholders={placeholders} />
    </main>
  );
}
