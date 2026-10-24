"use client";

import {
  useRef,
  useState,
  useSyncExternalStore,
  type AnimationEvent,
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

/**
 * The /about trustees: one trustee in the spotlight card (portrait, name,
 * place, the site's message and controls) and a vertical list of all seven
 * (left column on lg+, below the card on smaller screens). A thin gold bar
 * slides to the active row and fills top to bottom over 6s; its end advances
 * to the next trustee. Each change is the same 350ms crossfade, the new text
 * rising 6px. Paused on hover, keyboard focus or the pause button; with
 * reduced motion nothing advances and changes are instant.
 */
export function TrusteesLineup({ members }: { members: CommitteeMember[] }) {
  const count = members.length;
  const [index, setIndex] = useState(0);
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
  const spotlightRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const running = !reduced && !stopped && !hovered && !focused;
  const animate = changed && !reduced;

  function go(next: number) {
    const n = (next + count) % count;
    if (n === index) return;
    setPrev(reduced ? null : index);
    setChanged(true);
    setIndex(n);
    setFocusIndex(n);
  }

  // A tapped row brings the spotlight into view, but only when it's off-screen (stacked layout).
  function pick(i: number) {
    go(i);
    const card = spotlightRef.current;
    if (!card) return;
    const { top, bottom } = card.getBoundingClientRect();
    if (top < 0 || bottom > window.innerHeight) {
      card.scrollIntoView({ block: "nearest", behavior: reduced ? "auto" : "smooth" });
    }
  }

  function onListKey(e: KeyboardEvent<HTMLDivElement>) {
    let n = focusIndex;
    if (e.key === "ArrowDown") n = (focusIndex + 1) % count;
    else if (e.key === "ArrowUp") n = (focusIndex - 1 + count) % count;
    else if (e.key === "Home") n = 0;
    else if (e.key === "End") n = count - 1;
    else return;
    e.preventDefault();
    setFocusIndex(n);
    tabRefs.current[n]?.focus();
  }

  const member = members[index];
  const upcoming = members[(index + 1) % count];

  return (
    <div
      className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[320px_minmax(0,1fr)] lg:items-center lg:gap-10"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={(e) => setFocused(e.target.matches(":focus-visible"))}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocused(false);
      }}
    >
      <div
        ref={spotlightRef}
        id="trustee-spotlight"
        role="tabpanel"
        aria-live="polite"
        aria-labelledby={`trustee-tab-${member.id}`}
        className="rounded-lg border border-border bg-background p-6 shadow-sm sm:p-8"
      >
        {/* Every trustee's layout sits invisibly in one cell so the card keeps the tallest
            height; the visible slides are absolutely positioned on top. */}
        <div className="relative grid">
          {members.map((m) => (
            <Slide key={m.id} member={m} className="invisible [grid-area:1/1]" sizer />
          ))}
          {prev !== null && (
            <Slide key={`prev-${index}`} member={members[prev]} className="absolute inset-0" out />
          )}
          <Slide
            key={member.id}
            member={member}
            className={`absolute inset-0 ${animate ? "trustee-fade-in" : ""}`}
            animate={animate}
            onAnimationEnd={(e) => {
              if (e.target === e.currentTarget) setPrev(null);
            }}
          />
          {/* Loads the next large portrait ahead of its fade. */}
          <Image
            src={upcoming.photo}
            alt=""
            width={800}
            height={800}
            sizes="256px"
            className="pointer-events-none absolute size-px opacity-0"
            aria-hidden="true"
          />
        </div>

        <div className="mt-5 flex items-center justify-center gap-2 sm:justify-end">
          <ControlButton label="Previous trustee" onClick={() => go(index - 1)}>
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
          <ControlButton label="Next trustee" onClick={() => go(index + 1)}>
            <path d="M9 5l7 7-7 7M16 12H4" />
          </ControlButton>
        </div>
      </div>

      <div
        role="tablist"
        aria-label="Trustees"
        aria-orientation="vertical"
        onKeyDown={onListKey}
        className="relative lg:order-first"
      >
        {/* The gold bar slides to the active row and fills top to bottom over 6s. */}
        <span
          className="pointer-events-none absolute left-0 top-0 z-10 block h-16 w-[3px] py-2 transition-transform duration-[350ms] ease-out motion-reduce:transition-none lg:h-20"
          style={{ transform: `translateY(${index * 100}%)` }}
          aria-hidden="true"
        >
          <span className="block size-full overflow-hidden rounded-full bg-gold/25">
            <span
              key={`${index}-${reduced}`}
              className={`block size-full origin-top bg-gold ${reduced ? "" : "trustee-progress"}`}
              style={{ animationPlayState: running ? "running" : "paused" }}
              onAnimationEnd={() => go(index + 1)}
            />
          </span>
        </span>
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
              tabIndex={i === focusIndex ? 0 : -1}
              onClick={() => pick(i)}
              className={`flex h-16 w-full items-center gap-3 rounded-md pl-4 pr-3 text-left transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-gold-ink lg:h-20 ${active ? "bg-background" : "hover:bg-background/60"}`}
            >
              <span className="block size-12 flex-none overflow-hidden rounded-full border border-border lg:size-14">
                <Image
                  src={m.photoSmall}
                  alt=""
                  width={56}
                  height={56}
                  sizes="56px"
                  className="size-full object-cover"
                />
              </span>
              <span className="min-w-0 flex-1">
                <span
                  className={`block font-display font-semibold leading-snug ${active ? "text-gold-ink" : "text-charcoal"}`}
                >
                  {m.name}
                </span>
                <span className="block text-xs text-muted">{m.place}</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * One trustee's spotlight content. `sizer` only reserves space (no photo is
 * loaded). `out` is the outgoing slide: its photo stays under the incoming
 * one as that fades in, so there's never a blank frame; its text fades out.
 */
function Slide({
  member,
  className,
  sizer,
  out,
  animate,
  onAnimationEnd,
}: {
  member: CommitteeMember;
  className?: string;
  sizer?: boolean;
  out?: boolean;
  animate?: boolean;
  onAnimationEnd?: (e: AnimationEvent<HTMLDivElement>) => void;
}) {
  const hidden = sizer || out;
  return (
    <div
      className={`flex flex-col items-center gap-6 text-center sm:flex-row sm:gap-10 sm:text-left ${className ?? ""}`}
      aria-hidden={hidden || undefined}
      onAnimationEnd={onAnimationEnd}
    >
      <div className="relative size-56 flex-none rounded-full ring-1 ring-gold sm:size-64">
        {!sizer && (
          <div className="absolute inset-1.5 overflow-hidden rounded-full">
            <Image
              src={member.photo}
              alt={hidden ? "" : `Portrait of ${member.name}`}
              width={800}
              height={800}
              sizes="256px"
              className="size-full object-cover"
            />
          </div>
        )}
      </div>
      <div className={`min-w-0 flex-1 ${out ? "trustee-fade-out" : animate ? "trustee-rise" : ""}`}>
        <h3 className="font-display text-2xl font-bold text-charcoal sm:text-3xl">{member.name}</h3>
        <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-muted">
          <MapPinIcon className="size-4 flex-none text-gold-ink" aria-hidden="true" />
          {member.place}
        </p>
        <span className="mx-auto mt-4 block h-px w-16 bg-gold sm:mx-0" aria-hidden="true" />
        <blockquote className="mt-4 font-display text-lg italic leading-relaxed text-foreground/85">
          {member.quote}
        </blockquote>
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
