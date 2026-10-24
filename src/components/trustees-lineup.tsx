"use client";

import {
  Fragment,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import Image from "next/image";
import type { CommitteeMember } from "@/data/committee";
import { MapPinIcon } from "@/components/icons/misc";

const REDUCED = "(prefers-reduced-motion: reduce)";

function subscribeReduced(onChange: () => void) {
  const mq = window.matchMedia(REDUCED);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

const pad = (n: number) => String(n).padStart(2, "0");

/** Each change is a chess move, picked by the target index. */
const MOVES = ["rook", "bishop", "knight", "queen", "king"] as const;
type Move = (typeof MOVES)[number];

/** The move's path (line, then arrowhead) in a 100×100 box, drawn for a move to the right. */
const TRACE: Record<Move, [string, string]> = {
  rook: ["M10 50 H90", "M82 43 L90 50 L82 57"],
  bishop: ["M15 85 L85 15", "M74 16 L85 15 L84 26"],
  knight: ["M30 85 V30 Q30 18 45 18 H78", "M70 11 L78 18 L70 25"],
  queen: ["M50 88 V12", "M43 20 L50 12 L57 20"],
  king: ["M50 64 V36", "M43 44 L50 36 L57 44"],
};

/**
 * The /about trustees: one trustee in the spotlight card (portrait, name,
 * place, the site's message, counter and controls), and under it a straight
 * rail of all seven on alternating board squares. Each change plays a chess
 * move (rook, bishop, knight, queen, king in turn). Advances every 6s (driven
 * by the progress line's CSS animation), paused on hover, keyboard focus or
 * the pause button; never with reduced motion, which also swaps instantly.
 */
export function TrusteesLineup({ members }: { members: CommitteeMember[] }) {
  const count = members.length;
  const [index, setIndex] = useState(0);
  const [dir, setDir] = useState(1);
  const [prev, setPrev] = useState<number | null>(null);
  const [changed, setChanged] = useState(false);
  const [focusIndex, setFocusIndex] = useState(0);
  const [stopped, setStopped] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  // Server and first paint assume reduced motion, so nothing advances before hydration.
  const reduced = useSyncExternalStore(
    subscribeReduced,
    () => window.matchMedia(REDUCED).matches,
    () => true
  );
  const railRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const running = !reduced && !stopped && !hovered && !focused;
  const animate = changed && !reduced;

  function go(next: number, direction = next > index ? 1 : -1) {
    const n = (next + count) % count;
    if (n === index) return;
    setDir(direction);
    setPrev(reduced ? null : index);
    setChanged(true);
    setIndex(n);
    setFocusIndex(n);
  }

  // Keep the active square in view on narrow screens without scrolling the page.
  useEffect(() => {
    const rail = railRef.current;
    const tab = tabRefs.current[index];
    if (!rail || !tab || rail.scrollWidth <= rail.clientWidth) return;
    rail.scrollTo({
      left: tab.offsetLeft - (rail.clientWidth - tab.offsetWidth) / 2,
      behavior: reduced ? "auto" : "smooth",
    });
  }, [index, reduced]);

  function onRailKey(e: KeyboardEvent<HTMLDivElement>) {
    let n = focusIndex;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") n = (focusIndex + 1) % count;
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") n = (focusIndex - 1 + count) % count;
    else if (e.key === "Home") n = 0;
    else if (e.key === "End") n = count - 1;
    else return;
    e.preventDefault();
    setFocusIndex(n);
    tabRefs.current[n]?.focus();
  }

  const member = members[index];
  const move = MOVES[index % MOVES.length];
  const moveStyle = { "--s": dir } as CSSProperties;

  return (
    <div
      className="mx-auto max-w-4xl"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={(e) => setFocused(e.target.matches(":focus-visible"))}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocused(false);
      }}
    >
      <div
        id="trustee-spotlight"
        role="tabpanel"
        aria-live="polite"
        aria-labelledby={`trustee-tab-${member.id}`}
        className="flex flex-col items-center gap-6 overflow-hidden rounded-lg border border-border bg-background p-6 text-center shadow-sm sm:flex-row sm:gap-10 sm:p-8 sm:text-left"
      >
        <div
          className="relative size-56 flex-none rounded-full ring-1 ring-gold sm:size-64"
          style={moveStyle}
        >
          {animate && move === "queen" && (
            <span key={`glow-${index}`} className="trustee-glow" aria-hidden="true" />
          )}
          {animate && (
            <svg
              key={`trace-${index}`}
              viewBox="0 0 100 100"
              className="pointer-events-none absolute -inset-[14%] size-[128%] overflow-visible"
              style={{
                transform:
                  dir < 0 && move !== "queen" && move !== "king" ? "scaleX(-1)" : undefined,
              }}
              fill="none"
              stroke="var(--gold)"
              strokeWidth={1.2}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d={TRACE[move][0]} pathLength={100} className="trustee-trace" />
              <path d={TRACE[move][1]} className="trustee-trace-head" />
            </svg>
          )}
          {prev !== null && (
            <Portrait
              key={`prev-${index}`}
              member={members[prev]}
              className={`trustee-out-${move}`}
              onAnimationEnd={() => setPrev(null)}
            />
          )}
          <Portrait
            key={member.id}
            member={member}
            className={animate ? `trustee-in-${move}` : undefined}
            label
          />
        </div>

        <div className="flex min-w-0 flex-1 flex-col self-stretch sm:justify-center">
          {/* Every trustee's text is laid out invisibly in the same cell, so the card keeps the tallest height. */}
          <div className="grid">
            {members.map((m) => (
              <TrusteeText key={m.id} member={m} className="invisible" hidden />
            ))}
            <TrusteeText key={member.id} member={member} animate={animate} />
          </div>

          <div className="mt-5 flex items-center justify-center gap-3 sm:justify-between">
            <p className="text-sm font-semibold tabular-nums tracking-wider text-gold-ink">
              {pad(index + 1)} / {pad(count)}
            </p>
            <div className="flex items-center gap-2">
              <ControlButton label="Previous trustee" onClick={() => go(index - 1, -1)}>
                <path d="M15 5l-7 7 7 7M8 12h12" />
              </ControlButton>
              {!reduced && (
                <ControlButton
                  label={stopped ? "Play slideshow" : "Pause slideshow"}
                  onClick={() => setStopped((s) => !s)}
                >
                  {stopped ? <path d="M8 5l11 7-11 7Z" /> : <path d="M9 5v14M15 5v14" />}
                </ControlButton>
              )}
              <ControlButton label="Next trustee" onClick={() => go(index + 1, 1)}>
                <path d="M9 5l7 7-7 7M16 12H4" />
              </ControlButton>
            </div>
          </div>
        </div>
      </div>

      <div
        ref={railRef}
        className="relative mt-3 snap-x snap-mandatory overflow-x-auto px-2 pb-1 pt-2 [scrollbar-width:thin]"
      >
        <div className="mx-auto w-max">
          <div role="tablist" aria-label="Trustees" onKeyDown={onRailKey} className="flex gap-3">
            {members.map((m, i) => {
              const active = i === index;
              return (
                <button
                  key={m.id}
                  ref={(el) => {
                    tabRefs.current[i] = el;
                  }}
                  type="button"
                  role="tab"
                  id={`trustee-tab-${m.id}`}
                  aria-selected={active}
                  aria-controls="trustee-spotlight"
                  aria-label={`${m.name}, ${m.place}`}
                  tabIndex={i === focusIndex ? 0 : -1}
                  onClick={() => go(i)}
                  className={`flex snap-center flex-col items-center rounded-sm transition-opacity focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold-ink ${active ? "" : "opacity-70 hover:opacity-100"}`}
                >
                  <span
                    className={`block size-14 rounded-[3px] p-1.5 shadow-sm transition-transform duration-300 ease-out motion-reduce:transition-none sm:size-16 ${i % 2 ? "bg-[var(--board-dark)]" : "bg-[var(--board-light)]"} ${active ? "-translate-y-1 scale-[1.06] ring-2 ring-gold" : ""}`}
                  >
                    <span className="block size-full overflow-hidden rounded-full">
                      <Image
                        src={m.photoSmall}
                        alt=""
                        width={64}
                        height={64}
                        sizes="64px"
                        className="size-full object-cover"
                      />
                    </span>
                  </span>
                  <span
                    className={`mt-1.5 text-xs tabular-nums ${active ? "font-semibold text-gold-ink" : "text-muted"}`}
                  >
                    {i + 1}
                  </span>
                </button>
              );
            })}
          </div>
          <span className="mt-2 block h-0.5 w-full overflow-hidden rounded-full bg-gold/20">
            <span
              key={`${index}-${reduced}`}
              className={`block h-full origin-left bg-gold ${reduced ? "" : "trustee-progress"}`}
              style={{ animationPlayState: running ? "running" : "paused" }}
              onAnimationEnd={() => go(index + 1, 1)}
            />
          </span>
        </div>
      </div>
    </div>
  );
}

