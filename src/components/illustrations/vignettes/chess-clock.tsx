import type { CSSProperties } from "react";

/**
 * One face of the clock. `hand` is the hand's angle in degrees (0 = 12
 * o'clock). `arc` (0–1) draws a gold time arc from 12 o'clock to the hand;
 * `ring` draws a full gold ring instead. The running face gets the raised
 * gold button and a gold hand. `animate` sweeps the hand (and draws the arc)
 * in once when the card plays — see .vg-rotate / .vg-draw in globals.css.
 */
type Face = { hand: number; arc?: number; ring?: boolean; running?: boolean; animate?: boolean };

const BODY = { x: 45, y: 58, w: 150, h: 72 };
const FACE_Y = 94;
const R = 24;
const ARC_R = R + 4;
const FACE_X = { left: 85, right: 155 };
const SWEEP: CSSProperties = { "--vg-duration": "1600ms", "--vg-ease": "cubic-bezier(0.2, 0.7, 0.3, 1)" } as CSSProperties;

function arcPath(cx: number, fraction: number) {
  const f = Math.min(fraction, 0.999);
  const a = f * 2 * Math.PI;
  const x = cx + ARC_R * Math.sin(a);
  const y = FACE_Y - ARC_R * Math.cos(a);
  return `M${cx} ${FACE_Y - ARC_R} A${ARC_R} ${ARC_R} 0 ${f > 0.5 ? 1 : 0} 1 ${x.toFixed(2)} ${y.toFixed(2)}`;
}

function ClockFace({ cx, face }: { cx: number; face: Face }) {
  const handColor = face.running ? "var(--gold-ink)" : "var(--charcoal)";
  return (
    <g>
      {face.arc !== undefined && (
        <>
          <circle cx={cx} cy={FACE_Y} r={ARC_R} fill="none" stroke="var(--background)" strokeOpacity={0.18} strokeWidth={3.5} vectorEffect="non-scaling-stroke" />
          {/* No non-scaling-stroke here: Chrome then measures the dash in screen
              space, which breaks pathLength and repeats the dash past the arc's end. */}
          <path
            d={arcPath(cx, face.arc)}
            fill="none"
            stroke="var(--gold)"
            strokeWidth={2.4}
            strokeLinecap="round"
            pathLength={100}
            strokeDasharray="100 100"
            className={face.animate ? "vg-draw" : undefined}
            style={face.animate ? SWEEP : undefined}
          />
        </>
      )}
      {face.ring && (
        <circle cx={cx} cy={FACE_Y} r={R + 3} fill="none" stroke="var(--gold)" strokeWidth={2.5} vectorEffect="non-scaling-stroke" />
      )}
      <circle cx={cx} cy={FACE_Y} r={R} fill="var(--card)" stroke="var(--walnut)" strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
      <g stroke="var(--walnut)" strokeWidth={1.5} vectorEffect="non-scaling-stroke" strokeLinecap="round">
        <line x1={cx} y1={FACE_Y - R + 3} x2={cx} y2={FACE_Y - R + 7} />
        <line x1={cx + R - 3} y1={FACE_Y} x2={cx + R - 7} y2={FACE_Y} />
        <line x1={cx} y1={FACE_Y + R - 3} x2={cx} y2={FACE_Y + R - 7} />
        <line x1={cx - R + 3} y1={FACE_Y} x2={cx - R + 7} y2={FACE_Y} />
      </g>
      <line
        x1={cx}
        y1={FACE_Y}
        x2={cx}
        y2={FACE_Y - 18}
        stroke={handColor}
        strokeWidth={face.running ? 2.5 : 2}
        vectorEffect="non-scaling-stroke"
        strokeLinecap="round"
        // Static hands use a plain SVG rotate. An animated hand rotates about the
        // bottom-centre of its own box — the face centre — so the clock still
        // works when a vignette scales it inside a parent transform.
        transform={face.animate ? undefined : `rotate(${face.hand} ${cx} ${FACE_Y})`}
        className={face.animate ? "vg-rotate" : undefined}
        style={
          face.animate
            ? ({
                transformBox: "fill-box",
                transformOrigin: "50% 100%",
                transform: `rotate(${face.hand}deg)`,
                "--vg-from": "0deg",
                ...SWEEP,
              } as CSSProperties)
            : undefined
        }
      />
      <circle cx={cx} cy={FACE_Y} r={2.5} fill={handColor} />
    </g>
  );
}

/**
 * The shared chess clock (Why Chess "Patience", the three Tournament Formats
 * cards). Fixed geometry on the 240x160 vignette canvas: body x 45–195,
 * sitting on y = 130 — the top edge of a board strip.
 */
export function ChessClock({ left, right }: { left: Face; right: Face }) {
  const raised = (face: Face) => (face.running ? { y: 42, h: 17 } : { y: 52, h: 7 });
  return (
    <g>
      {(["left", "right"] as const).map((side) => {
        const face = side === "left" ? left : right;
        const b = raised(face);
        return (
          <rect
            key={side}
            x={FACE_X[side] - 12}
            y={b.y}
            width={24}
            height={b.h}
            rx={2}
            fill={face.running ? "var(--gold)" : "var(--walnut)"}
            stroke={face.running ? "var(--charcoal)" : "none"}
            strokeWidth={1.5}
            vectorEffect="non-scaling-stroke"
          />
        );
      })}
      <rect x={BODY.x} y={BODY.y} width={BODY.w} height={BODY.h} rx={10} fill="var(--charcoal)" />
      <ClockFace cx={FACE_X.left} face={left} />
      <ClockFace cx={FACE_X.right} face={right} />
    </g>
  );
}
