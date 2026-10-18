import { BoardFragment, PieceOnSquare, VignetteSvg } from "../vignettes/shared";

const S = 26;
const X = 42;
const Y = 15;

const center = (col: number, row: number) => ({ x: X + col * S + S / 2, y: Y + row * S + S / 2 });

// Three legal knight hops from the bottom-left square, each drawn as its L.
const START = { col: 0, row: 4 };
const HOPS = [
  { col: 1, row: 2 },
  { col: 3, row: 1 },
  { col: 5, row: 0 },
];

function hopPath(from: { col: number; row: number }, to: { col: number; row: number }) {
  const a = center(from.col, from.row);
  const b = center(to.col, to.row);
  const vertical = Math.abs(to.row - from.row) === 2;
  return vertical ? `M${a.x} ${a.y} V${b.y} H${b.x}` : `M${a.x} ${a.y} H${b.x} V${b.y}`;
}

/** A knight with a dotted gold route of three numbered hops. */
export function PlanningVignette() {
  const stops = [START, ...HOPS];
  return (
    <VignetteSvg>
      <BoardFragment x={X} y={Y} cols={6} rows={5} size={S} />
      <PieceOnSquare kind="P" side="b" x={X + 4 * S} y={Y + 2 * S} size={S} />
      <PieceOnSquare kind="P" side="w" x={X + 2 * S} y={Y + 3 * S} size={S} />

      {HOPS.map((hop, i) => (
        <path
          key={i}
          d={hopPath(stops[i], hop)}
          fill="none"
          stroke="var(--gold)"
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="0 6"
          className="vg-fade"
          style={{ animationDelay: `${150 + i * 350}ms` }}
        />
      ))}

      <PieceOnSquare kind="N" side="w" x={X + START.col * S} y={Y + START.row * S} size={S} />

      {HOPS.map((hop, i) => {
        const c = center(hop.col, hop.row);
        return (
          <g key={i} className="vg-pop" style={{ animationDelay: `${350 + i * 350}ms` }}>
            <circle cx={c.x} cy={c.y} r={8.5} fill="var(--gold)" stroke="var(--charcoal)" strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
            <text
              x={c.x}
              y={c.y}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={10}
              fontWeight={700}
              fill="var(--charcoal)"
            >
              {i + 1}
            </text>
          </g>
        );
      })}
    </VignetteSvg>
  );
}
