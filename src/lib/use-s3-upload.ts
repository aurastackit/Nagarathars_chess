"use client";

import { useState } from "react";
import { compressIfImage } from "@/lib/image-compression";

export type UploadKind = "ageProof" | "passportPhoto";

const MAX_SIZE_BYTES = { ageProof: 5 * 1024 * 1024, passportPhoto: 2 * 1024 * 1024 } as const;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

export function useS3Upload(tournamentSlug: string) {
  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);

  async function upload(kind: UploadKind, file: File): Promise<string> {
    setError(null);
    if (!ALLOWED_TYPES.includes(file.type)) {
      const msg = "Only JPG, PNG, WEBP, or PDF files are allowed";
      setError(msg);
      throw new Error(msg);
    }

    setUploading((s) => ({ ...s, [kind]: true }));
    try {
      const compressed =
        kind === "passportPhoto"
          ? await compressIfImage(file)
          : file.type.startsWith("image/")
            ? await compressIfImage(file)
            : file;

      if (compressed.size > MAX_SIZE_BYTES[kind]) {
        const maxMb = MAX_SIZE_BYTES[kind] / (1024 * 1024);
        throw new Error(`File must be under ${maxMb}MB`);
      }

      const presignRes = await fetch("/api/uploads/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tournamentSlug, kind, contentType: compressed.type }),
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
