import { cache } from "react";
import { prisma } from "@/lib/prisma";

/**
 * The next published tournament with registration still open. Wrapped in
 * React's `cache()` so the layout (announcement bar / nav CTA) and the
 * homepage (hero countdown card) share a single DB round-trip per request.
 */
export const getNextTournament = cache(async () => {
  return prisma.tournament.findFirst({
    where: { status: "published", registrationDeadline: { gt: new Date() } },
    orderBy: { registrationDeadline: "asc" },
  });
});
