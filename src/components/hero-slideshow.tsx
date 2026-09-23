import {
  BishopIcon,
  KingIcon,
  KnightIcon,
  QueenIcon,
  RookIcon,
} from "@/components/icons/chess-pieces";

const SLIDES = [
  {
    Icon: KingIcon,
    from: "var(--charcoal)",
    to: "color-mix(in srgb, var(--charcoal), var(--gold) 25%)",
  },
  {
    Icon: QueenIcon,
    from: "color-mix(in srgb, var(--charcoal), var(--gold) 25%)",
    to: "color-mix(in srgb, var(--charcoal), var(--gold) 40%)",
  },
  { Icon: RookIcon, from: "var(--charcoal)", to: "color-mix(in srgb, var(--charcoal), black 20%)" },
  {
    Icon: BishopIcon,
    from: "color-mix(in srgb, var(--charcoal), var(--gold) 20%)",
    to: "var(--charcoal)",
  },
  {
    Icon: KnightIcon,
    from: "color-mix(in srgb, var(--charcoal), black 15%)",
    to: "color-mix(in srgb, var(--charcoal), var(--gold) 25%)",
  },
];

export function HeroSlideshow() {
  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
      {SLIDES.map(({ Icon, from, to }, i) => (
        <div
          key={i}
          className="hero-slide absolute inset-0 flex items-center justify-center"
          style={{
            background: `linear-gradient(135deg, ${from}, ${to})`,
            animationDelay: `${i * -5}s`,
          }}
        >
          <Icon className="hero-slide-glyph" style={{ color: "rgba(255, 255, 255, 0.14)" }} />
        </div>
      ))}
      <style>{`
        .hero-slide {
          opacity: 0;
          animation: heroCrossfade 25s infinite;
        }
        .hero-slide-glyph {
          width: min(46vw, 26rem);
          height: min(46vw, 26rem);
          stroke-width: 0.6;
        }
        @keyframes heroCrossfade {
          0% { opacity: 0; }
          4% { opacity: 1; }
          20% { opacity: 1; }
          24% { opacity: 0; }
          100% { opacity: 0; }
        }
        @media (prefers-reduced-motion: reduce) {
          .hero-slide { animation: none; opacity: 0; }
          .hero-slide:first-child { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
