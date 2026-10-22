// Minimal types for the parts of fontkit the ID card uses to measure text.
declare module "fontkit" {
  export interface Font {
    unitsPerEm: number;
    hasGlyphForCodePoint(codePoint: number): boolean;
    layout(text: string): { advanceWidth: number };
  }
  export function create(buffer: Buffer): Font;
}
