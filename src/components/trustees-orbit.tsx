"use client";

import Image from "next/image";
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type RefObject,
} from "react";
import type { CommitteeMember } from "@/data/committee";
import {
  orbitKeyframes,
  poseTransform,
  readPose,
  readRotation,
  wrap180,
  type Pose,
} from "@/lib/orbit-motion";

// Stage geometry (desktop px; the tablet stage is the same stage scaled down).
const STAGE = 520;
const RADIUS = 220;
// All images lazy-load: the section sits far below the fold, and Chrome starts
// fetching lazy images ~1250px before they scroll into view. (In Next 16,
// loading="eager" also emits a preload link, wasted on the hidden mobile copy.)
const SPOT = 240;
const SMALL = 88;
const SMALL_SCALE = SMALL / SPOT;
const RING_R = 127; // gold ring, just outside the spotlight's ivory border

const MOVE_MS = 600;
const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
const RING_DRAW_MS = 500;
const RING_DRAW_DELAY_MS = 150;
const TEXT_OUT_MS = 150;

/** "EMC Palaniappan, Puthuvayal" — photo alt text and the avatars' accessible name. */
const altOf = (m: CommitteeMember) => `${m.name}, ${m.place}`;

/** selected = trustee in the centre; slots[k] = trustee on ring position k (k = 0 is the top before rotation). */
type Orbit = { selected: number; slots: number[]; rotation: number };

function poseOf(o: Orbit, i: number): Pose {
  if (i === o.selected) return { x: 0, y: 0, s: 1 };
  const a = ((-90 + 60 * o.slots.indexOf(i) + o.rotation) * Math.PI) / 180;
  return { x: RADIUS * Math.cos(a), y: RADIUS * Math.sin(a), s: SMALL_SCALE };
}

/** Rotate the ring the shortest way so trustee i reaches the top, then swap it with the centre. */
function nextOrbit(o: Orbit, i: number) {
  const k = o.slots.indexOf(i);
  const sweep = wrap180(-(60 * k + o.rotation));
  const slots = [...o.slots];
  slots[k] = o.selected;
  return { orbit: { selected: i, slots, rotation: o.rotation + sweep }, sweep };
}

function setNode(map: RefObject<Map<number, HTMLElement>>, i: number, el: HTMLElement | null) {
  if (el) map.current.set(i, el);
  else map.current.delete(i);
}

function Arrow({ dir }: { dir: "left" | "right" }) {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {dir === "left" ? <path d="M15 5l-7 7 7 7M8 12h12" /> : <path d="M9 5l7 7-7 7M16 12H4" />}
    </svg>
  );
}

function MapPin() {
  return (
    <svg viewBox="0 0 24 24" className="size-3.5 flex-none" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21Z" />
      <circle cx="12" cy="9.5" r="2.5" />
    </svg>
  );
}

function Info({ member, mode }: { member: CommitteeMember; mode: "static" | "in" | "out" }) {
  const d = (ms: number) => ({ "--d": `${ms}ms` }) as CSSProperties;
  return (
    <div
      className={`absolute inset-0 text-center lg:text-left ${mode === "in" ? "ts-in" : mode === "out" ? "ts-out" : ""}`}
      aria-hidden={mode === "out" || undefined}
    >
      {/* One line from lg (the longest name fits at 1440); below that it may wrap — the card height is fixed. */}
      <h3 className="ts-item text-balance font-display text-[28px] font-bold leading-tight text-charcoal lg:whitespace-nowrap" style={d(0)}>
        {member.name}
      </h3>
      <p className="ts-item mt-2 flex items-center justify-center gap-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-muted lg:justify-start" style={d(60)}>
        <MapPin />
        <span>{member.place}</span>
      </p>
      <span className="ts-rule mx-auto mt-5 block h-0.5 w-10 origin-left bg-gold lg:mx-0" style={d(120)} />
      <blockquote className="ts-item relative mx-auto mt-8 max-w-[32ch] lg:mx-0" style={d(180)}>
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -top-5 left-1/2 -translate-x-1/2 select-none font-display text-[96px] leading-[0.8] text-gold/25 lg:-left-6 lg:translate-x-0"
        >
          &ldquo;
        </span>
        <p className="relative font-display text-[22px] italic leading-relaxed text-charcoal lg:text-2xl lg:leading-relaxed">
          {member.quote}
        </p>
      </blockquote>
    </div>
  );
}

