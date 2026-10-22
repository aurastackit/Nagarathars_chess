import type { CSSProperties, ReactNode } from "react";

/**
 * The site's Staunton piece set — solid, carved-looking tournament pieces for
 * the hero Live Board and the home-page vignettes. Original artwork.
 *
 * Every piece is drawn on a 100x100 square: identical base, common baseline at
 * y 94 (6% above the square's bottom edge), real height ratios (pawn 62% …
 * king 94%), light from the top left. Symmetric pieces are generated from a
 * right-hand profile, mirrored, so both halves always match.
 *
 * Paint (gradients, highlight strips, contact-shadow blur) is defined once per
 * SVG by <PieceDefs prefix> and reached through CSS custom properties set by
 * pieceVars(prefix) on that SVG — pieces never carry their own defs, and two
 * SVGs on one page never share an id.
 */

export type PieceKind = "K" | "Q" | "R" | "B" | "N" | "P";
export type PieceSide = "w" | "b";

/** Where every piece stands, as a fraction of its square (y 94 of 100). */
export const PIECE_BASELINE = 0.94;
/** Left end of the base's bottom edge, as a fraction of the square. */
export const PIECE_BASE_LEFT = 0.22;

type Seg =
  | ["L", number, number]
  | ["Q", number, number, number, number]
  | ["C", number, number, number, number, number, number];

const n = (v: number) => +v.toFixed(2);
const mx = (x: number) => n(100 - x);

/**
 * A closed, left-right symmetric outline from its right half: starts at
 * (50, top), runs down the right side to the bottom, then mirrors back up.
 */
function lathe(top: number, right: Seg[]): string {
  const starts: [number, number][] = [];
  let at: [number, number] = [50, top];
  let d = `M50 ${n(top)}`;
  for (const s of right) {
    starts.push(at);
    d +=
      s[0] +
      s
        .slice(1)
        .map((v) => n(v as number))
        .join(" ");
    at = [s[s.length - 2] as number, s[s.length - 1] as number];
  }
  d += `L${mx(at[0])} ${n(at[1])}`;
  for (let i = right.length - 1; i >= 0; i--) {
    const s = right[i];
    const [x0, y0] = starts[i];
    if (s[0] === "L") d += `L${mx(x0)} ${n(y0)}`;
    else if (s[0] === "Q") d += `Q${mx(s[1])} ${n(s[2])} ${mx(x0)} ${n(y0)}`;
    else d += `C${mx(s[3])} ${n(s[4])} ${mx(s[1])} ${n(s[2])} ${mx(x0)} ${n(y0)}`;
  }
  return d + "Z";
}

// Two-step base shared by every piece: an upper ring (y 80–84) on a wider
// plinth (y 84–94). Bodies end on its top edge at y 80, x 33–67.
const BASE = lathe(80, [
  ["L", 71, 80],
  ["Q", 73, 80, 73, 82],
  ["L", 73, 84],
  ["L", 76, 84],
  ["Q", 79, 84, 79, 87],
  ["L", 79, 92],
  ["Q", 79, 94, 77, 94],
]);
const BASE_DETAIL = "M27 84H73M22.5 89.5H77.5";

/** Tapered stem from a collar at `y` down onto the base. */
const stem = (x: number, y: number): Seg[] => [
  ["L", x, y],
  ["C", x + 0.5, y + (80 - y) * 0.45, x + 3, y + (80 - y) * 0.8, 67, 80],
];
/** A rounded collar ring, `h` tall, reaching out to x `r`, starting at y. */
const collar = (r: number, y: number, h: number): Seg[] => [
  ["L", r - 2.5, y],
  ["Q", r, y, r, y + h / 2],
  ["Q", r, y + h, r - 2.5, y + h],
];

type PieceArt = {
  body: string;
  details: string;
  extra?: (fill: CSSProperties, line: LineStyle) => ReactNode;
};

const PAWN: PieceArt = {
  body: lathe(32, [
    ["C", 55.5, 32, 60, 36.5, 60, 42],
    ["C", 60, 45.6, 58.4, 48.6, 56, 50.3],
    ...collar(64, 50.3, 5),
    ...stem(59, 55.3),
  ]),
  details: "M37 50.3H63M37 55.3H63",
};

const ROOK: PieceArt = {
  body: lathe(31, [
    ["L", 52.5, 31],
    ["L", 52.5, 26],
    ["L", 58.75, 26],
    ["L", 58.75, 31],
    ["L", 63.75, 31],
    ["L", 63.75, 26],
    ["L", 69, 26],
    ["Q", 70, 26, 70, 27],
    ["L", 70, 36],
    ["Q", 70, 38, 66, 38.5],
    ["L", 64.5, 39.5],
    ["C", 63.8, 52, 64.5, 68, 67, 80],
  ]),
  details: "M31 36H69M37 39.5H63",
};

