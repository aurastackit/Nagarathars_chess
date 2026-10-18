import type { PieceKind, PieceSide } from "@/components/icons/chess-pieces";

export type PieceDef = { id: string; type: PieceKind; side: PieceSide; square: string };
type Move = { pieceId: string; from: string; to: string };

export const SQUARE = 60;
export const BOARD = SQUARE * 8;
export const GLYPH = 52;
export const GLYPH_PAD = (SQUARE - GLYPH) / 2;

export const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"];
export const RANKS = [1, 2, 3, 4, 5, 6, 7, 8];
export const PIECE_KINDS: PieceKind[] = ["K", "Q", "R", "B", "N", "P"];
const BACK_RANK: PieceKind[] = ["R", "N", "B", "Q", "K", "B", "N", "R"];

/** Full standard starting position — nothing is ever captured in the short opening the board plays, so these 32 pieces are the complete, stable set for the whole loop. */
function buildStartingPieces(): PieceDef[] {
  const pieces: PieceDef[] = [];
  FILES.forEach((f, i) => {
    pieces.push({ id: `w-${BACK_RANK[i]}-${f}1`, type: BACK_RANK[i], side: "w", square: `${f}1` });
    pieces.push({ id: `w-P-${f}2`, type: "P", side: "w", square: `${f}2` });
    pieces.push({ id: `b-P-${f}7`, type: "P", side: "b", square: `${f}7` });
    pieces.push({ id: `b-${BACK_RANK[i]}-${f}8`, type: BACK_RANK[i], side: "b", square: `${f}8` });
  });
  return pieces;
}

export const PIECES = buildStartingPieces();
export const START_SQUARES: Record<string, string> = Object.fromEntries(
  PIECES.map((p) => [p.id, p.square])
);

/** 1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 — ids match buildStartingPieces. */
export const MOVES: Move[] = [
  { pieceId: "w-P-e2", from: "e2", to: "e4" },
  { pieceId: "b-P-e7", from: "e7", to: "e5" },
  { pieceId: "w-N-g1", from: "g1", to: "f3" },
  { pieceId: "b-N-b8", from: "b8", to: "c6" },
  { pieceId: "w-B-f1", from: "f1", to: "c4" },
  { pieceId: "b-B-f8", from: "f8", to: "c5" },
];

export function squareXY(square: string) {
  const col = square.charCodeAt(0) - 97;
  const row = 8 - Number(square[1]);
  return { x: col * SQUARE, y: row * SQUARE, col, row };
}

export function isDarkSquare(col: number, row: number) {
  return (col + row) % 2 === 1;
}

/** id of the shared <symbol> for one piece kind + side, defined once in the board's <defs>. */
export const pieceSymbolId = (kind: PieceKind, side: PieceSide) => `lb-${kind}-${side}`;