function NavButton({ label, dir, onClick, onWarm }: { label: string; dir: "left" | "right"; onClick: () => void; onWarm: () => void }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      onPointerEnter={onWarm}
      onFocus={onWarm}
      className="flex size-11 items-center justify-center rounded-full border border-border bg-card text-charcoal shadow-sm transition-colors hover:border-charcoal hover:bg-charcoal hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-charcoal focus-visible:outline-solid motion-reduce:transition-none"
    >
      <Arrow dir={dir} />
    </button>
  );
}

/**
 * "Orbit spotlight" for the trustees on /about.
 *
 * Desktop/tablet: the selected trustee sits in the centre; the other six sit
 * evenly on a dashed orbit. Choosing one rotates the ring the shortest way so
 * it arcs toward the top while spiralling into the centre, and the previous
 * trustee spirals out to the vacated slot — one persistent element per
 * trustee, moved with transform only (Web Animations, eased samples along the
 * orbit). Interrupting retargets from wherever each avatar currently is.
 * Faces stay upright because avatars are placed on the ring, not rotated with it.
 * The gold ring re-draws, the info card staggers in. Mobile: no orbit — a
 * swipeable spotlight plus a snap carousel. Reduced motion: instant swap with
 * a 150ms cross-fade. No auto-rotation.
 */
