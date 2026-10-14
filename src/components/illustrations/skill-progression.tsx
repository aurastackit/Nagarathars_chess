import { KingIcon, KnightIcon, PawnIcon } from "@/components/icons/chess-pieces";

const STEPS = [
  { Icon: PawnIcon, label: "Beginner", body: "Piece movement & opening principles" },
  { Icon: KnightIcon, label: "Intermediate", body: "Tactics & middle-game strategy" },
  { Icon: KingIcon, label: "Advanced", body: "Endgame technique & preparation" },
];

export function SkillProgression({ className = "" }: { className?: string }) {
  return (
    <div className={`rounded-lg border border-border bg-card px-6 py-8 ${className}`}>
      <div className="grid grid-cols-3 items-start gap-2 sm:gap-6">
        {STEPS.map(({ Icon, label, body }, i) => (
          <div key={label} className="relative flex flex-col items-center text-center">
            {i > 0 && (
              <svg
                viewBox="0 0 100 10"
                preserveAspectRatio="none"
                className="absolute -left-1/2 top-7 hidden h-2 w-full text-gold/40 sm:block"
                aria-hidden="true"
              >
                <path
                  d="M0 5 H92 M84 1 L92 5 L84 9"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                />
              </svg>
            )}
            <span className="relative flex h-14 w-14 flex-none items-center justify-center rounded-full bg-gold/15 text-gold-ink">
              <Icon className="h-7 w-7" strokeWidth={1.1} />
            </span>
            <p className="h3 mt-3 text-foreground">{label}</p>
            <p className="text-small mt-1 text-muted">{body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
