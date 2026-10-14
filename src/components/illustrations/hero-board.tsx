import type { SVGProps } from "react";
import { BishopIcon, KingIcon, PawnIcon } from "@/components/icons/chess-pieces";

type IllustrationProps = SVGProps<SVGSVGElement>;

/** An isometric 4x4 board tile grid, alternating fill, built from simple parallelograms. */
function IsoBoard() {
  const tiles: React.ReactNode[] = [];
  const tileW = 22;
  const tileH = 11;
  const originX = 100;
  const originY = 40;
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 4; col++) {
      const dark = (row + col) % 2 === 0;
      const x = originX + (col - row) * (tileW / 2);
      const y = originY + (col + row) * (tileH / 2);
      const points = [
        [x, y],
        [x + tileW / 2, y + tileH / 2],
        [x, y + tileH],
        [x - tileW / 2, y + tileH / 2],
      ]
        .map(([px, py]) => `${px},${py}`)
        .join(" ");
      tiles.push(
        <polygon
          key={`${row}-${col}`}
          points={points}
          fill={dark ? "var(--charcoal)" : "var(--card)"}
          opacity={dark ? 0.85 : 1}
          stroke="var(--border)"
          strokeWidth="0.5"
        />
      );
    }
  }
  return <g>{tiles}</g>;
}

/**
 * Isometric chessboard with a few pieces and a soft gold glow — the homepage
 * hero's decorative centerpiece. Hover gently intensifies the glow and lifts
 * the king; both are no-ops under prefers-reduced-motion.
 */
export function HeroBoard({ className = "", ...props }: IllustrationProps) {
  return (
    <span className="group inline-block">
      <svg viewBox="0 0 200 140" className={className} {...props}>
        <defs>
          <radialGradient id="hero-board-glow" cx="50%" cy="45%" r="55%">
            <stop offset="0%" stopColor="var(--gold)" stopOpacity="0.35" />
            <stop offset="100%" stopColor="var(--gold)" stopOpacity="0" />
          </radialGradient>
        </defs>
        <ellipse
          cx="100"
          cy="55"
          rx="85"
          ry="60"
          fill="url(#hero-board-glow)"
          className="origin-center transition-opacity duration-300 ease-out opacity-80 group-hover:opacity-100 motion-reduce:transition-none"
        />
        <IsoBoard />
        <g
          className="transition-transform duration-300 ease-out group-hover:-translate-y-1.5 motion-reduce:transition-none motion-reduce:group-hover:translate-y-0"
          style={{ color: "var(--gold-ink)" }}
        >
          <KingIcon width={26} height={26} x={87} y={16} strokeWidth={1.5} />
        </g>
        <g style={{ color: "var(--charcoal)" }}>
          <PawnIcon width={18} height={18} x={58} y={48} strokeWidth={1.6} />
          <BishopIcon width={18} height={18} x={122} y={52} strokeWidth={1.6} />
        </g>
      </svg>
    </span>
  );
}
