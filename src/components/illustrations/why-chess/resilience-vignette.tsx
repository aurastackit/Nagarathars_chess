import type { CSSProperties } from "react";
import { BoardPiece } from "@/components/icons/chess-pieces";
import { BoardFragment, VignetteSvg } from "../vignettes/shared";

const KING = { x: 100, y: 58, size: 64 };
// The king tips over its base's left corner — the same point it rises back up around.
const PIVOT = { x: 117.6, y: 117.7 };

/** A toppled king (faint) and the same king standing back upright, with its rising arc. */
export function ResilienceVignette() {
  return (
    <VignetteSvg>
      <BoardFragment x={0} y={118} cols={8} rows={1} size={30} />

      <g opacity={0.3} transform={`rotate(-90 ${PIVOT.x} ${PIVOT.y})`}>
        <BoardPiece kind="K" side="w" {...KING} />
      </g>

      <path
        d="M60.5 103.3 A58.9 58.9 0 0 1 132 60.6"
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
