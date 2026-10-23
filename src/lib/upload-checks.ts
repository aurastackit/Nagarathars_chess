import {
  UPLOAD_MAX_BYTES,
  UPLOAD_TYPES,
  formatUploadLimit,
  type UploadKind,
} from "@/lib/upload-limits";

/** Photos bigger than this are refused before shrinking (it could stall a phone). */
export const MAX_SOURCE_IMAGE_BYTES = 25 * 1024 * 1024;

export function formatBytes(bytes: number) {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

/**
 * What's wrong with a file before anything is uploaded, in words a player can
 * act on — or null if it can go ahead (photos are then shrunk automatically).
 */
export function checkBeforeUpload(kind: UploadKind, file: { type: string; size: number }) {
  const allowed = UPLOAD_TYPES[kind] as readonly string[];
  if (!allowed.includes(file.type)) {
    return kind === "passportPhoto"
      ? "The photo must be a JPG, PNG or WEBP image."
      : "The age proof must be a JPG, PNG, WEBP image or a PDF.";
  }
  if (file.type === "application/pdf" && file.size > UPLOAD_MAX_BYTES[kind]) {
    return `This PDF is ${formatBytes(file.size)} — it must be under ${formatUploadLimit(kind)}. Scan it at a lower quality, or upload a photo of the document instead (photos are shrunk automatically).`;
  }
  if (file.type.startsWith("image/") && file.size > MAX_SOURCE_IMAGE_BYTES) {
    return `This image is ${formatBytes(file.size)} — too large to process. Please choose one under 25 MB.`;
  }
  return null;
}
