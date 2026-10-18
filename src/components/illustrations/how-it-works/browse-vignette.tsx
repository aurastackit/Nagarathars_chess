import { BoardFragment, PieceStanding, VignetteSvg } from "../vignettes/shared";

const CAL = { x: 40, y: 36, w: 124, h: 94 };
const CELL = 13;
const GAP = 3;
const GRID_X = CAL.x + (CAL.w - (7 * CELL + 6 * GAP)) / 2;
const GRID_Y = 64;
const EVENT = { col: 4, row: 2 };

/** A desk calendar on the board's edge — its date grid is a little chessboard — with one tournament date picked out in gold, and the player's pawn beside it. */
export function BrowseVignette() {
  const ex = GRID_X + EVENT.col * (CELL + GAP);
  const ey = GRID_Y + EVENT.row * (CELL + GAP);
  return (
    <VignetteSvg>
      <BoardFragment x={0} y={130} cols={8} rows={1} size={30} />

      <rect x={CAL.x} y={CAL.y} width={CAL.w} height={CAL.h} rx={8} fill="var(--card)" stroke="var(--walnut)" strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
      <rect x={CAL.x} y={CAL.y} width={CAL.w} height={22} rx={8} fill="var(--charcoal)" />
      <rect x={CAL.x} y={CAL.y + 12} width={CAL.w} height={10} fill="var(--charcoal)" />
      <rect x={CAL.x + 12} y={CAL.y + 8} width={34} height={5} rx={2.5} fill="var(--background)" opacity={0.85} />
      {[CAL.x + 22, CAL.x + CAL.w - 28].map((x) => (
        <rect key={x} x={x} y={CAL.y - 8} width={6} height={15} rx={3} fill="var(--gold)" stroke="var(--charcoal)" strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
      ))}

      {Array.from({ length: 28 }).map((_, i) => {
        const col = i % 7;
        const row = Math.floor(i / 7);
        return (
          <rect
            key={i}
            x={GRID_X + col * (CELL + GAP)}
            y={GRID_Y + row * (CELL + GAP)}
            width={CELL}
            height={CELL}
            rx={2}
            fill={(col + row) % 2 === 1 ? "var(--walnut)" : "var(--background)"}
            fillOpacity={(col + row) % 2 === 1 ? 0.3 : 1}
          />
        );
      })}

      <path
        d={`M188 92 C 170 78, 150 82, ${ex + CELL + 4} ${ey + CELL / 2}`}
        fill="none"
        stroke="var(--gold)"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeDasharray="0 6"
        className="vg-fade"
        style={{ animationDelay: "450ms" }}
      />
      <g className="vg-pop" style={{ animationDelay: "200ms" }}>
        <rect x={ex - 1} y={ey - 1} width={CELL + 2} height={CELL + 2} rx={3} fill="var(--gold)" stroke="var(--charcoal)" strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
      </g>

      <PieceStanding kind="P" side="w" cx={202} baseY={130} size={46} />
    </VignetteSvg>
  );
}
