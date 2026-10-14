import { SiteHeader } from "@/components/site-header";
import { getNextTournament } from "@/lib/next-tournament";
import { labelUntilEndOfDayIST } from "@/lib/countdown-format";

export const dynamic = "force-dynamic";

/**
 * Unlike layout.tsx, a template re-runs on every navigation (it doesn't
 * persist across client-side route changes) — see the comment on
 * getNextTournament() for why that matters here: it's what keeps the
 * announcement bar / nav "Register Now" link in sync with whatever the
 * current page fetched, instead of showing whatever was next-up when the
 * layout last rendered.
 */
export default async function Template({ children }: { children: React.ReactNode }) {
  const nextTournament = await getNextTournament();

  return (
    <>
      <SiteHeader
        nextTournament={
          nextTournament
            ? {
                title: nextTournament.title,
                slug: nextTournament.slug,
                registrationDeadline: nextTournament.registrationDeadline.toISOString(),
                initialLabel: labelUntilEndOfDayIST(nextTournament.registrationDeadline),
              }
            : null
        }
      />
      {/* Preserves layout.tsx's original <SiteHeader/><div class="flex-1">{page}</div><SiteFooter/> structure.
          id = the skip link's target (layout.tsx); scroll margin clears the sticky header. */}
      <div id="main-content" className="flex-1 scroll-mt-20">
        {children}
      </div>
    </>
  );
}
