import { randomUUID } from "crypto";
import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const REGION = process.env.S3_REGION;
const BUCKET = process.env.S3_BUCKET_NAME;

export function isS3Configured() {
  return Boolean(REGION && BUCKET && process.env.S3_ACCESS_KEY_ID && process.env.S3_SECRET_ACCESS_KEY);
}

function getClient() {
  return new S3Client({
    region: REGION,
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID!,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
    },
  });
}

export const ALLOWED_UPLOAD_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"] as const;
export type UploadKind = "ageProof" | "passportPhoto";

const EXT_BY_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "application/pdf": "pdf",
};

/**
 * Issues a pre-signed PUT URL for a private object under `registrations/`.
 * The bucket has no public access — objects are only ever reachable via a
 * short-lived signed URL (this one for upload, `getDownloadUrl` for viewing).
 */
export async function createUploadUrl(params: { tournamentSlug: string; kind: UploadKind; contentType: string }) {
  if (!isS3Configured()) {
    throw new Error("S3 is not configured — set S3_BUCKET_NAME, S3_REGION, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY");
  }
  if (!ALLOWED_UPLOAD_TYPES.includes(params.contentType as (typeof ALLOWED_UPLOAD_TYPES)[number])) {
    throw new Error("Unsupported file type");
  }
  const ext = EXT_BY_TYPE[params.contentType];
  const key = `registrations/${params.tournamentSlug}/${params.kind}-${randomUUID()}.${ext}`;
  const client = getClient();
  const command = new PutObjectCommand({ Bucket: BUCKET, Key: key, ContentType: params.contentType });
  const uploadUrl = await getSignedUrl(client, command, { expiresIn: 300 });
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
