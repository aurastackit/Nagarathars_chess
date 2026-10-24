import type { ReactNode } from "react";
import type { AgeCategoryValue } from "@/lib/age-category";

/**
 * The home page's age-category artwork: one 4:3 scene per category in the
 * site palette, on the same soft ivory gradient. Decorative (aria-hidden); the
 * card's text says what each category is. The scene lifts gently on hover of
 * the card (`group`), not with reduced motion.
 */
function Frame({ children }: { children: ReactNode }) {
  return (
    <div className="aspect-[4/3] w-full overflow-hidden border-b border-border bg-gradient-to-b from-[#fbf7ee] to-[#efe6d2]">
      <svg
        viewBox="0 0 400 300"
        className="h-full w-full transition-transform duration-500 ease-out group-hover:-translate-y-1.5 motion-reduce:transition-none motion-reduce:group-hover:translate-y-0"
        aria-hidden="true"
        focusable="false"
      >
        {children}
      </svg>
    </div>
  );
}

/** A five-pointed star's points, centred on (cx, cy). */
function star(cx: number, cy: number, outer: number, inner: number) {
  return Array.from({ length: 10 }, (_, i) => {
    const r = i % 2 ? inner : outer;
    const a = (Math.PI / 5) * i - Math.PI / 2;
    return `${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`;
  }).join(" ");
}

/** Board squares in a row or grid, alternating light and dark. */
function Squares({
  x,
  y,
  cols,
  rows,
  size,
}: {
  x: number;
  y: number;
  cols: number;
  rows: number;
  size: number;
}) {
  return (
    <>
      {Array.from({ length: rows * cols }, (_, i) => {
        const c = i % cols;
        const r = Math.floor(i / cols);
        return (
          <rect
            key={i}
            x={x + c * size}
            y={y + r * size}
            width={size}
            height={size}
            fill={(c + r) % 2 ? "var(--board-dark)" : "var(--board-light)"}
          />
        );
      })}
    </>
  );
}

/** Under 11: a small pawn beside a mini chessboard, with a gold star. Playful and light. */
export function Under11Illustration() {
  return (
    <Frame>
      {/* Mini board */}
      <rect x="186" y="146" width="120" height="120" rx="4" fill="var(--board-frame)" />
      <Squares x={190} y={150} cols={4} rows={4} size={28} />
      {/* Star and sparkles */}
      <polygon
        points={star(312, 86, 28, 12)}
        fill="var(--gold)"
        stroke="var(--gold-ink)"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <circle cx="268" cy="70" r="4" fill="var(--gold)" />
      <circle cx="344" cy="124" r="3" fill="var(--gold)" />
      <circle cx="350" cy="62" r="2.5" fill="var(--gold-ink)" />
      {/* Pawn */}
      <ellipse cx="120" cy="258" rx="46" ry="7" fill="var(--charcoal)" opacity="0.08" />
      <g fill="var(--card)" stroke="var(--walnut)" strokeWidth="3" strokeLinejoin="round">
        <path d="M86 254 L154 254 L146 232 L134 229 C140 208 138 194 130 186 L110 186 C102 194 100 208 106 229 L94 232 Z" />
        <rect x="102" y="180" width="36" height="9" rx="4.5" />
        <circle cx="120" cy="160" r="21" />
      </g>
    </Frame>
  );
}

/** Under 19: a knight mid-leap over board squares, along a motion arc. Energetic. */
export function Under19Illustration() {
  return (
    <Frame>
      <rect x="46" y="236" width="308" height="58" rx="4" fill="var(--board-frame)" />
      <Squares x={50} y={240} cols={6} rows={1} size={50} />
      {/* Leap arc, start and landing */}
      <path
        d="M78 232 Q200 6 322 232"
        fill="none"
        stroke="var(--gold-ink)"
        strokeWidth="3"
        strokeDasharray="2 10"
        strokeLinecap="round"
      />
      <circle cx="78" cy="234" r="6" fill="var(--gold)" />
      <circle cx="322" cy="234" r="6" fill="none" stroke="var(--gold)" strokeWidth="3" />
      {/* Speed lines */}
      <g stroke="var(--gold)" strokeWidth="4" strokeLinecap="round">
        <path d="M118 104 H142" />
        <path d="M108 124 H140" />
        <path d="M120 144 H144" />
      </g>
      {/* Knight */}
      <g transform="rotate(-8 200 120)">
        <path
          d="M166 172 L238 172 L234 152 L224 144 C228 122 236 104 230 86 C222 70 202 62 182 68 L172 56 L168 72 C156 80 150 96 148 110 L160 120 L176 112 L184 120 C170 132 164 148 170 164 Z"
          fill="var(--walnut)"
          stroke="var(--charcoal)"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        <path
          d="M196 72 C214 76 226 96 222 118"
          fill="none"
          stroke="var(--gold)"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <circle cx="186" cy="90" r="4" fill="var(--card)" />
      </g>
    </Frame>
  );
}

/** Above 19: a king beside a trophy, on the edge of a board. Calm and distinguished. */
export function Above19Illustration() {
  return (
    <Frame>
      <rect x="0" y="236" width="400" height="64" fill="var(--board-frame)" />
      <Squares x={0} y={240} cols={10} rows={2} size={40} />
      {/* King */}
      <ellipse cx="148" cy="240" rx="50" ry="6" fill="var(--charcoal)" opacity="0.1" />
      <g fill="var(--card)" stroke="var(--walnut)" strokeWidth="3" strokeLinejoin="round">
        <rect x="106" y="222" width="84" height="16" rx="4" />
        <path d="M118 222 L134 158 L162 158 L178 222 Z" />
        <rect x="122" y="146" width="52" height="12" rx="4" />
        <path d="M126 146 L120 112 L137 126 L148 104 L159 126 L176 112 L170 146 Z" />
        <rect x="144" y="74" width="8" height="30" rx="2" />
        <rect x="136" y="82" width="24" height="8" rx="2" />
      </g>
      {/* Trophy */}
      <ellipse cx="282" cy="240" rx="40" ry="5" fill="var(--charcoal)" opacity="0.1" />
      <g fill="none" stroke="var(--gold-ink)" strokeWidth="6" strokeLinecap="round">
        <path d="M244 132 C222 132 222 166 250 168" />
        <path d="M320 132 C342 132 342 166 314 168" />
      </g>
      <path
        d="M242 118 H322 C322 166 304 188 282 190 C260 188 242 166 242 118 Z"
        fill="var(--gold)"
        stroke="var(--gold-ink)"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path
        d="M260 132 C260 156 268 172 280 178"
        fill="none"
        stroke="var(--card)"
        strokeWidth="4"
        strokeLinecap="round"
        opacity="0.6"
      />
      <rect x="274" y="190" width="16" height="22" fill="var(--gold-ink)" />
      <rect x="254" y="212" width="56" height="24" rx="3" fill="var(--walnut)" />
      <rect x="266" y="219" width="32" height="9" rx="2" fill="var(--gold)" />
    </Frame>
  );
}

export const AGE_CATEGORY_ILLUSTRATIONS: Record<AgeCategoryValue, () => ReactNode> = {
  under_11: Under11Illustration,
  "11_to_18": Under19Illustration,
  above_19: Above19Illustration,
};
