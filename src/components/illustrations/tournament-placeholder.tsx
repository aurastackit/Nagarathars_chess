import type { SVGProps } from "react";
import { KingIcon } from "@/components/icons/chess-pieces";

type IllustrationProps = SVGProps<SVGSVGElement>;

/**
 * Branded card-cover graphic for a tournament (or, via `icon`, a class) with
 * no poster/banner image: a faint board check pattern behind a centered
 * piece. Defaults to the king; pass e.g. `icon={KnightIcon}` to reuse this
 * for a different card type without duplicating the whole graphic.
 */
export function TournamentPlaceholder({
  className = "",
  icon: Icon = KingIcon,
  ...props
}: IllustrationProps & { icon?: (props: IllustrationProps) => React.ReactElement }) {
  const cols = 10;
  const rows = 5;
  const cellW = 320 / cols;
  const cellH = 160 / rows;
  const cells: React.ReactNode[] = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if ((row + col) % 2 !== 0) continue;
      cells.push(
        <rect
          key={`${row}-${col}`}
          x={col * cellW}
          y={row * cellH}
          width={cellW}
          height={cellH}
          fill="var(--gold)"
          opacity="0.08"
        />
      );
    }
  }
  return (
    <span className="group inline-block h-full w-full">
      <svg
        viewBox="0 0 320 160"
        preserveAspectRatio="xMidYMid slice"
        className={`h-full w-full ${className}`}
        {...props}
      >
        <rect width="320" height="160" fill="var(--charcoal)" />
        {cells}
        <circle
          cx="160"
          cy="80"
          r="46"
          fill="none"
          stroke="var(--gold)"
          strokeWidth="1.6"
          opacity="0.3"
          className="origin-center transition-transform duration-300 ease-out group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
        />
        <g style={{ color: "var(--gold)" }}>
          <Icon
            width={56}
            height={56}
            x={132}
            y={52}
            strokeWidth={1.3}
            className="transition-transform duration-300 ease-out group-hover:-translate-y-1 motion-reduce:transition-none motion-reduce:group-hover:translate-y-0"
          />
        </g>
      </svg>
    </span>
  );
}
