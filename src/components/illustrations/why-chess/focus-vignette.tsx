import { BoardFragment, PieceOnSquare, VignetteSvg } from "../vignettes/shared";

const S = 28;
const X = 64;
const Y = 24;
const SPOT = { col: 2, row: 1 };

const CONTEXT_PIECES = [
  { kind: "P", side: "b", col: 1, row: 0 },
  { kind: "B", side: "b", col: 3, row: 2 },
  { kind: "N", side: "w", col: 0, row: 2 },
  { kind: "P", side: "w", col: 2, row: 3 },
] as const;

/** A 4x4 patch of board, dimmed, with one gold-spotlit square lit from the upper left. */
export function FocusVignette() {
  const sx = X + SPOT.col * S;
  const sy = Y + SPOT.row * S;
  return (
    <VignetteSvg>
      <BoardFragment x={X} y={Y} cols={4} rows={4} size={S} />
      {CONTEXT_PIECES.map((p) => (
        <PieceOnSquare
          key={`${p.col}-${p.row}`}
          kind={p.kind}
          side={p.side}
          x={X + p.col * S}
          y={Y + p.row * S}
          size={S}
        />
      ))}

      <g className="vg-fade">
        {Array.from({ length: 16 }).map((_, i) => {
          const col = i % 4;
          const row = Math.floor(i / 4);
          if (col === SPOT.col && row === SPOT.row) return null;
          return (
            <rect
              key={i}
              x={X + col * S}
              y={Y + row * S}
              width={S}
              height={S}
              fill="var(--charcoal)"
              fillOpacity={0.5}
            />
          );
        })}
      </g>

      <polygon
        points={`10,0 34,0 ${sx + S},${sy + S} ${sx},${sy + S}`}
        fill="var(--gold)"
        opacity={0.16}
        className="vg-fade"
        style={{ animationDelay: "250ms" }}
      />
      <g className="vg-pop" style={{ animationDelay: "350ms" }}>
        <rect
          x={sx}
          y={sy}
          width={S}
          height={S}
          fill="var(--gold)"
          fillOpacity={0.35}
          stroke="var(--gold)"
          strokeWidth={2.5}
          vectorEffect="non-scaling-stroke"
        />
      </g>
      <PieceOnSquare kind="Q" side="w" x={sx} y={sy} size={S} />
    </VignetteSvg>
  );
}
