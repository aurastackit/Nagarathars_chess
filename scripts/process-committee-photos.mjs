#!/usr/bin/env node
/**
 * Turns the committee portraits in public/images/committee/raw/01.jpg … 07.jpg
 * (file order = display order) into one consistent set:
 *
 *   1. Background removal (@imgly/background-removal-node). Cut-outs are
 *      cached in raw/cutout/ — pass --fresh to recompute them.
 *   2. Framing: eyes and face box from OpenCV's YuNet face detector, crown
 *      (top of hair) from the alpha mask; every portrait is cropped square so
 *      the eye line and the crown-to-chin height land in the same place.
 *   3. Light correction only: a tightly clamped exposure gain plus a
 *      half-strength colour-cast correction measured on the face — no
 *      saturation or complexion changes. Soft mask edges are decontaminated
 *      so no blue/dark fringe from the old background survives.
 *   4. Composited on one shared backdrop (radial --card → warm ivory).
 *
 * Writes 0N.webp (800×800), 0N-400.webp (400×400) and
 * committee-contact-sheet.png to public/images/committee/. With --debug it
 * also writes raw/debug/0N.png showing the detected lines and crop.
 *
 *   node scripts/process-committee-photos.mjs [--fresh] [--debug]
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const DIR = "public/images/committee";
const RAW = path.join(DIR, "raw");
const CUTOUT = path.join(RAW, "cutout");
const DEBUG = path.join(RAW, "debug");
const COUNT = 7;
const OUT = 800;
const SMALL = 400;
const QUALITY = 82;

// Framing targets, as fractions of the square output.
const EYE_LINE = 0.4; // eyes this far from the top
const HEAD_FILL = 0.55; // crown-to-chin height / output height

// Face landmarks come from OpenCV's YuNet detector (eyes, nose, mouth
// corners + face box) run through onnxruntime-node. The model is fetched once
// into scripts/.models/ (git-ignored) and checked against this hash.
const YUNET_URL =
  "https://github.com/opencv/opencv_zoo/raw/main/models/face_detection_yunet/face_detection_yunet_2023mar.onnx";
const YUNET_SHA256 = "8f2383e4dd3cfbb4553ea8718107fc0423210dc964f9f4280604804ed2552fa4";
const YUNET_PATH = "scripts/.models/face_detection_yunet_2023mar.onnx";
const YUNET_SIZE = 640;

// Light correction limits — deliberately tight. Face measurements can't tell
// lighting apart from someone's natural complexion, so the correction only
// evens out exposure and colour casts at the margins; it never pushes
// everyone towards one skin tone (and there is no saturation change).
const EXPOSURE_CLAMP = [0.94, 1.08];
const CAST_STRENGTH = 0.5;
const CAST_CLAMP = [0.95, 1.05];
// Soft mask edges keep the old background's colour (blue studio, dark marble);
// each edge pixel's colour is refilled from solid subject pixels this close.
const DECONTAMINATE_RADIUS = 4;

const BACKDROP_CENTRE = "#fffdf9"; // --card
const BACKDROP_EDGE = "#efe6d2";

const args = new Set(process.argv.slice(2));
const ids = Array.from({ length: COUNT }, (_, i) => String(i + 1).padStart(2, "0"));

// Background removal runs in its own child process (--remove-only): the
// library bundles an older sharp whose native libvips DLL shares a name with
// the one the project's sharp needs, and on Windows whichever loads second in
// a process fails. So this process never imports both.
if (args.has("--remove-only")) {
  const { removeBackground } = await import("@imgly/background-removal-node");
  mkdirSync(CUTOUT, { recursive: true });
  for (const id of process.argv.slice(2).filter((a) => /^\d\d$/.test(a))) {
    const src = readFileSync(path.join(RAW, `${id}.jpg`));
    const blob = await removeBackground(new Blob([src], { type: "image/jpeg" }), {
      output: { format: "image/png" },
    });
    writeFileSync(path.join(CUTOUT, `${id}.png`), Buffer.from(await blob.arrayBuffer()));
    console.log(`${id}: background removed`);
  }
  process.exit(0);
}

const missing = ids.filter((id) => args.has("--fresh") || !existsSync(path.join(CUTOUT, `${id}.png`)));
if (missing.length) {
  execFileSync(process.execPath, [fileURLToPath(import.meta.url), "--remove-only", ...missing], {
    stdio: "inherit",
  });
}
const { default: sharp } = await import("sharp");
const ort = await import("onnxruntime-node");

// ---------- helpers ----------

const cutout = (id) => readFileSync(path.join(CUTOUT, `${id}.png`));

async function yunet() {
  if (!existsSync(YUNET_PATH)) {
    mkdirSync(path.dirname(YUNET_PATH), { recursive: true });
    const res = await fetch(YUNET_URL);
    if (!res.ok) throw new Error(`YuNet download failed: HTTP ${res.status}`);
    writeFileSync(YUNET_PATH, Buffer.from(await res.arrayBuffer()));
  }
  const { createHash } = await import("node:crypto");
  const hash = createHash("sha256").update(readFileSync(YUNET_PATH)).digest("hex");
  if (hash !== YUNET_SHA256) throw new Error(`YuNet model checksum mismatch (${hash})`);
  return ort.InferenceSession.create(YUNET_PATH);
}

/**
 * Runs YuNet on the original photo (detectors work best with the real
 * background) and returns the strongest face: box + 5 landmarks
 * (right eye, left eye, nose, right/left mouth corner), in source pixels.
 */
