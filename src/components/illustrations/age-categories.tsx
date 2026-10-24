import type { ReactNode } from "react";
import type { AgeCategoryValue } from "@/lib/age-category";

/**
 * The home page's age-category artwork: one set of three, a single ivory
 * chess piece per card (Under 11 pawn, Under 19 knight, Above 19 king),
 * centred on a few board squares in gentle perspective, with a soft gold glow
 * behind it on the same warm ivory gradient. Same frame, lighting and stroke
 * widths on all three. Decorative (aria-hidden); the card's text says what
 * each category is. The piece lifts 4px on hover of the card (`group`), not
 * with reduced motion.
 */

const STROKE = 3;
const BAND_STROKE = 2.5;

/** Board edges, back to front, and the half-width of the board at a given y (perspective). */
const ROW_Y = [198, 214, 234, 260, 294];
const halfWidth = (y: number) => 150 + ((y - 198) * 112) / 96;
const COLS = 8;

function Board() {
  const quads: ReactNode[] = [];
  for (let r = 0; r < ROW_Y.length - 1; r++) {
    const [y0, y1] = [ROW_Y[r], ROW_Y[r + 1]];
    const [w0, w1] = [halfWidth(y0), halfWidth(y1)];
    for (let c = 0; c < COLS; c++) {
      const x = (w: number, i: number) => (200 + w * ((2 * i) / COLS - 1)).toFixed(1);
      quads.push(
        <polygon
          key={`${r}-${c}`}
          points={`${x(w0, c)},${y0} ${x(w0, c + 1)},${y0} ${x(w1, c + 1)},${y1} ${x(w1, c)},${y1}`}
          fill={(r + c) % 2 ? "var(--board-dark)" : "var(--board-light)"}
        />
      );
    }
  }
  return <g>{quads}</g>;
}

function Frame({ id, children }: { id: string; children: ReactNode }) {
  return (
    <div className="aspect-[4/3] w-full overflow-hidden border-b border-border bg-gradient-to-b from-[#fbf7ee] to-[#efe6d2]">
      <svg viewBox="0 0 400 300" className="h-full w-full" aria-hidden="true" focusable="false">
        <defs>
          <radialGradient id={`${id}-glow`}>
            <stop offset="0" style={{ stopColor: "var(--gold)", stopOpacity: 0.42 }} />
            <stop offset="1" style={{ stopColor: "var(--gold)", stopOpacity: 0 }} />
          </radialGradient>
          {/* Lit from the upper left: ivory on the left, a warm walnut tint on the shadow side. */}
          <linearGradient id={`${id}-ivory`} x1="0" y1="0" x2="1" y2="0.25">
            <stop offset="0" style={{ stopColor: "var(--card)" }} />
            <stop offset="0.55" style={{ stopColor: "#f5ede0" }} />
            <stop
              offset="1"
              style={{ stopColor: "color-mix(in srgb, var(--walnut) 22%, var(--card))" }}
            />
          </linearGradient>
          {/* The far rows fade into the background, so the board recedes. */}
          <linearGradient id={`${id}-fade`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" style={{ stopColor: "#f4eddd", stopOpacity: 1 }} />
            <stop offset="1" style={{ stopColor: "#f4eddd", stopOpacity: 0 }} />
          </linearGradient>
        </defs>

        <circle cx="200" cy="150" r="125" fill={`url(#${id}-glow)`} />
        <Board />
        <rect x="0" y="196" width="400" height="46" fill={`url(#${id}-fade)`} />
        <ellipse cx="200" cy="249" rx="74" ry="9" fill="var(--charcoal)" opacity="0.18" />

        <g
          fill={`url(#${id}-ivory)`}
          stroke="var(--walnut)"
          strokeWidth={STROKE}
          strokeLinejoin="round"
          strokeLinecap="round"
          className="transition-transform duration-300 ease-out group-hover:-translate-y-1 motion-reduce:transition-none motion-reduce:group-hover:translate-y-0"
        >
          {children}
        </g>
      </svg>
    </div>
  );
}

/** The plinth and collar every piece stands on, so the three read as one set. */
function Base() {
  return (
    <>
      <path d="M136 246 H264 L258 229 Q254 221 244 220 H156 Q146 221 142 229 Z" />
      <rect
        x="152"
        y="206"
        width="96"
        height="14"
        rx="7"
        stroke="var(--gold-ink)"
        strokeWidth={BAND_STROKE}
      />
    </>
  );
}

/** Under 11: the pawn. */
export function Under11Illustration() {
  return (
    <Frame id="ac-pawn">
      <path d="M164 206 C172 186 178 168 180 152 H220 C222 168 228 186 236 206 Z" />
      <rect
        x="168"
        y="140"
        width="64"
        height="13"
        rx="6.5"
        stroke="var(--gold-ink)"
        strokeWidth={BAND_STROKE}
      />
      <circle cx="200" cy="110" r="31" />
      <Base />
    </Frame>
  );
}

/** Under 19: the knight, facing left. */
export function Under19Illustration() {
  return (
    <Frame id="ac-knight">
      <path d="M160 206 C160 182 170 162 186 148 C174 144 158 141 148 133 C139 126 139 113 148 107 C162 96 175 88 187 80 L190 64 L203 78 C229 80 247 104 247 138 C247 168 236 188 240 206 Z" />
      <path
        d="M208 86 C228 94 240 114 238 142 C237 162 230 182 232 204"
        fill="none"
        stroke="var(--gold-ink)"
        strokeWidth={BAND_STROKE}
      />
      <circle cx="176" cy="104" r="4" fill="var(--walnut)" stroke="none" />
      <path d="M150 118 Q154 121 158 119" fill="none" strokeWidth={BAND_STROKE} />
      <Base />
    </Frame>
  );
}

/** Above 19: the king. */
export function Above19Illustration() {
  return (
    <Frame id="ac-king">
      <path d="M162 206 C170 184 178 160 180 140 H220 C222 160 230 184 238 206 Z" />
      <rect
        x="166"
        y="128"
        width="68"
        height="13"
        rx="6.5"
        stroke="var(--gold-ink)"
        strokeWidth={BAND_STROKE}
      />
      <path d="M172 128 L164 100 Q200 90 236 100 L228 128 Z" />
      <path d="M176 99 Q200 80 224 99" />
      <rect x="195" y="52" width="10" height="38" rx="2" />
      <rect x="184" y="62" width="32" height="10" rx="2" />
      <Base />
    </Frame>
  );
}

export const AGE_CATEGORY_ILLUSTRATIONS: Record<AgeCategoryValue, () => ReactNode> = {
  under_11: Under11Illustration,
  "11_to_18": Under19Illustration,
  above_19: Above19Illustration,
};
