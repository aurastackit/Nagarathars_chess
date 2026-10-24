"use client";

import {
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

/**
 * The /about trustees: one trustee in the spotlight (portrait, name, place and
 * the site's message), and below it a rail of all seven on alternating board
 * squares. The active square steps up like an advancing pawn. Advances every
 * 6s (driven by the progress line's CSS animation), paused on hover, keyboard
 * focus or the pause button; never with reduced motion.
 */
export function TrusteesLineup({ members }: { members: CommitteeMember[] }) {
  const count = members.length;
  const [index, setIndex] = useState(0);
  const [dir, setDir] = useState(1);
  const [prev, setPrev] = useState<number | null>(null);
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

  function go(next: number, direction = next > index ? 1 : -1) {
    const n = (next + count) % count;
    if (n === index) return;
    setDir(direction);
    setPrev(reduced ? null : index);
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
  const slide = { "--dx": `${dir * 16}px` } as CSSProperties;

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
        className="grid rounded-lg border border-border bg-background p-6 shadow-sm sm:p-8"
      >
        {prev !== null && (
          <Spotlight
            member={members[prev]}
            position={prev + 1}
            count={count}
            className="trustee-out pointer-events-none"
            style={slide}
            onAnimationEnd={() => setPrev(null)}
            hidden
          />
        )}
        <Spotlight
          key={member.id}
          member={member}
          position={index + 1}
          count={count}
          className={reduced ? undefined : "trustee-in"}
          style={slide}
        />
      </div>

      <div className="mt-4 flex items-center justify-center gap-2">
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

      <div
        ref={railRef}
        className="relative mt-2 snap-x snap-mandatory overflow-x-auto px-4 pb-2 pt-14 [scrollbar-width:thin] sm:pt-20"
      >
        <div
          role="tablist"
          aria-label="Trustees"
          onKeyDown={onRailKey}
          className="mx-auto flex w-max gap-2 sm:gap-3"
        >
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
                className={`group flex snap-center flex-col items-center rounded-sm transition-opacity focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold-ink ${active ? "" : "opacity-70 hover:opacity-100"}`}
              >
                <span className="relative block size-14 sm:size-20">
                  <span
                    className={`absolute inset-0 flex items-center justify-center rounded-[3px] p-1.5 shadow-sm transition-transform duration-300 ease-out motion-reduce:transition-none ${i % 2 ? "bg-[var(--board-dark)]" : "bg-[var(--board-light)]"} ${active ? "-translate-y-full ring-2 ring-gold" : "group-hover:-translate-y-1"}`}
                  >
                    <Image
                      src={m.photoSmall}
                      alt=""
                      width={80}
                      height={80}
                      sizes="80px"
                      className="size-full rounded-full object-cover"
                    />
                  </span>
                </span>
                <span className="mt-2 block h-0.5 w-full overflow-hidden rounded-full bg-gold/25">
                  {active && (
                    <span
                      key={`${index}-${reduced}`}
                      className={`block h-full origin-left bg-gold ${reduced ? "" : "trustee-progress"}`}
                      style={{ animationPlayState: running ? "running" : "paused" }}
                      onAnimationEnd={() => go(index + 1, 1)}
                    />
                  )}
                </span>
                <span
                  className={`mt-1 text-xs tabular-nums ${active ? "font-semibold text-gold-ink" : "text-muted"}`}
                >
                  {i + 1}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Spotlight({
  member,
  position,
  count,
  className,
  style,
  onAnimationEnd,
  hidden,
}: {
  member: CommitteeMember;
  position: number;
  count: number;
  className?: string;
  style?: CSSProperties;
  onAnimationEnd?: () => void;
  hidden?: boolean;
}) {
  return (
    <div
      className={`flex flex-col items-center gap-6 text-center [grid-area:1/1] sm:flex-row sm:items-center sm:gap-10 sm:text-left ${className ?? ""}`}
      style={style}
      onAnimationEnd={onAnimationEnd}
      aria-hidden={hidden || undefined}
    >
      <div className="relative aspect-square w-full max-w-64 flex-none rounded-full p-1.5 ring-1 ring-gold sm:w-64">
        <Image
          src={member.photo}
          alt={`Portrait of ${member.name}`}
          width={800}
          height={800}
          sizes="(min-width: 640px) 256px, 80vw"
          className="size-full rounded-full object-cover"
        />
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="font-display text-2xl font-bold text-charcoal sm:text-3xl">{member.name}</h3>
        <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-muted">
          <MapPinIcon className="size-4 flex-none text-gold-ink" aria-hidden="true" />
          {member.place}
        </p>
        <span className="mx-auto mt-4 block h-px w-16 bg-gold sm:mx-0" aria-hidden="true" />
        <blockquote className="mt-4 font-display text-lg italic leading-relaxed text-foreground/85">
          {member.quote}
        </blockquote>
        <p className="mt-5 text-sm font-semibold tabular-nums tracking-wider text-gold-ink">
          {pad(position)} / {pad(count)}
        </p>
      </div>
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
