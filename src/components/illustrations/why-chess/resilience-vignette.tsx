import type { CSSProperties } from "react";
import { BoardPiece, PIECE_BASE_LEFT, PIECE_BASELINE } from "@/components/icons/staunton-pieces";
import { BoardFragment, VignetteSvg } from "../vignettes/shared";

const STRIP_TOP = 118;
const KING_SIZE = 62;
const KING = { x: 101, y: STRIP_TOP - 0.3 - KING_SIZE * PIECE_BASELINE, size: KING_SIZE };
// The king tips over its base's left corner — the same point it rises back up around.
const PIVOT = { x: KING.x + KING_SIZE * PIECE_BASE_LEFT, y: STRIP_TOP - 0.3 };
// The arc the crown sweeps: from the toppled king's cross to the upright one's.
const CROWN = { x: KING.x + KING_SIZE / 2, y: KING.y };
const R = Math.hypot(CROWN.x - PIVOT.x, CROWN.y - PIVOT.y);
const TOPPLED = { x: PIVOT.x + (CROWN.y - PIVOT.y), y: PIVOT.y - (CROWN.x - PIVOT.x) };
const ARC = `M${TOPPLED.x.toFixed(1)} ${TOPPLED.y.toFixed(1)} A${R.toFixed(1)} ${R.toFixed(1)} 0 0 1 ${CROWN.x.toFixed(1)} ${(CROWN.y + 1.2).toFixed(1)}`;

/** A toppled king (faint) and the same king standing back upright, with its rising arc. */
export function ResilienceVignette() {
  return (
    <VignetteSvg>
      <BoardFragment x={0} y={118} cols={8} rows={1} size={30} />

      <g opacity={0.3} transform={`rotate(-90 ${PIVOT.x} ${PIVOT.y})`}>
        <BoardPiece kind="K" side="w" {...KING} />
      </g>

      <path
        d={ARC}
        fill="none"
        stroke="var(--gold)"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeDasharray="0 6"
        className="vg-fade"
        style={{ animationDelay: "500ms" }}
      />

      <g
        className="vg-rotate"
        style={
          {
            transformBox: "view-box",
            transformOrigin: `${PIVOT.x}px ${PIVOT.y}px`,
            "--vg-from": "-90deg",
            animationDelay: "150ms",
          } as CSSProperties
        }
      >
        <BoardPiece kind="K" side="w" {...KING} />
      </g>
    </VignetteSvg>
  );
}
