const SLIDES = [
  { glyph: "♔", from: "#16294f", to: "#234a7c" },
  { glyph: "♕", from: "#234a7c", to: "#2f5c92" },
  { glyph: "♖", from: "#16294f", to: "#3a3a3a" },
  { glyph: "♗", from: "#234a7c", to: "#16294f" },
  { glyph: "♘", from: "#1c2430", to: "#234a7c" },
];

export function HeroSlideshow() {
  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
      {SLIDES.map((s, i) => (
        <div
          key={i}
          className="hero-slide absolute inset-0 flex items-center justify-center"
          style={{
            background: `linear-gradient(135deg, ${s.from}, ${s.to})`,
            animationDelay: `${i * -5}s`,
          }}
        >
          <span className="hero-slide-glyph select-none">{s.glyph}</span>
        </div>
      ))}
      <style>{`
        .hero-slide {
          opacity: 0;
          animation: heroCrossfade 25s infinite;
        }
        .hero-slide-glyph {
          font-size: min(46vw, 26rem);
          line-height: 1;
          color: rgba(255, 255, 255, 0.14);
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
