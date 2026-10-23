import { UPLOAD_TYPES, type UploadKind } from "@/lib/upload-limits";

/**
 * What a file really is, from its first bytes ("magic numbers") — not its
 * name or the type the browser claims. Shared by the browser (before upload)
 * and the server (after upload, reading the stored object).
 */
export type DetectedType = "image/jpeg" | "image/png" | "image/webp" | "application/pdf";

/** How many leading bytes detection reads (a PDF's header may come after a little junk). */
export const SIGNATURE_BYTES = 1024;

const startsWith = (b: Uint8Array, sig: number[], at = 0) => sig.every((v, i) => b[at + i] === v);
const PDF_HEADER = [0x25, 0x50, 0x44, 0x46, 0x2d]; // %PDF-

export function detectFileType(bytes: Uint8Array): DetectedType | null {
  if (startsWith(bytes, [0xff, 0xd8, 0xff])) return "image/jpeg";
  if (startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return "image/png";
  // RIFF....WEBP
  if (
    startsWith(bytes, [0x52, 0x49, 0x46, 0x46]) &&
    startsWith(bytes, [0x57, 0x45, 0x42, 0x50], 8)
  ) {
    return "image/webp";
  }
  // PDF readers accept the header anywhere in the first 1 KB.
  const end = Math.min(bytes.length, SIGNATURE_BYTES) - PDF_HEADER.length;
  for (let i = 0; i <= end; i++) {
    if (startsWith(bytes, PDF_HEADER, i)) return "application/pdf";
  }
  return null;
}

/** Whether these bytes are an allowed file for this upload; the reason if not. */
export function checkFileContent(kind: UploadKind, bytes: Uint8Array) {
  const type = detectFileType(bytes);
  const allowed = UPLOAD_TYPES[kind] as readonly string[];
  if (type && allowed.includes(type)) return { ok: true as const, type };
  return {
    ok: false as const,
    type,
    message:
      kind === "passportPhoto"
        ? "This file isn't a real JPG, PNG or WEBP image (whatever its name says). Please choose a photo."
        : "This file isn't a real JPG, PNG, WEBP image or PDF (whatever its name says). Please choose the document again.",
  };
}

/** The type a stored key's extension says (keys are made by createUploadUrl). */
export function typeFromKey(key: string): DetectedType | null {
  const ext = key.split(".").pop()?.toLowerCase();
  return ext === "jpg" || ext === "jpeg"
    ? "image/jpeg"
    : ext === "png"
      ? "image/png"
      : ext === "webp"
        ? "image/webp"
        : ext === "pdf"
          ? "application/pdf"
          : null;
}
