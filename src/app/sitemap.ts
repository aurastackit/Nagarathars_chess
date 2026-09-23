import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Classes don't have their own detail route (all shown on one /classes
  // listing page), so there's nothing per-class to add here.
  const tournaments = await prisma.tournament.findMany({
    where: { status: { in: ["published", "closed", "completed"] } },
    select: { slug: true, updatedAt: true, resultsPublished: true },
  });

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/tournaments`, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/classes`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${SITE_URL}/gallery`, changeFrequency: "weekly", priority: 0.4 },
    { url: `${SITE_URL}/about`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${SITE_URL}/contact`, changeFrequency: "monthly", priority: 0.3 },
  ];

  const tournamentRoutes: MetadataRoute.Sitemap = tournaments.flatMap((t) => {
    const entries: MetadataRoute.Sitemap = [
      {
        url: `${SITE_URL}/tournaments/${t.slug}`,
        lastModified: t.updatedAt,
        changeFrequency: "weekly",
        priority: 0.8,
      },
    ];
    if (t.resultsPublished) {
      entries.push({
        url: `${SITE_URL}/tournaments/${t.slug}/results`,
        lastModified: t.updatedAt,
        changeFrequency: "monthly",
        priority: 0.5,
      });
    }
    return entries;
  });

  return [...staticRoutes, ...tournamentRoutes];
}
