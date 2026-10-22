import { randomUUID } from "crypto";
import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { isAllowedUpload, type UploadKind } from "@/lib/upload-limits";

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
    expiresIn: 300,
    signableHeaders: new Set(["content-type", "content-length"]),
  });
  return { uploadUrl, key };
}

/** Short-lived signed GET URL for viewing a private document (admin use only). */
export async function getDownloadUrl(key: string) {
  if (!isS3Configured()) {
    throw new Error("S3 is not configured");
  }
  const client = getClient();
  const command = new GetObjectCommand({ Bucket: BUCKET, Key: key });
  return getSignedUrl(client, command, { expiresIn: 120 });
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
