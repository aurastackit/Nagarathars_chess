import { ChessClock } from "../vignettes/chess-clock";
import { BoardFragment, VignetteSvg } from "../vignettes/shared";

/**
 * The shared chess clock showing one time control: each face's gold arc is
 * the share of the hour each player gets (so Classical is nearly a full
 * circle, Blitz a sliver), drawn in once when the card plays.
 */
export function TimeControlVignette({ share }: { share: number }) {
  const hand = share * 360;
  return (
    <VignetteSvg>
      <BoardFragment x={0} y={130} cols={8} rows={1} size={30} />
      {/* The clock is the whole story here, so it's drawn larger, still standing on the strip (y = 130). */}
      <g transform="translate(120 130) scale(1.3) translate(-120 -130)">
        <ChessClock
          left={{ hand, arc: share, animate: true }}
          right={{ hand, arc: share, running: true, animate: true }}
        />
      </g>
    </VignetteSvg>
  );
}
