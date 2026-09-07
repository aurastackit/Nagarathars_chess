const GLYPHS = ["♔", "♕", "♖", "♗", "♘", "♙"];

const TONES: [string, string][] = [
  ["#16324f", "#1c3f63"],
  ["#157a4a", "#1c9459"],
  ["#c8922f", "#d9a94f"],
  ["#0b1e30", "#16324f"],
  ["#8a6d1f", "#c8922f"],
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
  glyph: string;
  from: string;
  to: string;
  caption: string;
};

export function generateGalleryPlaceholders(count: number): GalleryPlaceholder[] {
  return Array.from({ length: count }, (_, i) => {
    const [from, to] = TONES[i % TONES.length];
    return {
      id: `placeholder-${i + 1}`,
      glyph: GLYPHS[i % GLYPHS.length],
      from,
      to,
      caption: `${CAPTIONS[i % CAPTIONS.length]} #${i + 1}`,
    };
  });
}
