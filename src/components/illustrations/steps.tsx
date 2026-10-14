import type { SVGProps } from "react";
import { KnightIcon } from "@/components/icons/chess-pieces";

type IllustrationProps = SVGProps<SVGSVGElement>;

/** Hover-only lift, disabled under prefers-reduced-motion — shared by every illustration in this file. */
const hoverLift =
  "transition-transform duration-300 ease-out group-hover:-translate-y-1 motion-reduce:transition-none motion-reduce:group-hover:translate-y-0";

export function StepBrowse({ className = "", ...props }: IllustrationProps) {
  return (
    <span className="group inline-block">
      <svg viewBox="0 0 64 64" className={`${hoverLift} ${className}`} {...props}>
        <rect x="10" y="14" width="30" height="7" rx="1.5" stroke="var(--border)" strokeWidth="1.8" fill="none" />
        <rect x="10" y="25" width="30" height="7" rx="1.5" stroke="var(--border)" strokeWidth="1.8" fill="none" />
        <rect x="10" y="36" width="20" height="7" rx="1.5" stroke="var(--border)" strokeWidth="1.8" fill="none" />
        <g className="transition-transform duration-300 ease-out group-hover:translate-x-1 group-hover:-translate-y-1 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0 motion-reduce:group-hover:translate-y-0">
          <circle cx="40" cy="38" r="10" fill="var(--card)" stroke="var(--gold)" strokeWidth="1.8" />
          <circle cx="40" cy="38" r="5.5" stroke="var(--gold-ink)" strokeWidth="1.6" fill="none" />
          <line x1="47.5" y1="45.5" x2="54" y2="52" stroke="var(--gold)" strokeWidth="2" strokeLinecap="round" />
        </g>
      </svg>
    </span>
  );
}

export function StepRegister({ className = "", ...props }: IllustrationProps) {
  return (
    <span className="group inline-block">
      <svg viewBox="0 0 64 64" className={`${hoverLift} ${className}`} {...props}>
        <rect x="16" y="10" width="32" height="44" rx="3" fill="var(--card)" stroke="var(--border)" strokeWidth="1.8" />
        <rect x="24" y="7" width="16" height="7" rx="2" fill="var(--card)" stroke="var(--border)" strokeWidth="1.8" />
        <line x1="22" y1="24" x2="42" y2="24" stroke="var(--border)" strokeWidth="1.8" strokeLinecap="round" />
        <line x1="22" y1="32" x2="42" y2="32" stroke="var(--border)" strokeWidth="1.8" strokeLinecap="round" />
        <g className="origin-center transition-transform duration-300 ease-out group-hover:scale-110 motion-reduce:transition-none motion-reduce:group-hover:scale-100">
          <circle cx="32" cy="43" r="9" fill="var(--gold)" opacity="0.15" />
          <path
            d="M27 43.2 30.5 46.7 38 38.5"
            fill="none"
            stroke="var(--gold-ink)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      </svg>
    </span>
  );
}

export function StepPlay({ className = "", ...props }: IllustrationProps) {
  return (
    <span className="group inline-block">
      <svg viewBox="0 0 64 64" className={`${hoverLift} ${className}`} {...props}>
        {[0, 1, 2].map((row) =>
          [0, 1, 2].map((col) => {
            const dark = (row + col) % 2 === 0;
            return (
              <rect
                key={`${row}-${col}`}
                x={14 + col * 9}
                y={34 + row * 9}
                width="9"
                height="9"
                fill={dark ? "var(--charcoal)" : "var(--card)"}
                opacity={dark ? 0.12 : 1}
                stroke="var(--border)"
                strokeWidth="1"
              />
            );
          })
        )}
        <path
          d="M18 28c4-2 7-6 7-11"
          fill="none"
          stroke="var(--gold)"
          strokeWidth="1.6"
          strokeDasharray="2.5 3"
          strokeLinecap="round"
          className="transition-opacity duration-300 ease-out opacity-0 group-hover:opacity-100 motion-reduce:opacity-100"
        />
        <KnightIcon
          className="transition-transform duration-300 ease-out group-hover:-translate-y-1.5 motion-reduce:transition-none motion-reduce:group-hover:translate-y-0"
          width={22}
          height={22}
          x={21}
          y={6}
          style={{ color: "var(--charcoal)" }}
        />
      </svg>
    </span>
  );
}
