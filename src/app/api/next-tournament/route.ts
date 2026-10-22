import { NextResponse } from "next/server";
import { getNextTournament } from "@/lib/next-tournament";

// Built on request, cached by the CDN for 60 s via the header below. (A
// `revalidate = 60` route would be a snapshot that Amplify never regenerates.)
export const dynamic = "force-dynamic";

/** The next tournament open for registration, for the site header's announcement bar and Register button. */
export async function GET() {
  const t = await getNextTournament();
  return NextResponse.json(
    {
      nextTournament: t
        ? {
            title: t.title,
            slug: t.slug,
            registrationDeadline: t.registrationDeadline.toISOString(),
          }
        : null,
    },
    { headers: { "Cache-Control": "public, max-age=0, s-maxage=60, stale-while-revalidate=300" } }
  );
}