async function landmarks(session, file) {
  const img = sharp(file);
  const { width: W, height: H } = await img.metadata();
  const scale = YUNET_SIZE / Math.max(W, H);
  const { data } = await img
    .resize(Math.round(W * scale), Math.round(H * scale))
    .extend({
      right: YUNET_SIZE - Math.round(W * scale),
      bottom: YUNET_SIZE - Math.round(H * scale),
      background: { r: 0, g: 0, b: 0 },
    })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  // NCHW float32, BGR, raw 0–255 — what YuNet was exported with.
  const plane = YUNET_SIZE * YUNET_SIZE;
  const input = new Float32Array(3 * plane);
  for (let i = 0; i < plane; i++) {
    input[i] = data[i * 3 + 2];
    input[plane + i] = data[i * 3 + 1];
    input[2 * plane + i] = data[i * 3];
  }
  const out = await session.run({
    [session.inputNames[0]]: new ort.Tensor("float32", input, [1, 3, YUNET_SIZE, YUNET_SIZE]),
  });

  let best = null;
  for (const s of [8, 16, 32]) {
    const cls = out[`cls_${s}`].data;
    const obj = out[`obj_${s}`].data;
    const box = out[`bbox_${s}`].data;
    const kps = out[`kps_${s}`].data;
    const cols = YUNET_SIZE / s;
    for (let i = 0; i < cls.length; i++) {
      const score = Math.sqrt(Math.min(1, Math.max(0, cls[i])) * Math.min(1, Math.max(0, obj[i])));
      if (best && score <= best.score) continue;
      const c = i % cols;
      const r = Math.floor(i / cols);
      const cx = (c + box[i * 4]) * s;
      const cy = (r + box[i * 4 + 1]) * s;
      const w = Math.exp(box[i * 4 + 2]) * s;
      const h = Math.exp(box[i * 4 + 3]) * s;
      const pts = [0, 1, 2, 3, 4].map((n) => ({
        x: (kps[i * 10 + n * 2] + c) * s / scale,
        y: (kps[i * 10 + n * 2 + 1] + r) * s / scale,
      }));
      best = {
        score,
        box: { x: (cx - w / 2) / scale, y: (cy - h / 2) / scale, w: w / scale, h: h / scale },
        eyes: [pts[0], pts[1]],
        nose: pts[2],
        mouth: [pts[3], pts[4]],
      };
    }
  }
  return best;
}

/** Crown (top of hair) from the mask, eye line and chin from the face landmarks. */
function detect(data, W, face) {
  const { box, eyes } = face;
  const x0 = Math.max(0, Math.round(box.x));
  const x1 = Math.min(W, Math.round(box.x + box.w));
  let crown = 0;
  find: for (let y = 0; y < box.y; y++) {
    let n = 0;
    for (let x = x0; x < x1; x++) if (data[(y * W + x) * 4 + 3] > 128) n++;
    if (n > (x1 - x0) * 0.05) {
      crown = y;
      break find;
    }
  }
  const eye = (eyes[0].y + eyes[1].y) / 2;
  const chin = box.y + box.h;
  return {
    crown,
    eye,
    chin,
    headH: chin - crown,
    headMax: box.w,
    cx: box.x + box.w / 2,
  };
}