export function TrusteesOrbit({ members }: { members: CommitteeMember[] }) {
  const n = members.length;
  const [orbit, setOrbit] = useState<Orbit>({
    selected: 0,
    slots: members.map((_, i) => i).slice(1),
    rotation: 0,
  });
  const [leaving, setLeaving] = useState<number | null>(null);
  const [changed, setChanged] = useState(false);
  const [warm, setWarm] = useState<ReadonlySet<number>>(() => new Set([0]));
  const [hover, setHover] = useState<number | null>(null);

  const avatars = useRef(new Map<number, HTMLElement>());
  const chips = useRef(new Map<number, HTMLElement>());
  const ringRef = useRef<SVGSVGElement>(null);
  const goldRef = useRef<SVGCircleElement>(null);
  const carouselRef = useRef<HTMLDivElement>(null);
  const pending = useRef<{ from: Map<number, Pose>; ringFrom: number; sweep: number; reduced: boolean; focus: boolean } | null>(null);
  const swipeX = useRef<number | null>(null);

  const selected = orbit.selected;
  const prev = (selected - 1 + n) % n;
  const next = (selected + 1) % n;

  function warmUp(...idx: number[]) {
    setWarm((w) => (idx.every((i) => w.has(i)) ? w : new Set([...w, ...idx])));
  }

  function select(i: number, focus = false) {
    if (i === orbit.selected) return;
    const from = new Map<number, Pose>();
    for (const [idx, el] of avatars.current) from.set(idx, readPose(el));
    const { orbit: nextState, sweep } = nextOrbit(orbit, i);
    pending.current = {
      from,
      ringFrom: ringRef.current ? readRotation(ringRef.current) : orbit.rotation,
      sweep,
      reduced: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
      focus,
    };
    setLeaving(orbit.selected);
    setChanged(true);
    setHover(null);
    warmUp(i);
    setOrbit(nextState);
  }

  useLayoutEffect(() => {
    const p = pending.current;
    pending.current = null;
    if (!p) return;

    for (const [idx, el] of avatars.current) {
      const to = poseOf(orbit, idx);
      const from = p.from.get(idx) ?? to;
      el.getAnimations().forEach((a) => a.cancel());
      const moved = Math.hypot(from.x - to.x, from.y - to.y) > 0.5 || Math.abs(from.s - to.s) > 0.001;
      if (!moved) continue;
      if (p.reduced) el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 150, easing: "ease-out" });
      else el.animate(orbitKeyframes(from, to, p.sweep), { duration: MOVE_MS, easing: "linear" });
    }

    const ring = ringRef.current;
    if (ring && !p.reduced) {
      const target = orbit.rotation;
      const start = target - wrap180(target - p.ringFrom);
      ring.getAnimations().forEach((a) => a.cancel());
      ring.animate([{ transform: `rotate(${start}deg)` }, { transform: `rotate(${target}deg)` }], { duration: MOVE_MS, easing: EASE });
    }

    const gold = goldRef.current;
    if (gold) {
      gold.getAnimations().forEach((a) => a.cancel());
      if (!p.reduced) {
        gold.animate([{ strokeDashoffset: 100 }, { strokeDashoffset: 0 }], {
          duration: RING_DRAW_MS,
          delay: RING_DRAW_DELAY_MS,
          easing: EASE,
          fill: "backwards",
        });
      }
    }

    const row = carouselRef.current;
    const chip = chips.current.get(orbit.selected);
    if (row && chip && row.offsetParent !== null) {
      row.scrollTo({ left: chip.offsetLeft - (row.clientWidth - chip.offsetWidth) / 2, behavior: p.reduced ? "auto" : "smooth" });
    }

    if (p.focus) {
      const target = [avatars.current.get(orbit.selected), chips.current.get(orbit.selected)].find(
        (el) => el && el.offsetParent !== null
      );
      target?.focus({ preventScroll: true });
    }
  }, [orbit]);

  useEffect(() => {
    if (leaving === null) return;
    const t = setTimeout(() => setLeaving(null), TEXT_OUT_MS);
    return () => clearTimeout(t);
  }, [leaving]);

  function onRadioKey(e: KeyboardEvent, i: number) {
    const step: Record<string, number> = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
    let to: number | null = null;
    if (e.key in step) to = (selected + step[e.key] + n) % n;
    else if (e.key === "Home") to = 0;
    else if (e.key === "End") to = n - 1;
    else if (e.key === "Enter" || e.key === " ") to = i;
    if (to === null) return;
    e.preventDefault();
    select(to, true);
  }

  const member = members[selected];
  const card = (className: string) => (
    <div className={`flex flex-col ${className}`}>
      <div aria-live="polite" className="relative flex-1">
        {leaving !== null && leaving !== selected && (
          <Info key={`out-${leaving}`} member={members[leaving]} mode="out" />
        )}
        <Info key={`in-${selected}`} member={member} mode={changed ? "in" : "static"} />
      </div>
      <div className="mt-6 flex justify-center gap-3 lg:justify-start">
        <NavButton label="Previous trustee" dir="left" onClick={() => select(prev)} onWarm={() => warmUp(prev)} />
        <NavButton label="Next trustee" dir="right" onClick={() => select(next)} onWarm={() => warmUp(next)} />
      </div>
    </div>
  );

  const hovered = hover !== null && hover !== selected ? { pose: poseOf(orbit, hover), member: members[hover] } : null;

  return (
    <div>
      {/* Desktop (≥1024) and tablet (768–1023): orbit stage + info card. */}
      <div className="hidden md:grid md:justify-items-center md:gap-10 lg:grid-cols-12 lg:items-center lg:gap-8">
        <div className="relative size-[420px] lg:col-span-7 lg:size-[520px]">
          <div
            role="radiogroup"
            aria-label="Trustees"
            className="absolute left-0 top-0 origin-top-left scale-[0.8077] lg:scale-100"
            style={{ width: STAGE, height: STAGE }}
          >
            <svg className="trustee-tiles pointer-events-none absolute inset-0 size-full" aria-hidden="true">
              <defs>
                <pattern id="trustee-tile" width="56" height="56" patternUnits="userSpaceOnUse">
                  <path d="M28 4 52 28 28 52 4 28Z" fill="none" stroke="var(--gold-ink)" strokeWidth="1" />
                  <path d="M28 16 40 28 28 40 16 28Z" fill="none" stroke="var(--gold-ink)" strokeWidth="1" />
                  <circle cx="28" cy="28" r="1.5" fill="var(--gold-ink)" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#trustee-tile)" />
            </svg>

            <svg
              ref={ringRef}
              viewBox={`0 0 ${STAGE} ${STAGE}`}
              className="pointer-events-none absolute inset-0 size-full"
              style={{ transform: `rotate(${orbit.rotation}deg)` }}
              aria-hidden="true"
            >
              <circle
                cx={STAGE / 2}
                cy={STAGE / 2}
                r={RADIUS}
                fill="none"
                stroke="var(--gold-ink)"
                strokeOpacity={0.35}
                strokeWidth={1}
                strokeDasharray="4 7"
              />
            </svg>

            <div
              className="trustee-glow pointer-events-none absolute rounded-full"
              style={{ left: (STAGE - SPOT) / 2, top: (STAGE - SPOT) / 2, width: SPOT, height: SPOT }}
            />

            {members.map((m, i) => (
              <button
                key={m.id}
                ref={(el) => setNode(avatars, i, el)}
                type="button"
                role="radio"
                aria-label={altOf(m)}
                aria-checked={i === selected}
                tabIndex={i === selected ? 0 : -1}
                onClick={() => select(i)}
                onKeyDown={(e) => onRadioKey(e, i)}
                onPointerEnter={() => {
                  if (i === selected) return;
                  setHover(i);
                  warmUp(i);
                }}
                onPointerLeave={() => setHover(null)}
                onFocus={() => warmUp(prev, next)}
                className="trustee-avatar absolute rounded-full"
                style={{
                  left: (STAGE - SPOT) / 2,
                  top: (STAGE - SPOT) / 2,
                  width: SPOT,
                  height: SPOT,
                  transform: poseTransform(poseOf(orbit, i)),
                }}
              >
                <span className="trustee-face relative block size-full overflow-hidden rounded-full bg-background">
                  <Image
                    src={m.photoSmall}
                    alt={altOf(m)}
                    fill
                    sizes={`${SMALL}px`}
                    className="object-cover"
                  />
                  {warm.has(i) && (
                    <Image
                      src={m.photo}
                      alt=""
                      fill
                      sizes={`${SPOT}px`}
                     
                      className={`object-cover transition-opacity duration-150 motion-reduce:transition-none ${i === selected ? "opacity-100" : "opacity-0"}`}
                    />
                  )}
                  <span className="trustee-vignette absolute inset-0 rounded-full" aria-hidden="true" />
                </span>
              </button>
            ))}

            <svg
              className="pointer-events-none absolute -rotate-90"
              style={{ left: STAGE / 2 - RING_R - 3, top: STAGE / 2 - RING_R - 3, width: (RING_R + 3) * 2, height: (RING_R + 3) * 2 }}
              viewBox={`0 0 ${(RING_R + 3) * 2} ${(RING_R + 3) * 2}`}
              aria-hidden="true"
            >
              <circle
                ref={goldRef}
                cx={RING_R + 3}
                cy={RING_R + 3}
                r={RING_R}
                fill="none"
                stroke="var(--gold)"
                strokeWidth={3}
                pathLength={100}
                strokeDasharray="100 100"
              />
            </svg>

            {hovered && (
              <span
                className="pointer-events-none absolute -translate-x-1/2 whitespace-nowrap rounded-full bg-charcoal px-3 py-1 text-xs font-semibold text-white shadow-md"
                style={{ left: STAGE / 2 + hovered.pose.x, top: STAGE / 2 + hovered.pose.y + SMALL / 2 + 10 }}
                aria-hidden="true"
              >
                {hovered.member.name}
                <span className="font-normal text-white/70"> · {hovered.member.place}</span>
              </span>
            )}
          </div>
        </div>

        {card("h-[23rem] w-full max-w-md lg:col-span-5 lg:max-w-none")}
      </div>

      {/* Mobile (≤767): swipeable spotlight, info card, snap carousel. */}
      <div className="md:hidden">
        <div
          className="mx-auto size-[200px] touch-pan-y select-none"
          onPointerDown={(e) => {
            swipeX.current = e.clientX;
            warmUp(prev, next);
          }}
          onPointerUp={(e) => {
            if (swipeX.current === null) return;
            const dx = e.clientX - swipeX.current;
            swipeX.current = null;
            if (Math.abs(dx) > 40) select(dx < 0 ? next : prev);
          }}
          onPointerCancel={() => {
            swipeX.current = null;
          }}
        >
          <div key={selected} className={`trustee-spot-mobile relative size-full rounded-full ${changed ? "ts-spot-in" : ""}`}>
            <span className="relative block size-full overflow-hidden rounded-full bg-background">
              <Image src={member.photoSmall} alt="" fill sizes={`${SPOT}px`} className="object-cover" />
              <Image src={member.photo} alt={altOf(member)} fill sizes={`${SPOT}px`} className="object-cover" />
              <span className="trustee-vignette absolute inset-0 rounded-full" aria-hidden="true" />
            </span>
          </div>
        </div>

        {card("mt-8 h-[25rem]")}

        <div
          ref={carouselRef}
          role="radiogroup"
          aria-label="Trustees"
          className="relative -mx-4 mt-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-[calc(50%-32px)] py-3"
        >
          {members.map((m, i) => (
            <button
              key={m.id}
              ref={(el) => setNode(chips, i, el)}
              type="button"
              role="radio"
              aria-label={altOf(m)}
              title={altOf(m)}
              aria-checked={i === selected}
              tabIndex={i === selected ? 0 : -1}
              onClick={() => select(i)}
              onKeyDown={(e) => onRadioKey(e, i)}
              onFocus={() => warmUp(prev, next)}
              className={`relative size-16 flex-none snap-center overflow-hidden rounded-full bg-background focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-charcoal focus-visible:outline-solid ${
                i === selected ? "ring-[3px] ring-gold ring-offset-2 ring-offset-card" : "ring-1 ring-border"
              }`}
            >
              <Image src={m.photoSmall} alt={altOf(m)} fill sizes="64px" className="object-cover" />
              <span className="trustee-vignette absolute inset-0 rounded-full" aria-hidden="true" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
