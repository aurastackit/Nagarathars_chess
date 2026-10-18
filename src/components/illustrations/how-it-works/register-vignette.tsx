import { BoardFragment, PieceStanding, VignetteSvg } from "../vignettes/shared";

const CARD = { x: 64, y: 22, w: 124, h: 108 };
const FIELDS = [
  { y: 48, fill: 64 },
  { y: 70, fill: 46 },
  { y: 92, fill: 30 },
];

/** A registration form standing on the board's edge, its fields filling in and a gold check landing on top, with the player's pawn alongside. */
export function RegisterVignette() {
  const fx = CARD.x + 12;
  return (
    <VignetteSvg>
      <BoardFragment x={0} y={130} cols={8} rows={1} size={30} />
      <PieceStanding kind="P" side="w" cx={32} baseY={130} size={40} />

      <rect x={CARD.x} y={CARD.y} width={CARD.w} height={CARD.h} rx={8} fill="var(--card)" stroke="var(--walnut)" strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
      <rect x={fx} y={CARD.y + 12} width={56} height={7} rx={3.5} fill="var(--charcoal)" />

      {FIELDS.map((f, i) => (
        <g key={f.y}>
          <rect x={fx} y={f.y} width={30} height={4} rx={2} fill="var(--walnut)" opacity={0.55} />
          <rect x={fx} y={f.y + 7} width={100} height={12} rx={3} fill="var(--background)" stroke="var(--walnut)" strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
          <rect
            x={fx + 5}
            y={f.y + 11.5}
            width={f.fill}
            height={3.5}
            rx={1.75}
            fill="var(--charcoal)"
            opacity={0.75}
            className="vg-fade"
            style={{ animationDelay: `${150 + i * 220}ms` }}
          />
        </g>
      ))}
      <rect x={fx} y={CARD.y + CARD.h - 16} width={44} height={10} rx={5} fill="var(--gold)" />

      <g className="vg-pop" style={{ animationDelay: "850ms" }}>
        <circle cx={CARD.x + CARD.w - 4} cy={CARD.y + 4} r={15} fill="var(--gold)" stroke="var(--charcoal)" strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
        <path
          d={`M${CARD.x + CARD.w - 11} ${CARD.y + 4} l5 5 l9 -10`}
          fill="none"
          stroke="var(--charcoal)"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      </g>
    </VignetteSvg>
  );
}
