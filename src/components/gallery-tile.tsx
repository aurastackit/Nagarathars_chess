import type { GalleryPlaceholder } from "@/lib/gallery-placeholders";

export function GalleryPlaceholderTile({ id, glyph, from, to }: GalleryPlaceholder) {
  const patternId = `checker-${id}`;
  return (
    <svg viewBox="0 0 200 150" className="h-full w-full" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <pattern id={patternId} width="25" height="18.75" patternUnits="userSpaceOnUse">
          <rect width="25" height="18.75" fill={from} />
          <rect width="12.5" height="9.375" fill={to} opacity="0.55" />
          <rect x="12.5" y="9.375" width="12.5" height="9.375" fill={to} opacity="0.55" />
        </pattern>
      </defs>
      <rect width="200" height="150" fill={`url(#${patternId})`} />
      <text
        x="100"
        y="98"
        fontSize="72"
        textAnchor="middle"
        fill="rgba(255,255,255,0.32)"
        fontFamily="serif"
      >
        {glyph}
      </text>
    </svg>
  );
}
