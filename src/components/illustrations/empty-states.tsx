import type { SVGProps } from "react";
import { PawnIcon, TrophyIcon } from "@/components/icons/chess-pieces";

type IllustrationProps = SVGProps<SVGSVGElement>;

const hoverFade =
  "transition-opacity duration-300 ease-out group-hover:opacity-100 motion-reduce:transition-none";

export function EmptyClasses({ className = "", ...props }: IllustrationProps) {
  return (
    <span className="group inline-block">
      <svg viewBox="0 0 80 80" className={className} {...props}>
        <path
          d="M14 24 40 14l26 10-26 10Z"
          fill="none"
          stroke="var(--border)"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        <path d="M22 29v14c0 4 8 8 18 8s18-4 18-8V29" fill="none" stroke="var(--border)" strokeWidth="1.8" />
        <path d="M66 24v14" stroke="var(--border)" strokeWidth="1.8" strokeLinecap="round" />
        <circle cx="66" cy="42" r="2" fill="var(--border)" opacity="0.7" className={`opacity-50 ${hoverFade}`} />
        <PawnIcon
          width={18}
          height={18}
          x={31}
          y={33}
          style={{ color: "var(--gold-ink)" }}
          className="opacity-70 transition-transform duration-300 ease-out group-hover:-translate-y-1 motion-reduce:transition-none motion-reduce:group-hover:translate-y-0"
        />
      </svg>
    </span>
  );
}

export function EmptyGallery({ className = "", ...props }: IllustrationProps) {
  return (
    <span className="group inline-block">
      <svg viewBox="0 0 80 80" className={className} {...props}>
        <rect
          x="12"
          y="18"
          width="56"
          height="44"
          rx="4"
          fill="none"
          stroke="var(--border)"
          strokeWidth="1.8"
          strokeDasharray="4 4"
        />
        <circle cx="26" cy="32" r="5" fill="none" stroke="var(--gold)" strokeWidth="1.8" />
        <path
          d="M12 54 28 42l10 8 12-12 18 18"
          fill="none"
          stroke="var(--border)"
          strokeWidth="1.8"
          strokeLinejoin="round"
          strokeLinecap="round"
          className="transition-transform duration-300 ease-out group-hover:translate-y-[-2px] motion-reduce:transition-none motion-reduce:group-hover:translate-y-0"
        />
      </svg>
    </span>
  );
}

export function EmptyTournaments({ className = "", ...props }: IllustrationProps) {
  return (
    <span className="group inline-block">
      <svg viewBox="0 0 80 80" className={className} {...props}>
        <circle cx="40" cy="40" r="26" fill="none" stroke="var(--border)" strokeWidth="1.8" strokeDasharray="4 4" />
        <TrophyIcon
          width={30}
          height={30}
          x={25}
          y={25}
          style={{ color: "var(--gold-ink)" }}
          className="opacity-70 transition-transform duration-300 ease-out group-hover:-translate-y-1 motion-reduce:transition-none motion-reduce:group-hover:translate-y-0"
        />
      </svg>
    </span>
  );
}