/** Mean colour of face skin pixels (cheek/nose band, opaque, skin-like). */
function skinMean(data, W, d) {
  let r = 0;
  let g = 0;
  let b = 0;
  let n = 0;
  const y0 = Math.round(d.eye);
  const y1 = Math.round(d.chin - d.headH * 0.08);
  const x0 = Math.round(d.cx - d.headMax * 0.28);
  const x1 = Math.round(d.cx + d.headMax * 0.28);
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      const i = (y * W + x) * 4;
      const [R, G, B, A] = [data[i], data[i + 1], data[i + 2], data[i + 3]];
      const L = 0.2126 * R + 0.7152 * G + 0.0722 * B;
      if (A < 250 || L < 45 || L > 235 || !(R > G && G > B && R - B > 12)) continue;
      r += R;
      g += G;
      b += B;
      n++;
    }
  }
  return { r: r / n, g: g / n, b: b / n, n };
}

const clamp = (v, [lo, hi]) => Math.min(hi, Math.max(lo, v));
const lum = (c) => 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b;

/** Applies the per-channel exposure / colour-cast gains to the subject. */
function correct(data, gains) {
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] === 0) continue;
    data[i] = Math.min(255, data[i] * gains.r);
    data[i + 1] = Math.min(255, data[i + 1] * gains.g);
    data[i + 2] = Math.min(255, data[i + 2] * gains.b);
  }
}

/**
 * Edge colour decontamination: a semi-transparent edge pixel (hair, shirt
 * outline) still carries the old background's colour, which shows as a blue
 * or dark fringe on the new backdrop. Give each one the average colour of
 * the solid subject pixels around it; alpha is left untouched.
 */
function decontaminate(data, W, H) {
  const src = Uint8ClampedArray.from(data);
  const r = DECONTAMINATE_RADIUS;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4;
      const a = src[i + 3];
      if (a === 0 || a >= 250) continue;
      let sr = 0;
      let sg = 0;
      let sb = 0;
      let n = 0;
      for (let dy = -r; dy <= r; dy++) {
        const yy = y + dy;
        if (yy < 0 || yy >= H) continue;
        for (let dx = -r; dx <= r; dx++) {
          const xx = x + dx;
          if (xx < 0 || xx >= W) continue;
          const j = (yy * W + xx) * 4;
          if (src[j + 3] < 250) continue;
          sr += src[j];
          sg += src[j + 1];
          sb += src[j + 2];
          n++;
        }
      }
      if (n) {
        data[i] = sr / n;
        data[i + 1] = sg / n;
        data[i + 2] = sb / n;
      }
    }
  }
}

