import type { SVGProps } from "react";
import { KnightIcon, PawnIcon } from "@/components/icons/chess-pieces";

type IllustrationProps = SVGProps<SVGSVGElement>;

const hoverLift =
  "transition-transform duration-300 ease-out group-hover:-translate-y-1 motion-reduce:transition-none motion-reduce:group-hover:translate-y-0";

export function BenefitFocus({ className = "", ...props }: IllustrationProps) {
  return (
    <span className="group inline-block">
      <svg viewBox="0 0 64 64" className={`${hoverLift} ${className}`} {...props}>
        <circle cx="32" cy="32" r="18" fill="none" stroke="var(--border)" strokeWidth="1.8" />
        <circle cx="32" cy="32" r="11" fill="none" stroke="var(--gold)" strokeWidth="1.8" />
        <circle
          cx="32"
          cy="32"
          r="4.5"
          fill="var(--gold)"
          className="origin-center transition-transform duration-300 ease-out group-hover:scale-125 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
        />
        <PawnIcon width={16} height={16} x={24} y={24} style={{ color: "var(--card)" }} strokeWidth={2} />
      </svg>
    </span>
  );
}

export function BenefitPlanning({ className = "", ...props }: IllustrationProps) {
  return (
    <span className="group inline-block">
      <svg viewBox="0 0 64 64" className={`${hoverLift} ${className}`} {...props}>
        <path
          d="M10 46c8 2 14-2 18-8s4-14 12-16"
          fill="none"
          stroke="var(--border)"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeDasharray="1 5.5"
        />
        <circle cx="10" cy="46" r="3" fill="var(--gold-ink)" />
        <circle cx="24" cy="40" r="2.3" fill="var(--border)" stroke="var(--card)" />
        <circle cx="32" cy="27" r="2.3" fill="var(--border)" stroke="var(--card)" />
        <g className="transition-transform duration-300 ease-out group-hover:translate-x-1 group-hover:-translate-y-1 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0 motion-reduce:group-hover:translate-y-0">
          <KnightIcon width={20} height={20} x={30} y={8} style={{ color: "var(--charcoal)" }} />
        </g>
      </svg>
    </span>
  );
}

export function BenefitPatience({ className = "", ...props }: IllustrationProps) {
  return (
    <span className="group inline-block">
      <svg viewBox="0 0 64 64" className={`${hoverLift} ${className}`} {...props}>
        <path
          d="M20 12h24M20 52h24M20 12c0 10 8 12 8 20s-8 10-8 20M44 12c0 10-8 12-8 20s8 10 8 20"
          fill="none"
          stroke="var(--border)"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        <path
          d="M25 15c1.5 6 5.5 8 7 9 1.5-1 5.5-3 7-9"
          fill="var(--gold)"
          opacity="0.18"
          stroke="none"
        />
        <g className="origin-center transition-transform duration-300 ease-out group-hover:rotate-180 motion-reduce:transition-none motion-reduce:group-hover:rotate-0">
          <circle cx="32" cy="48" r="2" fill="var(--gold-ink)" />
        </g>
      </svg>
    </span>
  );
}
