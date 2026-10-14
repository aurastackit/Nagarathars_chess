/** Mirrors the Prisma `GallerySection` enum — kept as plain strings so this file has no
 * dependency on the generated Prisma client (safe to import before/without a migration). */
export type GallerySectionValue =
  | "TOURNAMENT_DAY"
  | "YOUNG_CHAMPIONS"
  | "PRIZE_CEREMONY"
  | "FAMILIES_COMMUNITY"
  | "BEHIND_THE_SCENES"
  | "CLASSES"
  | "HIGHLIGHTS";

export const GALLERY_SECTION_LABEL: Record<GallerySectionValue, string> = {
  TOURNAMENT_DAY: "Tournament Day",
  YOUNG_CHAMPIONS: "Young Champions",
  PRIZE_CEREMONY: "Prize Distribution",
  FAMILIES_COMMUNITY: "Families & Community",
  BEHIND_THE_SCENES: "Organisers & Behind the Scenes",
  CLASSES: "Online Classes",
  HIGHLIGHTS: "Video Highlights",
};

export const GALLERY_SECTION_ORDER: GallerySectionValue[] = [
  "TOURNAMENT_DAY",
  "YOUNG_CHAMPIONS",
  "PRIZE_CEREMONY",
  "FAMILIES_COMMUNITY",
  "BEHIND_THE_SCENES",
  "CLASSES",
  "HIGHLIGHTS",
];
