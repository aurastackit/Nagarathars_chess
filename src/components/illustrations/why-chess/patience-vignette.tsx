import { ChessClock } from "../vignettes/chess-clock";
import { BoardFragment, PieceStanding, VignetteSvg } from "../vignettes/shared";

/** A chess clock on the board's edge: left side stopped, right side running (gold). */
export function PatienceVignette() {
  return (
    <VignetteSvg>
      <BoardFragment x={0} y={130} cols={8} rows={1} size={30} />
      <PieceStanding kind="P" side="w" cx={15} baseY={130} size={26} />
      <PieceStanding kind="P" side="b" cx={225} baseY={130} size={26} />
      <ChessClock left={{ hand: -50 }} right={{ hand: 140, ring: true, running: true, animate: true }} />
    </VignetteSvg>
  );
}