function Portrait({
  member,
  className,
  onAnimationEnd,
  label,
}: {
  member: CommitteeMember;
  className?: string;
  onAnimationEnd?: () => void;
  label?: boolean;
}) {
  return (
    <div
      className={`absolute inset-1.5 overflow-hidden rounded-full ${className ?? ""}`}
      onAnimationEnd={onAnimationEnd}
      aria-hidden={label ? undefined : true}
    >
      <Image
        src={member.photo}
        alt={label ? `Portrait of ${member.name}` : ""}
        width={800}
        height={800}
        sizes="256px"
        className="size-full object-cover"
      />
    </div>
  );
}

function TrusteeText({
  member,
  className,
  hidden,
  animate,
}: {
  member: CommitteeMember;
  className?: string;
  hidden?: boolean;
  animate?: boolean;
}) {
  const words = member.quote.split(" ");
  return (
    <div className={`[grid-area:1/1] ${className ?? ""}`} aria-hidden={hidden || undefined}>
      <div className={animate ? "trustee-rise" : undefined}>
        <h3 className="font-display text-2xl font-bold text-charcoal sm:text-3xl">{member.name}</h3>
        <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-muted">
          <MapPinIcon className="size-4 flex-none text-gold-ink" aria-hidden="true" />
          {member.place}
        </p>
      </div>
      <span className="mx-auto mt-4 block h-px w-16 bg-gold sm:mx-0" aria-hidden="true" />
      <blockquote className="mt-4 font-display text-lg italic leading-relaxed text-foreground/85">
        {animate
          ? words.map((w, i) => (
              <Fragment key={i}>
                <span className="trustee-word" style={{ animationDelay: `${120 + i * 25}ms` }}>
                  {w}
                </span>
                {i < words.length - 1 ? " " : ""}
              </Fragment>
            ))
          : member.quote}
      </blockquote>
    </div>
  );
}

function ControlButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="flex size-10 items-center justify-center rounded-full border border-border bg-background text-charcoal transition-colors hover:border-gold hover:text-gold-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-ink"
    >
      <svg
        viewBox="0 0 24 24"
        className="size-5"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        {children}
      </svg>
    </button>
  );
}
