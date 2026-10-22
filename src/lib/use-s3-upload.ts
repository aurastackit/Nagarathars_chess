"use client";

import { useState } from "react";
import { compressIfImage } from "@/lib/image-compression";
import {
  UPLOAD_MAX_BYTES,
  UPLOAD_TYPES,
  formatUploadLimit,
  type UploadKind,
} from "@/lib/upload-limits";

export type { UploadKind };

// Compression targets sit a little under the hard limits the server signs into the URL.
const COMPRESS_TO_MB: Record<UploadKind, number> = { ageProof: 0.9, passportPhoto: 0.45 };
// Passport photos are stored as JPEG so they can be printed on the ID card.
const ENCODE_AS: Partial<Record<UploadKind, string>> = { passportPhoto: "image/jpeg" };

export function useS3Upload(tournamentSlug: string) {
  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);

  async function upload(kind: UploadKind, file: File): Promise<string> {
    setError(null);
    if (!(UPLOAD_TYPES[kind] as readonly string[]).includes(file.type)) {
      const msg =
        kind === "passportPhoto"
          ? "Only JPG, PNG, or WEBP images are allowed"
          : "Only JPG, PNG, WEBP, or PDF files are allowed";
      setError(msg);
      throw new Error(msg);
    }

    setUploading((s) => ({ ...s, [kind]: true }));
    try {
      const compressed = await compressIfImage(file, COMPRESS_TO_MB[kind], ENCODE_AS[kind]);

      if (compressed.size > UPLOAD_MAX_BYTES[kind]) {
        throw new Error(`File must be under ${formatUploadLimit(kind)}`);
      }

      const presignRes = await fetch("/api/uploads/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tournamentSlug,
          kind,
          contentType: compressed.type,
          size: compressed.size,
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

      return key;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Upload failed";
      setError(message);
      throw err;
    } finally {
      setUploading((s) => ({ ...s, [kind]: false }));
    }
  }

  return { upload, uploading, error };
}