async function backdrop(size) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
    <defs><radialGradient id="g" cx="50%" cy="45%" r="72%">
      <stop offset="0%" stop-color="${BACKDROP_CENTRE}"/>
      <stop offset="100%" stop-color="${BACKDROP_EDGE}"/>
    </radialGradient></defs>
    <rect width="100%" height="100%" fill="url(#g)"/></svg>`;
  return sharp(Buffer.from(svg)).png().toBuffer();
}

/** Fades the subject's alpha towards any source edge that falls inside the frame (e.g. a body cut off above the frame bottom). */
function fadeCutEdges(data, size, edges) {
  const band = Math.round(size * 0.08);
  const fades = [];
  for (const [side, pos] of Object.entries(edges)) {
    if (pos === null) continue;
    fades.push(side);
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const dist = side === "bottom" ? pos - y : side === "left" ? x - pos : pos - x;
        if (dist >= band) continue;
        const i = (y * size + x) * 4 + 3;
        data[i] = dist <= 0 ? 0 : Math.round(data[i] * (dist / band));
      }
    }
  }
  return fades;
}

// ---------- pipeline ----------

const report = [];
const items = [];
const session = await yunet();
for (const id of ids) {
  const { data, info } = await sharp(cutout(id)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const W = info.width;
  const H = info.height;
  const face = await landmarks(session, path.join(RAW, `${id}.jpg`));
  if (!face || face.score < 0.6) throw new Error(`${id}: no confident face found (score ${face?.score?.toFixed(2)})`);
  const d = detect(data, W, face);
  const skin = skinMean(data, W, d);
  items.push({ id, data, W, H, d, face, skin });
}

// Set-wide targets: median face brightness, mean colour balance.
const Ls = items.map((it) => lum(it.skin)).sort((a, b) => a - b);
const targetL = Ls[Math.floor(Ls.length / 2)];
const ratio = (c) => ({ r: c.r / lum(c), g: c.g / lum(c), b: c.b / lum(c) });
const target = ["r", "g", "b"].reduce((t, ch) => {
  t[ch] = items.reduce((s, it) => s + ratio(it.skin)[ch], 0) / items.length;
  return t;
}, {});

const bg = await backdrop(OUT);
mkdirSync(DEBUG, { recursive: true });

for (const it of items) {
  const { id, data, W, H, d } = it;
  const exposure = clamp(targetL / lum(it.skin), EXPOSURE_CLAMP);
  const own = ratio(it.skin);
  const gains = {};
  for (const ch of ["r", "g", "b"]) {
    gains[ch] = exposure * clamp((target[ch] / own[ch]) ** CAST_STRENGTH, CAST_CLAMP);
  }
  correct(data, gains);
  decontaminate(data, W, H);

  // Square crop in source pixels.
  const S = d.headH / HEAD_FILL;
  const cropLeft = Math.round(d.cx - S / 2);
  const cropTop = Math.round(d.eye - EYE_LINE * S);
  const side = Math.round(S);

  // Extend the source with transparency wherever the crop runs past it.
  const pad = {
    top: Math.max(0, -cropTop),
    left: Math.max(0, -cropLeft),
    bottom: Math.max(0, cropTop + side - H),
    right: Math.max(0, cropLeft + side - W),
  };
  // sharp applies extract before extend within one pipeline, so pad first.
  const padded = await sharp(data, { raw: { width: W, height: H, channels: 4 } })
    .extend({ ...pad, background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .raw()
    .toBuffer({ resolveWithObject: true });
  const subject = await sharp(padded.data, { raw: padded.info })
    .extract({ left: cropLeft + pad.left, top: cropTop + pad.top, width: side, height: side })
    .resize(OUT, OUT, { kernel: "lanczos3" })
    .raw()
    .toBuffer();

  // Where the source's own edges land in the output — only matters if the
  // body is cut off inside the frame.
  const scale = OUT / side;
  const touches = (x0, x1, y0, y1) => {
    for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) if (data[(y * W + x) * 4 + 3] > 128) return true;
    return false;
  };
  const edges = {
    bottom: pad.bottom > 0 && touches(0, W, H - 2, H) ? Math.round((H - cropTop) * scale) : null,
    left: pad.left > 0 && touches(0, 2, 0, H) ? Math.round(-cropLeft * scale) : null,
    right: pad.right > 0 && touches(W - 2, W, 0, H) ? Math.round((W - cropLeft) * scale) : null,
  };
  const fades = fadeCutEdges(subject, OUT, edges);

  const finalPng = await sharp(bg)
    .composite([{ input: subject, raw: { width: OUT, height: OUT, channels: 4 } }])
    .png()
    .toBuffer();
  await sharp(finalPng).webp({ quality: QUALITY }).toFile(path.join(DIR, `${id}.webp`));
  await sharp(finalPng)
    .resize(SMALL, SMALL, { kernel: "lanczos3" })
    .webp({ quality: QUALITY })
    .toFile(path.join(DIR, `${id}-400.webp`));
  it.final = finalPng;

  if (args.has("--debug")) {
    const lines = [
      ["#e11d48", d.crown, "crown"],
      ["#16a34a", d.eye, "eyes"],
      ["#2563eb", d.chin, "chin"],
    ];
    const sw = Math.max(2, Math.round(W / 300));
    const { box, eyes, nose, mouth } = it.face;
    const dots = [...eyes, nose, ...mouth]
      .map((p) => `<circle cx="${p.x}" cy="${p.y}" r="${sw * 2.5}" fill="#facc15" stroke="#000" stroke-width="${sw / 2}"/>`)
      .join("");
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
      ${lines.map(([c, y, t]) => `<line x1="0" x2="${W}" y1="${y}" y2="${y}" stroke="${c}" stroke-width="${sw}"/><text x="8" y="${y - 6}" fill="${c}" font-size="${sw * 12}" font-family="sans-serif">${t}</text>`).join("")}
      <rect x="${box.x}" y="${box.y}" width="${box.w}" height="${box.h}" fill="none" stroke="#16a34a" stroke-width="${sw}"/>
      ${dots}
      <rect x="${cropLeft}" y="${cropTop}" width="${side}" height="${side}" fill="none" stroke="#c8922f" stroke-width="${sw * 2}" stroke-dasharray="${sw * 6} ${sw * 4}"/>
      <line x1="${d.cx}" x2="${d.cx}" y1="0" y2="${H}" stroke="#c8922f" stroke-width="${sw}"/></svg>`;
    // Composite at full size first; sharp resizes before compositing within one pipeline.
    const marked = await sharp(data, { raw: { width: W, height: H, channels: 4 } })
      .flatten({ background: "#9ca3af" })
      .composite([{ input: Buffer.from(svg) }])
      .png()
      .toBuffer();
    await sharp(marked).resize({ width: 600 }).png().toFile(path.join(DEBUG, `${id}.png`));
  }

  report.push({
    id,
    face: it.face.score.toFixed(2),
    source: `${W}x${H}`,
    crop: `${side}px`,
    upscale: `${(OUT / side).toFixed(2)}x`,
    exposure: exposure.toFixed(3),
    gains: `r${gains.r.toFixed(3)} g${gains.g.toFixed(3)} b${gains.b.toFixed(3)}`,
    faceSamples: it.skin.n,
    fadedEdges: fades.join(",") || "-",
  });
}

