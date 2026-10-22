"use client";

import { useEffect, useRef, useState } from "react";
import { MOVES, PIECES, SQUARE, START_SQUARES, pieceSymbolId, squareXY } from "./board-geometry";

const MOVE_STEP_MS = 1600;
const HOLD_MS = 3000;
const RESET_FADE_MS = 300;
const RESUME_DELAY_MS = 500;

function ArrowMark({ from, to }: { from: string; to: string }) {
  const a = squareXY(from);
  const b = squareXY(to);
  const x1 = a.x + SQUARE / 2;
  const y1 = a.y + SQUARE / 2;
  const x2 = b.x + SQUARE / 2;
  const y2 = b.y + SQUARE / 2;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  const pull = SQUARE * 0.32;
  return (
    <line
      x1={x1}
      y1={y1}
      x2={x2 - (dx / len) * pull}
      y2={y2 - (dy / len) * pull}
      stroke="var(--gold)"
      strokeWidth={4}
      strokeLinecap="round"
      markerEnd="url(#live-board-arrowhead)"
      opacity={0.85}
      className="animate-arrow-fade"
    />
  );
}

/**
 * The Live Board's moving layer (see LiveBoard). Its first render matches
 * the server's static starting position exactly; the move loop starts only
 * once the page has loaded and gone idle, so it never competes with loading.
 * Pauses on hover or keyboard focus of the board, when it's scrolled
 * off-screen, and when the tab is hidden; never runs under
 * prefers-reduced-motion.
 */
export function LiveBoardPieces() {
  const [squares, setSquares] = useState<Record<string, string>>(START_SQUARES);
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);
  const [piecesVisible, setPiecesVisible] = useState(true);
  const layerRef = useRef<SVGGElement>(null);

  useEffect(() => {
    const root = layerRef.current?.closest<HTMLElement>("[data-live-board]");
    if (!root || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const pauseReasons = new Set<string>();
    let timer: ReturnType<typeof setTimeout> | null = null;
    let idleHandle: number | null = null;
    let step = 0;
    let started = false;

    function clearTimer() {
      if (timer) clearTimeout(timer);
      timer = null;
    }

    function runStep(i: number) {
      step = i;
      if (pauseReasons.size > 0) return;
      if (i >= MOVES.length) {
        timer = setTimeout(() => {
          if (pauseReasons.size > 0) return;
          setPiecesVisible(false);
          timer = setTimeout(() => {
            setSquares(START_SQUARES);
            setLastMove(null);
            setPiecesVisible(true);
            step = 0;
            timer = setTimeout(() => runStep(0), MOVE_STEP_MS);
          }, RESET_FADE_MS);
        }, HOLD_MS);
        return;
      }
      const move = MOVES[i];
      setSquares((prev) => ({ ...prev, [move.pieceId]: move.to }));
      setLastMove({ from: move.from, to: move.to });
      timer = setTimeout(() => runStep(i + 1), MOVE_STEP_MS);
    }

    const pause = (reason: string) => {
      pauseReasons.add(reason);
      clearTimer();
    };
    const unpause = (reason: string) => {
      pauseReasons.delete(reason);
      if (!started || pauseReasons.size > 0) return;
      clearTimer();
      timer = setTimeout(() => runStep(step), RESUME_DELAY_MS);
    };

    const onEnter = () => pause("hover");
    const onLeave = () => unpause("hover");
    const onFocus = () => pause("focus");
    const onBlur = () => unpause("focus");
    const onVisibility = () => (document.hidden ? pause("hidden") : unpause("hidden"));
    root.addEventListener("mouseenter", onEnter);
    root.addEventListener("mouseleave", onLeave);
    root.addEventListener("focus", onFocus);
    root.addEventListener("blur", onBlur);
    document.addEventListener("visibilitychange", onVisibility);

    const observer =
      "IntersectionObserver" in window
        ? new IntersectionObserver(
            ([entry]) => (entry.isIntersecting ? unpause("offscreen") : pause("offscreen")),
            { threshold: 0.2 }
          )
        : null;
    observer?.observe(root);

    function start() {
      started = true;
      if (pauseReasons.size === 0) timer = setTimeout(() => runStep(0), MOVE_STEP_MS);
    }
    function startWhenIdle() {
      if ("requestIdleCallback" in window)
        idleHandle = requestIdleCallback(start, { timeout: 3000 });
      else timer = setTimeout(start, 500);
    }
    if (document.readyState === "complete") startWhenIdle();
    else window.addEventListener("load", startWhenIdle, { once: true });

    return () => {
      clearTimer();
      if (idleHandle !== null) cancelIdleCallback(idleHandle);
      window.removeEventListener("load", startWhenIdle);
      observer?.disconnect();
      root.removeEventListener("mouseenter", onEnter);
      root.removeEventListener("mouseleave", onLeave);
      root.removeEventListener("focus", onFocus);
      root.removeEventListener("blur", onBlur);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return (
    <g
      ref={layerRef}
      className="transition-opacity ease-out motion-reduce:transition-none"
      style={{ opacity: piecesVisible ? 1 : 0, transitionDuration: `${RESET_FADE_MS}ms` }}
    >
      {lastMove && (
        <>
          {[lastMove.from, lastMove.to].map((sq) => {
            const { x, y } = squareXY(sq);
            return (
              <rect
                key={sq}
                x={x}
                y={y}
                width={SQUARE}
                height={SQUARE}
                fill="var(--board-highlight)"
              />
            );
          })}
          <ArrowMark
            key={`${lastMove.from}-${lastMove.to}`}
            from={lastMove.from}
            to={lastMove.to}
          />
        </>
      )}
      {PIECES.map((piece) => {
        const { x, y } = squareXY(squares[piece.id]);
        return (
          <g
            key={piece.id}
            style={{ transform: `translate(${x}px, ${y}px)` }}
            className="transition-transform duration-[450ms] ease-out motion-reduce:transition-none"
          >
            <use
              href={`#${pieceSymbolId(piece.type, piece.side)}`}
              width={SQUARE}
              height={SQUARE}
            />
          </g>
        );
      })}
    </g>
  );
}
