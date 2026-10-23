import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { LISTED_STATUSES } from "@/lib/tournament-status";
import { absoluteUrl } from "@/lib/site";
import { CLASSES_ENABLED } from "@/lib/features";
import { isTestContent } from "@/lib/next-tournament";
import { PRIVACY_LAST_UPDATED } from "@/lib/legal";

export const dynamic = "force-dynamic";

const latest = (dates: Date[]) =>
  dates.length ? new Date(Math.max(...dates.map((d) => d.getTime()))) : undefined;

/**
 * Public pages only. Left out on purpose: /admin, /api, /registration/* (personal
 * status pages, also noindex), /players/* (player profiles) and /register.
 * lastModified is only given where real data backs it — a page with no
 * underlying record gets none rather than an invented date.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [rows, newestClass, newestPhoto] = await Promise.all([
    prisma.tournament.findMany({
      where: { status: { in: LISTED_STATUSES } },
      select: { slug: true, title: true, updatedAt: true, resultsPublished: true },
    }),
    CLASSES_ENABLED
      ? prisma.classProgram.findFirst({
          orderBy: { createdAt: "desc" },
          select: { createdAt: true },
        })
      : Promise.resolve(null),
    prisma.galleryItem.findFirst({ orderBy: { updatedAt: "desc" }, select: { updatedAt: true } }),
  ]);
  const tournaments = rows.filter((t) => !isTestContent(t.title));
  const tournamentsUpdated = latest(tournaments.map((t) => t.updatedAt));

  const pages: MetadataRoute.Sitemap = [
    {
      url: absoluteUrl("/"),
      lastModified: tournamentsUpdated,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: absoluteUrl("/tournaments"),
      lastModified: tournamentsUpdated,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: absoluteUrl("/classes"),
      lastModified: newestClass?.createdAt,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: absoluteUrl("/gallery"),
      lastModified: newestPhoto?.updatedAt,
      changeFrequency: "weekly",
      priority: 0.5,
    },
    { url: absoluteUrl("/about"), changeFrequency: "monthly", priority: 0.5 },
    { url: absoluteUrl("/contact"), changeFrequency: "yearly", priority: 0.3 },
    {
      url: absoluteUrl("/privacy"),
      lastModified: PRIVACY_LAST_UPDATED,
      changeFrequency: "yearly",
      priority: 0.2,
    },
  ];

  const tournamentPages: MetadataRoute.Sitemap = tournaments.flatMap((t) => [
    {
      url: absoluteUrl(`/tournaments/${t.slug}`),
      lastModified: t.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    },
    ...(t.resultsPublished
      ? [
          {
            url: absoluteUrl(`/tournaments/${t.slug}/results`),
            lastModified: t.updatedAt,
            changeFrequency: "monthly" as const,
            priority: 0.6,
          },
        ]
      : []),
  ]);

  return [...pages, ...tournamentPages];
}
