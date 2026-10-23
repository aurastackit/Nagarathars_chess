"use client";

import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { Modal } from "@/components/modal";
import { Button } from "@/components/ui";
import {
  FACE_GUIDE,
  FRAME,
  MAX_ZOOM,
  MIN_ZOOM,
  OUTPUT,
  centreOnFace,
  clampCenter,
  coverScale,
  initialPlacement,
  sourceRect,
  zoomAroundMiddle,
  type Point,
  type Size,
} from "@/lib/photo-crop";

type FaceDetectorLike = {
  detect(image: HTMLImageElement): Promise<{ boundingBox: DOMRectReadOnly }[]>;
};
type FaceDetectorCtor = new (options: {
  fastMode: boolean;
  maxDetectedFaces: number;
}) => FaceDetectorLike;

/** The oval the face should fill, as an SVG path (with the rest of the frame shaded). */
const OVAL = {
  cx: FRAME.w * FACE_GUIDE.cx,
  cy: FRAME.h * FACE_GUIDE.cy,
  rx: FRAME.w * FACE_GUIDE.rx,
  ry: FRAME.h * FACE_GUIDE.ry,
};
const SHADE = `M0 0H${FRAME.w}V${FRAME.h}H0Z M${OVAL.cx - OVAL.rx} ${OVAL.cy} a${OVAL.rx} ${OVAL.ry} 0 1 0 ${OVAL.rx * 2} 0 a${OVAL.rx} ${OVAL.ry} 0 1 0 ${-OVAL.rx * 2} 0Z`;

/**
 * Crop a passport photo so the face is centred: drag to move, slider (or
 * pinch / mouse wheel / + −) to zoom, with an oval to put the face in. Where
 * the browser can find faces (Chrome on Android and macOS) it starts centred
 * on the face. Saves a 600 × 750 JPEG.
 */
