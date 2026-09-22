import type { GalleryPlaceholder } from "@/lib/gallery-placeholders";
import { BishopIcon, KingIcon, KnightIcon, PawnIcon, QueenIcon, RookIcon } from "@/components/icons/chess-pieces";

const PIECE_ICONS = {
  king: KingIcon,
  queen: QueenIcon,
  rook: RookIcon,
  bishop: BishopIcon,
  knight: KnightIcon,
  pawn: PawnIcon,
};

export function GalleryPlaceholderTile({ id, piece, from, to }: GalleryPlaceholder) {
  const patternId = `checker-${id}`;
  const Icon = PIECE_ICONS[piece];
  return (
    <div className="relative h-full w-full overflow-hidden">
      <svg viewBox="0 0 200 150" className="absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <defs>
          <pattern id={patternId} width="25" height="18.75" patternUnits="userSpaceOnUse">
            <rect width="25" height="18.75" fill={from} />
            <rect width="12.5" height="9.375" fill={to} opacity="0.55" />
            <rect x="12.5" y="9.375" width="12.5" height="9.375" fill={to} opacity="0.55" />
          </pattern>
        </defs>
        <rect width="200" height="150" fill={`url(#${patternId})`} />
      </svg>
      <Icon
        aria-hidden="true"
        className="absolute inset-0 m-auto h-16 w-16 text-white/30"
        strokeWidth={0.8}
      />
    </div>
  );
}
