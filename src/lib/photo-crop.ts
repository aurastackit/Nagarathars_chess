/**
 * Geometry for the passport-photo crop tool. The photo is shown in a 4:5 frame
 * and can be moved and zoomed; `center` is where the image's middle sits in
 * frame pixels. The image always covers the whole frame, so the crop never has
 * empty edges. Pure, so it's unit-tested.
 */

export type Size = { w: number; h: number };
export type Point = { x: number; y: number };

/** On-screen crop frame (CSS px) and the saved photo (px): both 4:5, like a passport photo. */
export const FRAME: Size = { w: 240, h: 300 };
export const OUTPUT: Size = { w: 600, h: 750 };
/** The oval the face should fill, as fractions of the frame. */
export const FACE_GUIDE = { cx: 0.5, cy: 0.43, rx: 0.3, ry: 0.31 };
export const MIN_ZOOM = 1;
export const MAX_ZOOM = 4;

/** Scale at which the image just covers the frame (zoom 1). */
export function coverScale(img: Size, frame: Size = FRAME) {
  return Math.max(frame.w / img.w, frame.h / img.h);
}

export const clampZoom = (z: number) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z));

/** Keeps the image covering the frame at this zoom. */
export function clampCenter(center: Point, img: Size, zoom: number, frame: Size = FRAME): Point {
  const s = coverScale(img, frame) * zoom;
  const halfW = (img.w * s) / 2;
  const halfH = (img.h * s) / 2;
  return {
    x: Math.min(halfW, Math.max(frame.w - halfW, center.x)),
    y: Math.min(halfH, Math.max(frame.h - halfH, center.y)),
  };
}

/** The part of the original image that's inside the frame, in image pixels (for drawImage). */
export function sourceRect(center: Point, img: Size, zoom: number, frame: Size = FRAME) {
  const s = coverScale(img, frame) * zoom;
  const left = center.x - (img.w * s) / 2;
  const top = center.y - (img.h * s) / 2;
  return { sx: -left / s, sy: -top / s, sw: frame.w / s, sh: frame.h / s };
}

/** Starting position: centred, a little towards the top (where faces usually are). */
export function initialPlacement(img: Size, frame: Size = FRAME) {
  const center = clampCenter({ x: frame.w / 2, y: frame.h * 0.6 }, img, 1, frame);
  return { zoom: 1, center };
}

/**
 * Zoom and position that put a detected face (image pixels) in the oval guide,
 * about as wide as the guide.
 */
export function centreOnFace(
  face: { x: number; y: number; width: number; height: number },
  img: Size,
  frame: Size = FRAME
) {
  const cover = coverScale(img, frame);
  const targetScale = (frame.w * FACE_GUIDE.rx * 1.7) / face.width;
  const zoom = clampZoom(targetScale / cover);
  const s = cover * zoom;
  const fx = face.x + face.width / 2;
  const fy = face.y + face.height / 2;
  const center = clampCenter(
    {
      x: frame.w * FACE_GUIDE.cx - (fx - img.w / 2) * s,
      y: frame.h * FACE_GUIDE.cy - (fy - img.h / 2) * s,
    },
    img,
    zoom,
    frame
  );
  return { zoom, center };
}

/** Zooms around the frame's middle, keeping what's there in the middle. */
export function zoomAroundMiddle(
  center: Point,
  img: Size,
  from: number,
  to: number,
  frame: Size = FRAME
) {
  const zoom = clampZoom(to);
  const ratio = zoom / from;
  const mid = { x: frame.w / 2, y: frame.h / 2 };
  return {
    zoom,
    center: clampCenter(
      { x: mid.x + (center.x - mid.x) * ratio, y: mid.y + (center.y - mid.y) * ratio },
      img,
      zoom,
      frame
    ),
  };
}
