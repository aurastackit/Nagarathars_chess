import { SiteHeader } from "@/components/site-header";
import { PublicOnly } from "@/components/public-only";

/**
 * Unlike layout.tsx, a template re-runs on every navigation. The header
 * fetches the next open tournament in the browser (useNextTournament), so
 * nothing here depends on data and cached pages never show a stale
 * announcement bar or Register link.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PublicOnly>
        <SiteHeader />
      </PublicOnly>
      {/* Preserves layout.tsx's original <SiteHeader/><div class="flex-1">{page}</div><SiteFooter/> structure.
          id = the skip link's target (layout.tsx); scroll margin clears the sticky header. */}
      <div id="main-content" className="flex-1 scroll-mt-20">
        {children}
      </div>
    </>
  );
}