// Contact sheet: all seven side by side in circles, with a faint eye-line guide.
const D = 260;
const GAP = 28;
const M = 40;
const sheetW = M * 2 + COUNT * D + (COUNT - 1) * GAP;
const sheetH = M + D + 54;
const circles = await Promise.all(
  items.map(async (it) =>
    sharp(it.final)
      .resize(D, D, { kernel: "lanczos3" })
      .composite([
        {
          input: Buffer.from(`<svg width="${D}" height="${D}"><circle cx="${D / 2}" cy="${D / 2}" r="${D / 2}"/></svg>`),
          blend: "dest-in",
        },
      ])
      .png()
      .toBuffer()
  )
);
const eyeY = M + EYE_LINE * D;
const labels = items
  .map((it, i) => `<text x="${M + i * (D + GAP) + D / 2}" y="${M + D + 34}" text-anchor="middle" font-family="sans-serif" font-size="20" font-weight="600" fill="#24201a">${it.id}</text>`)
  .join("");
const overlay = `<svg xmlns="http://www.w3.org/2000/svg" width="${sheetW}" height="${sheetH}">
  <line x1="${M / 2}" x2="${sheetW - M / 2}" y1="${eyeY}" y2="${eyeY}" stroke="#c8922f" stroke-opacity="0.55" stroke-width="1.5" stroke-dasharray="6 6"/>
  ${labels}</svg>`;
await sharp({ create: { width: sheetW, height: sheetH, channels: 4, background: "#f6f1e7" } })
  .composite([
    ...circles.map((c, i) => ({ input: c, left: M + i * (D + GAP), top: M })),
    { input: Buffer.from(overlay), left: 0, top: 0 },
  ])
  .png()
  .toFile(path.join(DIR, "committee-contact-sheet.png"));

console.table(report);
console.log(`Targets — face luminance ${targetL.toFixed(1)}, balance r${target.r.toFixed(3)} g${target.g.toFixed(3)} b${target.b.toFixed(3)}`);
console.log(`Wrote ${COUNT * 2} webp files and committee-contact-sheet.png to ${DIR}/`);
