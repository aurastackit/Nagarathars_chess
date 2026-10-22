import { useId, type ReactNode } from "react";
import {
  BoardPiece,
  PIECE_BASELINE,
  PieceDefs,
  pieceVars,
  type PieceKind,
  type PieceSide,
} from "@/components/icons/staunton-pieces";

/**
 * Every home-page vignette (How It Works, Tournament Formats, Why Chess)
 * shares this 240x160 (3:2) canvas. The card's .vignette-panel background
 * paints the ambient light; pieces carry their own shading, the same as the
 * hero board's. Each vignette gets its own piece paint under a unique id prefix.
 */
export function VignetteSvg({ children }: { children: ReactNode }) {
  const prefix = `pc${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  return (
    <svg
      viewBox="0 0 240 160"
      className="h-full w-full"
      aria-hidden="true"
      shapeRendering="geometricPrecision"
      style={pieceVars(prefix)}
    >
      <PieceDefs prefix={prefix} />
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

/** A piece filling the square whose top-left corner is (x, y) — the same fit as on the hero board. */
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
  return <BoardPiece kind={kind} side={side} x={x} y={y} size={size} />;
}

/** A piece (drawn in a size x size square) standing on `baseY` — e.g. the top edge of a board strip — centred on `cx`. */
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
    <BoardPiece
      kind={kind}
      side={side}
      x={cx - size / 2}
      y={baseY - size * PIECE_BASELINE}
      size={size}
    />
  );
}
