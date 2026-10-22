import { revalidatePath } from "next/cache";

/*
 * The public pages are statically rendered and regenerated at most every five
 * minutes (`revalidate = 300`). Anything that changes what they show calls one
 * of these so the change appears on the next request instead.
 */

/**
 * A tournament was created, edited, published, unpublished or deleted, or its
 * results changed. Tournaments feed the announcement bar and the header's
 * Register link on every page, plus the home, listing, about and tournament
 * pages — so refresh everything under the root layout.
 */
export function revalidateTournamentPages() {
  revalidatePath("/", "layout");
}

/** A registration came in: seat counts on the tournament page, its card and the listings. */
export function revalidateTournamentSeats(slug: string) {
  revalidatePath("/");
  revalidatePath("/tournaments");
  revalidatePath(`/tournaments/${slug}`);
}

/** A class program was created or edited: the classes page, the home page's programmes and the about stats. */
export function revalidateClassPages() {
  revalidatePath("/");
  revalidatePath("/classes");
  revalidatePath("/about");
}