const BISHOP: PieceArt = {
  body: lathe(14, [
    ["C", 51.66, 14, 53, 15.34, 53, 17],
    ["C", 53, 18.3, 52.2, 19.4, 51, 19.8],
    ["L", 51, 21],
    ["C", 55, 23, 61, 28, 61, 35],
    ["C", 61, 40, 58.5, 43.5, 56.5, 45],
    ...collar(64.5, 45, 5),
    ...stem(58.5, 50),
  ]),
  // Mitre slit (top right to lower left), collar ring edges.
  details: "M56.6 27.2L46 38.4M36 45H64M36 50H64M44 44.6H56",
};

const CORONET = Array.from({ length: 8 }, (_, i) => {
  const x = n(37.75 + i * 3.5 - 1.85);
  return `M${x} 11.9a1.85 1.85 0 1 0 3.7 0a1.85 1.85 0 1 0 -3.7 0`;
}).join("");

const QUEEN: PieceArt = {
  body: lathe(6, [
    ["C", 51.8, 6, 53.2, 7.4, 53.2, 9.2],
    ["C", 53.2, 10.6, 52.4, 11.7, 51.2, 12.1],
    ["Q", 58, 11.4, 63.5, 12.6],
    ["Q", 64.6, 14.4, 62.8, 15.2],
    ["C", 59, 18, 56.5, 21.5, 56.5, 26],
    ...collar(63.5, 26, 5),
    ...stem(58, 31),
  ]),
  details: "M38 15.2H62M37 26H63M37 31H63",
  // Coronet: eight small balls along the rim, as one path (one set of paint attributes).
  extra: (fill, line) => <path d={CORONET} style={fill} {...line} />,
};

const KING: PieceArt = {
  body: lathe(0, [
    ["L", 51.6, 0],
    ["L", 51.6, 3.2],
    ["L", 55, 3.2],
    ["L", 55, 6.4],
    ["L", 51.6, 6.4],
    ["L", 51.6, 10],
    ["Q", 59, 10.2, 64, 12],
    ["Q", 65, 13.8, 63.4, 14.6],
    ["C", 59, 17.5, 56.5, 21.5, 56.5, 25.5],
    ...collar(64, 25.5, 5),
    ...stem(58, 30.5),
  ]),
  details: "M37.5 14.6H62.5M37 25.5H63M37 30.5H63M44 11.2H56",
};

const KNIGHT: PieceArt = {
  // Horse head facing left: collar, front of the neck, throat, jaw, muzzle,
  // nose, forehead, ear, poll and the mane down the back of the neck.
  body:
    "M33 80L33 77.5Q33 76 34.5 76L35 76C35.5 66 40.5 58.5 45 52.5C43 50.5 40 51 37.5 53" +
    "C35.5 55 33 56.2 30 55.6L24.5 54.2C21.6 53.4 21 50 22.8 47.6L31 37C35 31.5 41 27.5 46.8 25.6" +
    "L50.5 20L53.2 24.4C58 25.5 63.5 29 66 34C71.5 43 71.8 60 67 76L65.5 76Q67 76 67 77.5L67 80Z",
  details:
    // Mane ridge with tufts, carved neck line, mouth, inner ear, collar edge.
    "M54.5 26.2C61.5 31 65 45 62.5 75M65 35L61.8 37.2M67.2 43.5L63.6 44.8M68 52.5L64.3 53.2" +
    "M67.7 61.5L64 61.8M45 52.5C47.5 60 48.2 68 47 76M25.5 51.6C28 52.4 30.5 52.8 33 52.3" +
    "M50.6 22.6L49.4 26M34 80H66",
  extra: (_fill, line) => (
    <>
      <ellipse
        cx={39.6}
        cy={35.4}
        rx={2.3}
        ry={1.4}
        transform="rotate(-28 39.6 35.4)"
        fill={line.stroke}
      />
      <ellipse
        cx={26.6}
        cy={48.6}
        rx={1.3}
        ry={0.9}
        transform="rotate(-40 26.6 48.6)"
        fill={line.stroke}
      />
    </>
  ),
};

const ART: Record<PieceKind, PieceArt> = {
  K: KING,
  Q: QUEEN,
  R: ROOK,
  B: BISHOP,
  N: KNIGHT,
  P: PAWN,
};

const SIDE = {
  w: {
    fallback: "#F4EEDF",
    outline: { stroke: "#3A2E22", strokeOpacity: 0.7, strokeWidth: 1.5 },
    detail: "#B09A72",
    lip: { stroke: "#FFFFFF", strokeOpacity: 0.85 },
  },
  b: {
    fallback: "#2C251F",
    outline: { stroke: "#F1EEDC", strokeOpacity: 0.25, strokeWidth: 1 },
    detail: "#0A0705",
    lip: { stroke: "#8C7A6A", strokeOpacity: 0.6 },
  },
} as const;

