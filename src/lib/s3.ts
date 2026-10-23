import "server-only";
import { randomUUID } from "crypto";
import {
  DeleteObjectsCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import {
  DOCUMENT_URL_TTL_SECONDS,
  UPLOAD_URL_TTL_SECONDS,
  isAllowedUpload,
  type UploadKind,
} from "@/lib/upload-limits";

const REGION = process.env.S3_REGION;
const BUCKET = process.env.S3_BUCKET_NAME;

export function isS3Configured() {
  return Boolean(
    REGION && BUCKET && process.env.S3_ACCESS_KEY_ID && process.env.S3_SECRET_ACCESS_KEY
  );
}

function getClient() {
  return new S3Client({
    region: REGION,
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID!,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
    },
    // No checksum of the (empty) body in presigned URLs — the browser sends the real body later.
    requestChecksumCalculation: "WHEN_REQUIRED",
  });
}

const EXT_BY_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "application/pdf": "pdf",
};

/**
 * Issues a pre-signed PUT URL for a private object under `registrations/`.
 * Content-Type and the exact Content-Length are part of the signature, so S3
 * rejects an upload of a different type or size (the caller checks the limits).
 * The bucket has no public access — objects are only ever reachable via a
 * short-lived signed URL (this one for upload, `getDownloadUrl` for viewing).
 */
export async function createUploadUrl(params: {
  tournamentSlug: string;
  kind: UploadKind;
  contentType: string;
  size: number;
}) {
  if (!isS3Configured()) {
    throw new Error(
      "S3 is not configured — set S3_BUCKET_NAME, S3_REGION, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY"
    );
  }
  if (!isAllowedUpload(params.kind, params.contentType, params.size)) {
    throw new Error("Unsupported file type or size");
  }
  const ext = EXT_BY_TYPE[params.contentType];
  const key = `registrations/${params.tournamentSlug}/${params.kind}-${randomUUID()}.${ext}`;
  const client = getClient();
  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ContentType: params.contentType,
    ContentLength: params.size,
  });
  const uploadUrl = await getSignedUrl(client, command, {
    expiresIn: UPLOAD_URL_TTL_SECONDS,
    signableHeaders: new Set(["content-type", "content-length"]),
  });
  return { uploadUrl, key };
}

/**
 * Short-lived signed GET URL for viewing a private document (admin use only).
 * With `downloadAs`, S3 serves it as an attachment with that file name.
 */
export async function getDownloadUrl(key: string, downloadAs?: string) {
  if (!isS3Configured()) {
    throw new Error("S3 is not configured");
  }
  const client = getClient();
  const command = new GetObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ...(downloadAs && { ResponseContentDisposition: `attachment; filename="${downloadAs}"` }),
  });
  return getSignedUrl(client, command, { expiresIn: DOCUMENT_URL_TTL_SECONDS });
}

/**
 * Signed GET URL for playing back a gallery highlight video. Longer-lived than
 * `getDownloadUrl` (that 120s window is fine for an admin opening one document, but a
 * visitor browsing the gallery needs the clip to keep playing for the length of their
 * visit) — acceptable since these are public promotional clips, not private documents.
 */
export async function getSignedVideoUrl(key: string) {
  if (!isS3Configured()) {
    throw new Error("S3 is not configured");
  }
  const client = getClient();
  const command = new GetObjectCommand({ Bucket: BUCKET, Key: key });
  return getSignedUrl(client, command, { expiresIn: 3600 });
}

/** Tournament posters: public images, uploaded by admins under `posters/`. */
export const POSTER_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const POSTER_MAX_BYTES = 3 * 1024 * 1024;
/** File names the poster route will serve: `<uuid>.<ext>`, nothing else in the bucket. */
export const POSTER_FILE_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp)$/;

/** Signed PUT for a new poster (type and exact size are signed). Returns the public path it will be served from. */
export async function createPosterUploadUrl(params: { contentType: string; size: number }) {
  if (!isS3Configured()) throw new Error("S3 is not configured");
  if (
    !(POSTER_TYPES as readonly string[]).includes(params.contentType) ||
    !Number.isInteger(params.size) ||
    params.size <= 0 ||
    params.size > POSTER_MAX_BYTES
  ) {
    throw new Error("Unsupported poster type or size");
  }
  const file = `${randomUUID()}.${EXT_BY_TYPE[params.contentType]}`;
  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: `posters/${file}`,
    ContentType: params.contentType,
    ContentLength: params.size,
  });
  const uploadUrl = await getSignedUrl(getClient(), command, {
    expiresIn: UPLOAD_URL_TTL_SECONDS,
    signableHeaders: new Set(["content-type", "content-length"]),
  });
  return { uploadUrl, path: `/media/posters/${file}` };
}

