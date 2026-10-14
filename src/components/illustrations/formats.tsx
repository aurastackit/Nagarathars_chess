import type { SVGProps } from "react";

type IllustrationProps = SVGProps<SVGSVGElement>;

const hoverSpin =
  "transition-transform duration-300 ease-out group-hover:rotate-[8deg] motion-reduce:transition-none motion-reduce:group-hover:rotate-0";

/** A clock face with a shaded pie-slice showing how much of the format's time budget has elapsed. */
function ClockFace({ sweepDeg, children }: { sweepDeg: number; children?: React.ReactNode }) {
  const rad = (sweepDeg - 90) * (Math.PI / 180);
  const x = 32 + 18 * Math.cos(rad);
  const y = 32 + 18 * Math.sin(rad);
  const largeArc = sweepDeg > 180 ? 1 : 0;
  return (
    <>
      <circle cx="32" cy="32" r="18" fill="var(--card)" stroke="var(--border)" strokeWidth="1.8" />
      <path
        d={`M32 32 L32 14 A18 18 0 ${largeArc} 1 ${x} ${y} Z`}
        fill="var(--gold)"
        opacity="0.18"
        stroke="none"
      />
      <circle cx="32" cy="32" r="1.6" fill="var(--charcoal)" />
      <line x1="32" y1="32" x2="32" y2="18" stroke="var(--charcoal)" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="32" y1="32" x2={x} y2={y} stroke="var(--gold-ink)" strokeWidth="1.8" strokeLinecap="round" />
      {children}
    </>
  );
}

export function FormatClassical({ className = "", ...props }: IllustrationProps) {
  return (
    <span className="group inline-block">
      <svg viewBox="0 0 64 64" className={`${hoverSpin} ${className}`} {...props}>
        <ClockFace sweepDeg={300} />
      </svg>
    </span>
  );
}

export function FormatRapid({ className = "", ...props }: IllustrationProps) {
  return (
    <span className="group inline-block">
      <svg viewBox="0 0 64 64" className={`${hoverSpin} ${className}`} {...props}>
        <ClockFace sweepDeg={140} />
      </svg>
    </span>
  );
}

export function FormatBlitz({ className = "", ...props }: IllustrationProps) {
  return (
    <span className="group inline-block">
      <svg viewBox="0 0 64 64" className={`${hoverSpin} ${className}`} {...props}>
        <ClockFace sweepDeg={45} />
        <circle cx="48" cy="16" r="9" fill="var(--charcoal)" />
        <path
          d="M49.5 11 46 17h2.6l-1.6 6 5-7.5h-2.7l1.6-4.5Z"
          fill="var(--gold)"
          strokeLinejoin="round"
          className="transition-transform duration-200 ease-out group-hover:scale-110 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
          style={{ transformOrigin: "48px 16px" }}
        />
      </svg>
    </span>
  );
}
