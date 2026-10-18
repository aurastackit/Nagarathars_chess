import { BoardPiece } from "@/components/icons/chess-pieces";
import {
  BOARD,
  FILES,
  GLYPH,
  PIECE_KINDS,
  RANKS,
  SQUARE,
  isDarkSquare,
  pieceSymbolId,
} from "./board-geometry";
import { LiveBoardPieces } from "./live-board-pieces";

/**
 * The homepage hero's centerpiece: a real 8x8 board that plays
 * 1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5, then holds and loops.
 *
 * Everything static — squares, coordinates, and one <symbol> per piece kind
 * and side — is server-rendered here, so the client only hydrates the piece
 * layer (32 <use> references). First paint is always the static starting
 * position; LiveBoardPieces starts the moves only after the page has loaded.
 * Focusable so keyboard users can pause it (WCAG 2.2.2), like hovering does.
 */
export function LiveBoard({ className = "" }: { className?: string }) {
  return (
    <div
      data-live-board
      tabIndex={0}
      className={`rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-gold/70 focus-visible:ring-offset-2 focus-visible:ring-offset-charcoal ${className}`}
    >
      <svg
        viewBox={`0 0 ${BOARD} ${BOARD}`}
        className="h-auto w-full"
        role="img"
        aria-label="Animated chessboard playing the opening 1. e4 e5 2. Knight f3 Knight c6 3. Bishop c4 Bishop c5"
      >
        <defs>
          <marker
            id="live-board-arrowhead"
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="6.5"
            markerHeight="6.5"
            orient="auto-start-reverse"
          >
            <path d="M0 0L10 5L0 10Z" fill="var(--gold)" />
          </marker>
          {PIECE_KINDS.flatMap((kind) =>
            (["w", "b"] as const).map((side) => (
              <symbol key={pieceSymbolId(kind, side)} id={pieceSymbolId(kind, side)} overflow="visible">
                <BoardPiece kind={kind} side={side} size={GLYPH} />
              </symbol>
            ))
          )}
        </defs>

        <g aria-hidden="true">
          {RANKS.flatMap((_, row) =>
            FILES.map((_, col) => (
              <rect
                key={`${col}-${row}`}
                x={col * SQUARE}
                y={row * SQUARE}
                width={SQUARE}
                height={SQUARE}
                fill={isDarkSquare(col, row) ? "var(--walnut)" : "var(--background)"}
              />
            ))
          )}
          {FILES.map((f, col) => {
            const row = 7;
            return (
              <text
                key={`file-${f}`}
                x={col * SQUARE + 6}
                y={row * SQUARE + SQUARE - 6}
                fontSize="11"
                fill={isDarkSquare(col, row) ? "var(--background)" : "var(--walnut)"}
                opacity={0.55}
              >
                {f}
              </text>
            );
          })}
          {RANKS.map((r) => {
            const row = 8 - r;
            return (
              <text
                key={`rank-${r}`}
                x={5}
                y={row * SQUARE + 14}
                fontSize="11"
                fill={isDarkSquare(0, row) ? "var(--background)" : "var(--walnut)"}
                opacity={0.55}
              >
                {r}
              </text>
            );
          })}
        </g>

        <LiveBoardPieces />
      </svg>
    </div>
  );
}
