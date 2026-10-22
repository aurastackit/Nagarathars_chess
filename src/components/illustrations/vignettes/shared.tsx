import type { ReactNode } from "react";
import { BoardPiece, type PieceKind, type PieceSide } from "@/components/icons/chess-pieces";

/** Same piece-to-square ratio as the hero Live Board (52 / 60). */
const PIECE_RATIO = 52 / 60;
/** Where a piece's foot line sits, as a fraction of its BoardPiece size (icon y 20.7 in the 2.5–22 crop). */
const PIECE_BASE = (20.7 - 2.5) / 19.5;

/**
 * Every home-page vignette (How It Works, Tournament Formats, Why Chess)
 * shares this 240x160 (3:2) canvas. Light comes from the upper right,
 * matching the hero — that's painted by the card's .vignette-panel
 * background, so the scenes themselves stay flat.
 */
export function VignetteSvg({ children }: { children: ReactNode }) {
  return (
    <svg viewBox="0 0 240 160" className="h-full w-full" aria-hidden="true">
      {children}
    </svg>
  );
}

/** A cols x rows patch of the hero's board (same square colours), with a thin frame-green edge. */
export function BoardFragment({
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
    <g>
      {Array.from({ length: rows }).flatMap((_, r) =>
        Array.from({ length: cols }).map((_, c) => (
          <rect
            key={`${c}-${r}`}
            x={x + c * size}
            y={y + r * size}
            width={size}
            height={size}
            fill={(c + r) % 2 === 1 ? "var(--board-dark)" : "var(--board-light)"}
          />
        ))
      )}
      <rect
        x={x}
        y={y}
        width={cols * size}
        height={rows * size}
        fill="none"
        stroke="var(--board-frame)"
        strokeWidth={1.5}
        vectorEffect="non-scaling-stroke"
      />
    </g>
  );
}

/** A piece centred on the square whose top-left corner is (x, y). */
export function PieceOnSquare({
  kind,
  side,
  x,
  y,
  size,
}: {
  kind: PieceKind;
  side: PieceSide;
  x: number;
  y: number;
  size: number;
}) {
  const glyph = size * PIECE_RATIO;
  const pad = (size - glyph) / 2;
  return <BoardPiece kind={kind} side={side} x={x + pad} y={y + pad} size={glyph} />;
}

/** A piece standing with its foot line exactly on `baseY` (e.g. the top edge of a board strip), centred on `cx`. */
export function PieceStanding({
  kind,
  side,
  cx,
  baseY,
  size,
}: {
  kind: PieceKind;
  side: PieceSide;
  cx: number;
  baseY: number;
  size: number;
}) {
  return (
    <BoardPiece kind={kind} side={side} x={cx - size / 2} y={baseY - size * PIECE_BASE} size={size} />
  );
}
