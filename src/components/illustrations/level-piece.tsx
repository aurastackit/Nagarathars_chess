import { useId } from "react";
import {
  BoardPiece,
  PieceDefs,
  pieceVars,
  type PieceKind,
} from "@/components/icons/staunton-pieces";

/** One Staunton piece (the site's piece set) as a level marker — pawn, knight, king for beginner → advanced. */
export function LevelPiece({ kind, className = "" }: { kind: PieceKind; className?: string }) {
  const prefix = `lv${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      aria-hidden="true"
      shapeRendering="geometricPrecision"
      style={pieceVars(prefix)}
    >
      <PieceDefs prefix={prefix} />
      <BoardPiece kind={kind} side="w" x={6} y={3} size={52} />
    </svg>
  );
}
