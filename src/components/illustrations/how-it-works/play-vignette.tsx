import type { CSSProperties } from "react";
import { ChessClock } from "../vignettes/chess-clock";
import { BoardFragment, PieceOnSquare, VignetteSvg } from "../vignettes/shared";

const S = 28;
const X = 24;
const Y = 18;

// Black's side on the top two rows, White's on the bottom two.
const PIECES = [
  { kind: "N", side: "b", col: 1, row: 0 },
  { kind: "K", side: "b", col: 2, row: 0 },
  { kind: "P", side: "b", col: 0, row: 1 },
  { kind: "P", side: "b", col: 3, row: 1 },
  { kind: "K", side: "w", col: 1, row: 3 },
  { kind: "N", side: "w", col: 2, row: 3 },
  { kind: "P", side: "w", col: 3, row: 2 },
] as const;

const CLOCK_SCALE = 0.56;

/** Both players' sides of a board, the player's pawn making its first move, and a small clock alongside. */
export function PlayVignette() {
  return (
    <VignetteSvg>
      <BoardFragment x={X} y={Y} cols={4} rows={4} size={S} />
      {PIECES.map((p) => (
        <PieceOnSquare key={`${p.col}-${p.row}`} kind={p.kind} side={p.side} x={X + p.col * S} y={Y + p.row * S} size={S} />
      ))}
      <g className="vg-slide" style={{ "--vg-dy": `${S}px`, animationDelay: "250ms" } as CSSProperties}>
        <PieceOnSquare kind="P" side="w" x={X} y={Y + 2 * S} size={S} />
      </g>

      {/* Same clock as everywhere else, scaled so its body sits at x 146–230 on the table line. */}
      <g transform={`translate(${146 - 45 * CLOCK_SCALE} ${130 - 130 * CLOCK_SCALE}) scale(${CLOCK_SCALE})`}>
        <ChessClock left={{ hand: -40 }} right={{ hand: 120, ring: true, running: true }} />
      </g>
    </VignetteSvg>
  );
}
