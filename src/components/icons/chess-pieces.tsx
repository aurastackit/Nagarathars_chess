import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.4,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

/** Shared cone body + plinth used by every piece except the rook. */
function PieceBody() {
  return (
    <>
      <path d="M9.3 11h5.4l1 6.2H8.3l1-6.2Z" />
      <path d="M7.6 17.2h8.8v1.7H7.6z" />
      <path d="M8 20.7h8" />
    </>
  );
}

export function PawnIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="7.4" r="2.3" />
      <PieceBody />
    </svg>
  );
}

export function KingIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 3.3v3.6M10.2 5.1h3.6" />
      <circle cx="12" cy="9.3" r="1.7" />
      <PieceBody />
    </svg>
  );
}

export function QueenIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M8 9.3 8.9 5l1.6 2.2L12 4l1.5 3.2L15.1 5l.9 4.3H8Z" />
      <circle cx="8.9" cy="5" r="0.55" fill="currentColor" stroke="none" />
      <circle cx="12" cy="4" r="0.55" fill="currentColor" stroke="none" />
      <circle cx="15.1" cy="5" r="0.55" fill="currentColor" stroke="none" />
      <PieceBody />
    </svg>
  );
}

export function RookIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="7.6" y="6.2" width="1.9" height="3.3" />
      <rect x="11.05" y="6.2" width="1.9" height="3.3" />
      <rect x="14.5" y="6.2" width="1.9" height="3.3" />
      <path d="M7.6 9.5h8.8v1.7H7.6z" />
      <path d="M8 11.2h8l.8 6h-9.6l.8-6Z" />
      <path d="M7.6 17.2h8.8v1.7H7.6z" />
      <path d="M8 20.7h8" />
    </svg>
  );
}

export function BishopIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="4.1" r="0.7" fill="currentColor" stroke="none" />
      <ellipse cx="12" cy="7.6" rx="2.3" ry="3" />
      <path d="M10.4 5.9 13.5 9.2" />
      <PieceBody />
    </svg>
  );
}

export function KnightIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M8.6 11c-.3-1.6-.1-3 .6-4.2.9-1.6 2.6-2.6 4.4-2.5 1.3.1 2.2.9 2.2 1.9 0 .8-.6 1.4-1.4 1.4-.5 0-.9-.2-1.2-.6" />
      <path d="M14.4 5.6c1.3.2 2.4 1.2 2.7 2.6.3 1.3-.2 2.4-1.1 3.1-.6.5-.9 1.1-.7 1.8l.9 3.3" />
      <circle cx="10.9" cy="7.6" r="0.45" fill="currentColor" stroke="none" />
      <PieceBody />
    </svg>
  );
}

export function TrophyIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M7 4h10v4.2c0 2.7-2.2 4.8-5 4.8s-5-2.1-5-4.8V4Z" />
      <path d="M7 5.5H4.8C4.4 5.5 4 5.9 4 6.3v.7c0 1.7 1.3 3.1 3 3.3" />
      <path d="M17 5.5h2.2c.4 0 .8.4.8.8v.7c0 1.7-1.3 3.1-3 3.3" />
      <path d="M12 13v3.2M9 20.5h6M9.6 16.9h4.8l.5 3.6H9.1l.5-3.6Z" />
    </svg>
  );
}