export function PhotoCropper({
  file,
  onCancel,
  onConfirm,
}: {
  file: File;
  onCancel: () => void;
  onConfirm: (cropped: File) => void;
}) {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [size, setSize] = useState<Size | null>(null);
  const [zoom, setZoom] = useState(1);
  const [center, setCenter] = useState<Point>({ x: FRAME.w / 2, y: FRAME.h / 2 });
  const [faceFound, setFaceFound] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const pointers = useRef(new Map<number, Point>());
  const gesture = useRef<{ start: Point; from: Point; distance: number; zoom: number } | null>(
    null
  );

  useEffect(() => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = async () => {
      const natural = { w: img.naturalWidth, h: img.naturalHeight };
      let placement = initialPlacement(natural);
      const Detector = (window as unknown as { FaceDetector?: FaceDetectorCtor }).FaceDetector;
      if (Detector) {
        try {
          const [face] = await new Detector({ fastMode: true, maxDetectedFaces: 1 }).detect(img);
          if (face) {
            const b = face.boundingBox;
            placement = centreOnFace({ x: b.x, y: b.y, width: b.width, height: b.height }, natural);
            setFaceFound(true);
          }
        } catch {
          // No face detection here: the player places it by hand.
        }
      }
      setImage(img);
      setSize(natural);
      setZoom(placement.zoom);
      setCenter(placement.center);
    };
    img.onerror = () => setError("This image can't be opened. Please choose a JPG or PNG photo.");
    img.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const scale = size ? coverScale(size) * zoom : 1;
  const moveTo = (c: Point, z = zoom) => size && setCenter(clampCenter(c, size, z));
  const zoomTo = (z: number) => {
    if (!size) return;
    const next = zoomAroundMiddle(center, size, zoom, z);
    setZoom(next.zoom);
    setCenter(next.center);
  };

  const local = (e: PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, local(e));
    const pts = [...pointers.current.values()];
    gesture.current = {
      start: pts[0],
      from: center,
      distance: pts.length > 1 ? Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y) : 0,
      zoom,
    };
  };
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!pointers.current.has(e.pointerId) || !gesture.current || !size) return;
    pointers.current.set(e.pointerId, local(e));
    const pts = [...pointers.current.values()];
    const g = gesture.current;
    if (pts.length > 1 && g.distance > 0) {
      // Pinch: zoom by the change in distance between two fingers.
      const d = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      const next = zoomAroundMiddle(g.from, size, g.zoom, (g.zoom * d) / g.distance);
      setZoom(next.zoom);
      setCenter(next.center);
    } else {
      moveTo({ x: g.from.x + pts[0].x - g.start.x, y: g.from.y + pts[0].y - g.start.y });
    }
  };
  const onPointerUp = (e: PointerEvent<HTMLDivElement>) => {
    pointers.current.delete(e.pointerId);
    const pts = [...pointers.current.values()];
    gesture.current = pts.length ? { start: pts[0], from: center, distance: 0, zoom } : null;
  };
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const step = e.shiftKey ? 24 : 8;
    const moves: Record<string, Point> = {
      ArrowLeft: { x: center.x - step, y: center.y },
      ArrowRight: { x: center.x + step, y: center.y },
      ArrowUp: { x: center.x, y: center.y - step },
      ArrowDown: { x: center.x, y: center.y + step },
    };
    if (moves[e.key]) {
      e.preventDefault();
      moveTo(moves[e.key]);
    } else if (e.key === "+" || e.key === "=") {
      e.preventDefault();
      zoomTo(zoom * 1.1);
    } else if (e.key === "-") {
      e.preventDefault();
      zoomTo(zoom / 1.1);
    }
  };

  async function save() {
    if (!image || !size) return;
    setSaving(true);
    try {
      const canvas = document.createElement("canvas");
      canvas.width = OUTPUT.w;
      canvas.height = OUTPUT.h;
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, OUTPUT.w, OUTPUT.h);
      const { sx, sy, sw, sh } = sourceRect(center, size, zoom);
      ctx.drawImage(image, sx, sy, sw, sh, 0, 0, OUTPUT.w, OUTPUT.h);
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/jpeg", 0.9)
      );
      if (!blob) throw new Error("The photo couldn't be saved — please try another one.");
      onConfirm(new File([blob], "passport-photo.jpg", { type: "image/jpeg" }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "The photo couldn't be saved.");
      setSaving(false);
    }
  }

  return (
    <Modal title="Crop your passport photo" onClose={onCancel} wide>
      <p className="text-sm text-foreground/75">
        Drag the photo and zoom so your face fills the oval, eyes about halfway down.
      </p>
      <p lang="ta" className="mt-1 text-xs text-foreground/60">
        முகம் நீள்வட்டத்தின் நடுவில் தெளிவாகத் தெரியும்படி படத்தை நகர்த்திப் பெரிதாக்கவும்.
      </p>
      {faceFound && (
        <p className="mt-2 text-xs font-medium text-green-800" role="status">
          We found your face and centred it — adjust if needed.
        </p>
      )}
      <div className="mt-4 flex flex-col items-center gap-3">
        <div
          role="group"
          aria-label="Photo position: drag, or use the arrow keys to move and + or − to zoom"
          tabIndex={0}
          data-testid="crop-frame"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onWheel={(e) => zoomTo(zoom * (e.deltaY < 0 ? 1.08 : 1 / 1.08))}
          onKeyDown={onKeyDown}
          className="relative cursor-grab touch-none select-none overflow-hidden rounded-md bg-charcoal/10 outline-none focus-visible:ring-2 focus-visible:ring-charcoal active:cursor-grabbing"
          style={{ width: FRAME.w, height: FRAME.h }}
        >
          {image && size ? (
            // eslint-disable-next-line @next/next/no-img-element -- a local file being cropped, not a site image
            <img
              src={image.src}
              alt="Your photo"
              draggable={false}
              className="pointer-events-none absolute max-w-none"
              style={{
                width: size.w * scale,
                height: size.h * scale,
                left: center.x - (size.w * scale) / 2,
                top: center.y - (size.h * scale) / 2,
              }}
            />
          ) : (
            !error && (
              <p className="absolute inset-0 flex items-center justify-center text-xs text-foreground/50">
                Opening the photo…
              </p>
            )
          )}
          <svg
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            width={FRAME.w}
            height={FRAME.h}
          >
            <path d={SHADE} fill="rgba(23,20,15,0.45)" fillRule="evenodd" />
            <ellipse
              cx={OVAL.cx}
              cy={OVAL.cy}
              rx={OVAL.rx}
              ry={OVAL.ry}
              fill="none"
              stroke="#fff"
              strokeWidth="2"
              strokeDasharray="6 5"
            />
          </svg>
        </div>
        <label className="flex w-full max-w-[16rem] items-center gap-3 text-sm">
          <span className="text-foreground/70">Zoom</span>
          <input
            type="range"
            min={MIN_ZOOM}
            max={MAX_ZOOM}
            step={0.01}
            value={zoom}
            onChange={(e) => zoomTo(Number(e.target.value))}
            disabled={!size}
            className="flex-1 accent-[var(--charcoal)]"
          />
        </label>
      </div>
      {error && (
        <p role="alert" className="mt-3 text-sm text-red-700">
          {error}
        </p>
      )}
      <div className="mt-5 flex gap-2">
        <Button type="button" onClick={save} disabled={!size || saving} className="flex-1">
          {saving ? "Saving…" : "Use this photo"}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          Choose another
        </Button>
      </div>
    </Modal>
  );
}