/** Reads a poster for the public /media/posters route; null if it doesn't exist. */
export async function getPosterObject(file: string) {
  if (!isS3Configured() || !POSTER_FILE_PATTERN.test(file)) return null;
  try {
    const res = await getClient().send(
      new GetObjectCommand({ Bucket: BUCKET, Key: `posters/${file}` })
    );
    if (!res.Body) return null;
    return { body: res.Body.transformToWebStream(), contentType: res.ContentType ?? "image/jpeg" };
  } catch (err) {
    // Without s3:ListBucket, S3 reports a missing key as AccessDenied rather than NoSuchKey.
    const name = (err as { name?: string }).name;
    if (name === "NoSuchKey" || name === "AccessDenied") return null;
    throw err;
  }
}

/** A private object's bytes (server use: ID-card photos and cached PDFs); null if it doesn't exist. */
export async function getObjectBytes(key: string) {
  if (!isS3Configured()) return null;
  try {
    const res = await getClient().send(new GetObjectCommand({ Bucket: BUCKET, Key: key }));
    if (!res.Body) return null;
    return Buffer.from(await res.Body.transformToByteArray());
  } catch (err) {
    const name = (err as { name?: string }).name;
    if (name === "NoSuchKey" || name === "AccessDenied") return null;
    throw err;
  }
}

/**
 * The first `bytes` bytes of a private object (to check what an upload really
 * is); null if it doesn't exist. Other S3 errors are thrown.
 */
export async function getObjectHead(key: string, bytes: number) {
  if (!isS3Configured()) throw new Error("S3 is not configured");
  try {
    const res = await getClient().send(
      new GetObjectCommand({ Bucket: BUCKET, Key: key, Range: `bytes=0-${bytes - 1}` })
    );
    if (!res.Body) return null;
    return new Uint8Array(await res.Body.transformToByteArray());
  } catch (err) {
    const name = (err as { name?: string }).name;
    if (name === "NoSuchKey" || name === "AccessDenied") return null;
    throw err;
  }
}

/** Stores a private object (the ID-card PDF cache under `id-cards/`). */
export async function putObjectBytes(key: string, body: Buffer, contentType: string) {
  if (!isS3Configured()) throw new Error("S3 is not configured");
  await getClient().send(
    new PutObjectCommand({ Bucket: BUCKET, Key: key, Body: body, ContentType: contentType })
  );
}

/**
 * Deletes private objects (a registration's documents, cached ID cards). Returns
 * the keys S3 couldn't delete with the reason, so the caller can report them.
 * Keys that don't exist count as deleted.
 */
export async function deleteObjects(keys: string[]) {
  const unique = [...new Set(keys.filter(Boolean))];
  if (unique.length === 0)
    return { deleted: [] as string[], failed: [] as { key: string; error: string }[] };
  if (!isS3Configured()) {
    return { deleted: [], failed: unique.map((key) => ({ key, error: "S3 is not configured" })) };
  }
  try {
    const res = await getClient().send(
      new DeleteObjectsCommand({
        Bucket: BUCKET,
        Delete: { Objects: unique.map((Key) => ({ Key })), Quiet: true },
      })
    );
    const failed = (res.Errors ?? []).map((e) => ({
      key: e.Key ?? "?",
      error: e.Code ?? e.Message ?? "error",
    }));
    return { deleted: unique.filter((k) => !failed.some((f) => f.key === k)), failed };
  } catch (err) {
    const error = (err as { name?: string }).name ?? (err instanceof Error ? err.message : "error");
    return { deleted: [], failed: unique.map((key) => ({ key, error })) };
  }
}

/**
 * Keys under a prefix (e.g. a registration's cached ID cards). Needs
 * s3:ListBucket; without it this returns null and the caller carries on.
 */
export async function listKeys(prefix: string) {
  if (!isS3Configured()) return null;
  try {
    const res = await getClient().send(
      new ListObjectsV2Command({ Bucket: BUCKET, Prefix: prefix })
    );
    return (res.Contents ?? []).map((o) => o.Key!).filter(Boolean);
  } catch (err) {
    console.error(`[s3] could not list ${prefix}:`, (err as { name?: string }).name ?? err);
    return null;
  }
}
