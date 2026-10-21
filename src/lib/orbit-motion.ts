/**
 * Motion helpers for the trustees "orbit spotlight" (components/trustees-orbit.tsx).
 * Positions are { x, y, s }: a translate from the stage centre in px plus a scale.
 */

export type Pose = { x: number; y: number; s: number };

/** cubic-bezier(x1, y1, x2, y2) as a function of t, solved for x with Newton's method. */
export function cubicBezier(x1: number, y1: number, x2: number, y2: number) {
  const a = (p1: number, p2: number) => 1 - 3 * p2 + 3 * p1;
  const b = (p1: number, p2: number) => 3 * p2 - 6 * p1;
  const c = (p1: number) => 3 * p1;
  const at = (t: number, p1: number, p2: number) => ((a(p1, p2) * t + b(p1, p2)) * t + c(p1)) * t;
  const slope = (t: number, p1: number, p2: number) => 3 * a(p1, p2) * t * t + 2 * b(p1, p2) * t + c(p1);
  return (x: number) => {
    if (x <= 0 || x >= 1) return x;
    let t = x;
    for (let i = 0; i < 8; i++) {
      const d = slope(t, x1, x2);
      if (Math.abs(d) < 1e-6) break;
      t -= (at(t, x1, x2) - x) / d;
    }
    return at(t, y1, y2);
  };
}

export const easeOutSoft = cubicBezier(0.22, 1, 0.36, 1);

/** Wraps degrees into [-180, 180) — the shortest way round. */
export const wrap180 = (deg: number) => ((((deg + 180) % 360) + 360) % 360) - 180;

/** Current on-screen pose of an element, including any animation in flight. */
export function readPose(el: Element): Pose {
  const t = getComputedStyle(el).transform;
  if (!t || t === "none") return { x: 0, y: 0, s: 1 };
  const m = new DOMMatrixReadOnly(t);
  return { x: m.e, y: m.f, s: Math.hypot(m.a, m.b) };
}

/** Current rotation (deg) of an element, including any animation in flight. */
export function readRotation(el: Element): number {
  const t = getComputedStyle(el).transform;
  if (!t || t === "none") return 0;
  const m = new DOMMatrixReadOnly(t);
  return (Math.atan2(m.b, m.a) * 180) / Math.PI;
}

export const poseTransform = (p: Pose) => `translate(${p.x}px, ${p.y}px) scale(${p.s})`;

/**
 * Keyframes that move a pose along the orbit rather than in a straight line:
 * radius and scale ease linearly while the angle sweeps — by `sweepDeg` for a
 * pose entering or leaving the centre (so it arcs with the ring's rotation),
 * otherwise the shortest way between its start and end angles. The easing is
 * baked into the samples, so play them with easing: "linear".
 */
export function orbitKeyframes(from: Pose, to: Pose, sweepDeg: number, samples = 24): Keyframe[] {
  const r0 = Math.hypot(from.x, from.y);
  const r1 = Math.hypot(to.x, to.y);
  const sweep = (sweepDeg * Math.PI) / 180;
  let a0 = Math.atan2(from.y, from.x);
  let a1 = Math.atan2(to.y, to.x);
  let da: number;
  if (r0 < 1 && r1 < 1) {
    da = 0;
  } else if (r0 < 1) {
    a0 = a1 - sweep;
    da = sweep;
  } else if (r1 < 1) {
    a1 = a0 + sweep;
    da = sweep;
  } else {
    da = (wrap180(((a1 - a0) * 180) / Math.PI) * Math.PI) / 180;
  }
  const frames: Keyframe[] = [];
  for (let i = 0; i <= samples; i++) {
    const e = easeOutSoft(i / samples);
    const r = r0 + (r1 - r0) * e;
    const a = a0 + da * e;
    frames.push({
      offset: i / samples,
      transform: poseTransform({ x: r * Math.cos(a), y: r * Math.sin(a), s: from.s + (to.s - from.s) * e }),
    });
  }
  return frames;
}
