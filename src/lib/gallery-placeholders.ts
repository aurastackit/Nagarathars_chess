export const PIECE_KEYS = ["king", "queen", "rook", "bishop", "knight", "pawn"] as const;
export type PieceKey = (typeof PIECE_KEYS)[number];

const TONES: [string, string][] = [
  ["var(--charcoal)", "color-mix(in srgb, var(--charcoal), var(--gold) 20%)"],
  [
    "color-mix(in srgb, var(--charcoal), var(--gold) 15%)",
    "color-mix(in srgb, var(--charcoal), var(--gold) 35%)",
  ],
  ["var(--gold)", "color-mix(in srgb, var(--gold), white 15%)"],
  ["color-mix(in srgb, var(--charcoal), black 15%)", "var(--charcoal)"],
  [
    "color-mix(in srgb, var(--charcoal), var(--gold) 30%)",
    "color-mix(in srgb, var(--gold), var(--charcoal) 40%)",
  ],
];

const CAPTIONS = [
  "Chess moment",
  "Training session",
  "Tournament day",
  "Board in focus",
  "Young players",
  "Community meetup",
  "Class in session",
  "Opening study",
];

export type GalleryPlaceholder = {
  id: string;
  piece: PieceKey;
  from: string;
  to: string;
  caption: string;
};

export function generateGalleryPlaceholders(count: number): GalleryPlaceholder[] {
  return Array.from({ length: count }, (_, i) => {
    const [from, to] = TONES[i % TONES.length];
    return {
      id: `placeholder-${i + 1}`,
      piece: PIECE_KEYS[i % PIECE_KEYS.length],
      from,
      to,
      caption: `${CAPTIONS[i % CAPTIONS.length]} #${i + 1}`,
    };
  });
}
