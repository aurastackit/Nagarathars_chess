"use client";

import { useState } from "react";
import { compressIfImage } from "@/lib/image-compression";
import { checkBeforeUpload, formatBytes } from "@/lib/upload-checks";
import { UPLOAD_MAX_BYTES, formatUploadLimit, type UploadKind } from "@/lib/upload-limits";

export type { UploadKind };

// Compression targets sit a little under the hard limits the server signs into the URL.
const COMPRESS_TO_MB: Record<UploadKind, number> = { ageProof: 0.9, passportPhoto: 0.45 };
// Passport photos are stored as JPEG so they can be printed on the ID card.
const ENCODE_AS: Partial<Record<UploadKind, string>> = { passportPhoto: "image/jpeg" };

/** What happened to the last file of each kind, for the field to show. */
export type UploadInfo = { name: string; before: number; after: number };

/**
 * Uploads a registration document straight to S3: checks the type and size in
 * the browser first, shrinks photos, then asks the server for a signed URL.
 * `registrationId` is for a signed-in player replacing a document on their own
 * registration (allowed even after registration closes).
 */
export function useS3Upload(tournamentSlug: string, registrationId?: string) {
  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<Partial<Record<UploadKind, UploadInfo>>>({});

  async function upload(kind: UploadKind, file: File): Promise<string> {
    setError(null);
    const problem = checkBeforeUpload(kind, file);
    if (problem) {
      setError(problem);
      throw new Error(problem);
    }

    setUploading((s) => ({ ...s, [kind]: true }));
    try {
      const compressed = await compressIfImage(file, COMPRESS_TO_MB[kind], ENCODE_AS[kind]);
      if (compressed.size > UPLOAD_MAX_BYTES[kind]) {
        throw new Error(
          `The file is still ${formatBytes(compressed.size)} after shrinking — it must be under ${formatUploadLimit(kind)}.`
        );
      }

      const presignRes = await fetch("/api/uploads/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tournamentSlug,
          kind,
          contentType: compressed.type,
          size: compressed.size,
          ...(registrationId && { registrationId }),
        }),
      });
      if (!presignRes.ok) {
        const body = await presignRes.json().catch(() => null);
        throw new Error(body?.error ?? "Could not start the upload");
      }
      const { uploadUrl, key } = await presignRes.json();

      const putRes = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": compressed.type },
        body: compressed,
      });
      if (!putRes.ok) {
        throw new Error("Upload failed — please try again");
      }

      setInfo((s) => ({
        ...s,
        [kind]: { name: file.name, before: file.size, after: compressed.size },
      }));
      return key;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Upload failed";
      setError(message);
      throw err;
    } finally {
      setUploading((s) => ({ ...s, [kind]: false }));
    }
  }

  return { upload, uploading, error, info };
}
