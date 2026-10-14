/**
 * Licensed stock photography (Unsplash License — free for commercial use).
 * Used as section header imagery where a real event photo isn't the right fit.
 */
function unsplash(id: string, width: number) {
  return `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&q=80`;
}

export const CTA_PHOTO = {
  src: unsplash("photo-1613902863716-8a8a96fc1de2", 1200),
  alt: "A hand making a move on a chess board",
  credit: "Wander Fleur",
};
