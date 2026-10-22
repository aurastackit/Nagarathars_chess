import { PIECES, PieceDefs, pieceVars } from "@/components/icons/staunton-pieces";
import {
  BOARD,
  FILES,
  PIECE_KINDS,
  RANKS,
  SQUARE,
  isDarkSquare,
  pieceSymbolId,
} from "./board-geometry";
import { LiveBoardPieces } from "./live-board-pieces";

/** Frame around the squares, in board units (1 unit ≈ 1px at full size); coordinates sit in it. */
const FRAME = 26;
const FRAMED = BOARD + FRAME * 2;

/**
 * The homepage hero's centerpiece: a real 8x8 board that plays
 * 1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5, then holds and loops.
 *
 * Everything static — squares, coordinates, and one <symbol> per piece kind
 * and side — is server-rendered here, so the client only hydrates the piece
 * layer (32 <use> references). First paint is always the static starting
 * position; LiveBoardPieces starts the moves only after the page has loaded.
 * Focusable so keyboard users can pause it (WCAG 2.2.2), like hovering does.
 * The focus outline is currentColor, so it follows whatever the hero's text
 * colour is.
 */
export function LiveBoard({ className = "" }: { className?: string }) {
  return (
    <div
      data-live-board
      tabIndex={0}
      className={`rounded-[10px] shadow-[0_24px_48px_rgba(0,0,0,0.18)] outline-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-current focus-visible:outline-solid ${className}`}
    >
      <svg
        viewBox={`${-FRAME} ${-FRAME} ${FRAMED} ${FRAMED}`}
        className="h-auto w-full"
        role="img"
        aria-label="Animated chessboard playing the opening 1. e4 e5 2. Knight f3 Knight c6 3. Bishop c4 Bishop c5"
        shapeRendering="geometricPrecision"
        style={pieceVars("lb")}
      >
        {/* Piece paint (gradients, highlight, contact-shadow blur), once for all 32 pieces. */}
        <PieceDefs prefix="lb" />
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
            (["w", "b"] as const).map((side) => {
              const Piece = PIECES[kind];
              return (
                <symbol
                  key={pieceSymbolId(kind, side)}
                  id={pieceSymbolId(kind, side)}
                  viewBox="0 0 100 100"
                  overflow="visible"
                >
                  <Piece side={side} />
                </symbol>
              );
            })
          )}
        </defs>

        <g aria-hidden="true">
          <rect
            x={-FRAME}
            y={-FRAME}
            width={FRAMED}
            height={FRAMED}
            rx={10}
            fill="var(--board-frame)"
          />
          {RANKS.flatMap((_, row) =>
            FILES.map((_, col) => (
              <rect
                key={`${col}-${row}`}
                x={col * SQUARE}
                y={row * SQUARE}
                width={SQUARE}
                height={SQUARE}
                fill={isDarkSquare(col, row) ? "var(--board-dark)" : "var(--board-light)"}
              />
            ))
          )}
          <rect
            x={-1.5}
            y={-1.5}
            width={BOARD + 3}
            height={BOARD + 3}
            fill="none"
            stroke="var(--gold-ink)"
            strokeWidth={1}
            vectorEffect="non-scaling-stroke"
          />
          {/* Coordinates live in the frame, off the squares: files along the
              bottom (high in the margin, clear of the chip that overlaps its
              lower edge), ranks down the left. */}
          <g fill="var(--board-coord)" fontSize="13" fontWeight="600" textAnchor="middle">
            {FILES.map((f, col) => (
              <text key={`file-${f}`} x={col * SQUARE + SQUARE / 2} y={BOARD + 14}>
                {f}
              </text>
            ))}
            {RANKS.map((r) => (
              <text key={`rank-${r}`} x={-FRAME / 2} y={(8 - r) * SQUARE + SQUARE / 2 + 4}>
                {r}
              </text>
            ))}
          </g>
        </g>

        <LiveBoardPieces />
      </svg>
    </div>
  );
}
