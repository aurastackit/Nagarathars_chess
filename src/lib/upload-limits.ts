/**
 * What a registrant may upload, shared by the browser (to compress and check
 * before uploading) and the presign route (which signs the exact size into the
 * S3 URL, so S3 itself rejects anything else).
 */
export const UPLOAD_TYPES = {
  ageProof: ["image/jpeg", "image/png", "image/webp", "application/pdf"],
  passportPhoto: ["image/jpeg", "image/png", "image/webp"],
} as const;

export const UPLOAD_MAX_BYTES = {
  ageProof: 1024 * 1024,
  passportPhoto: 512 * 1024,
} as const;

export type UploadKind = keyof typeof UPLOAD_MAX_BYTES;

/**
 * Documents are only ever reached through short-lived signed S3 URLs: an
 * upload must start within 5 minutes, a viewing link works for 2.
 */
export const UPLOAD_URL_TTL_SECONDS = 300;
export const DOCUMENT_URL_TTL_SECONDS = 120;

export const ALL_UPLOAD_TYPES = UPLOAD_TYPES.ageProof;

/** "1 MB", "512 KB". */
export function formatUploadLimit(kind: UploadKind) {
  const bytes = UPLOAD_MAX_BYTES[kind];
  return bytes >= 1024 * 1024 ? `${bytes / (1024 * 1024)} MB` : `${bytes / 1024} KB`;
}

export function isAllowedUpload(kind: UploadKind, contentType: string, size: number) {
  return (
    (UPLOAD_TYPES[kind] as readonly string[]).includes(contentType) &&
    Number.isInteger(size) &&
    size > 0 &&
    size <= UPLOAD_MAX_BYTES[kind]
  );
}