type LineStyle = { stroke: string; strokeOpacity: number; strokeWidth: number };

/**
 * One piece in its 100x100 square. Layers: contact shadow, solid body
 * (top-left to bottom-right gradient), left-side highlight strip with the
 * outline over it, then the carved detail lines. Strokes keep their pixel
 * width at any size (.chess-piece in globals.css).
 */
function Piece({ kind, side }: { kind: PieceKind; side: PieceSide }) {
  const art = ART[kind];
  const s = SIDE[side];
  const fill: CSSProperties = { fill: `var(--pc-${side}-body, ${s.fallback})` };
  return (
    <g className="chess-piece">
      <ellipse
        cx={50}
        cy={94.4}
        rx={29}
        ry={3.2}
        fill="#000"
        fillOpacity={0.22}
        style={{ filter: "var(--pc-shadow)" }}
      />
      <path d={BASE} style={fill} />
      <path d={art.body} style={fill} />
      <path d={BASE} style={{ fill: `var(--pc-${side}-hl, none)` }} {...s.outline} />
      <path d={art.body} style={{ fill: `var(--pc-${side}-hl, none)` }} {...s.outline} />
      {art.extra?.(fill, { ...s.outline })}
      {/* Carved grooves: a light lip on the lit (lower-right) edge, then the dark cut. */}
      <path
        d={`${art.details}${BASE_DETAIL}`}
        transform="translate(0.55 0.65)"
        fill="none"
        {...s.lip}
        strokeWidth={1}
        strokeLinecap="round"
      />
      <path
        d={`${art.details}${BASE_DETAIL}`}
        fill="none"
        stroke={s.detail}
        strokeWidth={1}
        strokeLinecap="round"
      />
    </g>
  );
}

export const King = ({ side }: { side: PieceSide }) => <Piece kind="K" side={side} />;
export const Queen = ({ side }: { side: PieceSide }) => <Piece kind="Q" side={side} />;
export const Rook = ({ side }: { side: PieceSide }) => <Piece kind="R" side={side} />;
export const Bishop = ({ side }: { side: PieceSide }) => <Piece kind="B" side={side} />;
export const Knight = ({ side }: { side: PieceSide }) => <Piece kind="N" side={side} />;
export const Pawn = ({ side }: { side: PieceSide }) => <Piece kind="P" side={side} />;

export const PIECES: Record<PieceKind, typeof King> = {
  K: King,
  Q: Queen,
  R: Rook,
  B: Bishop,
  N: Knight,
  P: Pawn,
};

/** Gradients, highlight strips and the contact-shadow blur — once per SVG. */
export function PieceDefs({ prefix }: { prefix: string }) {
  return (
    <defs>
      <linearGradient id={`${prefix}-w-body`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#FFFDF6" />
        <stop offset="1" stopColor="#E7DCC4" />
      </linearGradient>
      <linearGradient id={`${prefix}-b-body`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#4A3F37" />
        <stop offset="1" stopColor="#15110E" />
      </linearGradient>
      <linearGradient id={`${prefix}-w-hl`} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0.08" stopColor="#FFFFFF" stopOpacity="0" />
        <stop offset="0.22" stopColor="#FFFFFF" stopOpacity="0.35" />
        <stop offset="0.4" stopColor="#FFFFFF" stopOpacity="0" />
      </linearGradient>
      <linearGradient id={`${prefix}-b-hl`} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0.08" stopColor="#A08C78" stopOpacity="0" />
        <stop offset="0.22" stopColor="#A08C78" stopOpacity="0.3" />
        <stop offset="0.4" stopColor="#A08C78" stopOpacity="0" />
      </linearGradient>
      <filter id={`${prefix}-shadow`} x="-20%" y="-150%" width="140%" height="400%">
        <feGaussianBlur stdDeviation="1.2" />
      </filter>
    </defs>
  );
}

/** Points the pieces inside an SVG at that SVG's <PieceDefs prefix>. */
export function pieceVars(prefix: string): CSSProperties {
  return {
    "--pc-w-body": `url(#${prefix}-w-body)`,
    "--pc-b-body": `url(#${prefix}-b-body)`,
    "--pc-w-hl": `url(#${prefix}-w-hl)`,
    "--pc-b-hl": `url(#${prefix}-b-hl)`,
    "--pc-shadow": `url(#${prefix}-shadow)`,
  } as CSSProperties;
}

/** A piece filling the size x size square whose top-left corner is (x, y), in the parent SVG's units. */
export function BoardPiece({
  kind,
  side,
  x = 0,
  y = 0,
  size,
}: {
  kind: PieceKind;
  side: PieceSide;
  x?: number;
  y?: number;
  size: number;
}) {
  return (
    <svg x={x} y={y} width={size} height={size} viewBox="0 0 100 100" overflow="visible">
      <Piece kind={kind} side={side} />
    </svg>
  );
}
