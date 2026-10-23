"use client";

import { useState } from "react";
import { compressIfImage } from "@/lib/image-compression";
import { formatBytes, inspectFile, readFileHead } from "@/lib/upload-checks";
import { checkFileContent } from "@/lib/file-signature";
import { UPLOAD_MAX_BYTES, formatUploadLimit, type UploadKind } from "@/lib/upload-limits";

export type { UploadKind };

// Compression targets sit a little under the hard limits the server signs into the URL.
const COMPRESS_TO_MB: Record<UploadKind, number> = { ageProof: 0.9, passportPhoto: 0.45 };
// Passport photos are stored as JPEG so they can be printed on the ID card.
const ENCODE_AS: Partial<Record<UploadKind, string>> = { passportPhoto: "image/jpeg" };

/** What happened to the last file of each kind, for the field to show. */
export type UploadInfo = { name: string; before: number; after: number };

/**
 * Uploads a registration document straight to S3: checks the content and size
 * in the browser first, shrinks photos, then asks the server for a signed URL.
 * `registrationId` is for a signed-in player replacing a document on their own
 * registration (allowed even after registration closes). `onVerifyEmail` runs
 * when the server says this browser's email verification has lapsed.
 */
export function useS3Upload(
  tournamentSlug: string,
  registrationId?: string,
  onVerifyEmail?: () => void
) {
  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<Partial<Record<UploadKind, UploadInfo>>>({});

  async function upload(kind: UploadKind, chosen: File): Promise<string> {
    setError(null);
    // Judged by its content, not its name or the type the browser guesses.
    const inspected = await inspectFile(kind, chosen);
    if ("problem" in inspected) {
      setError(inspected.problem);
      throw new Error(inspected.problem);
    }
    const file = inspected.file;

    setUploading((s) => ({ ...s, [kind]: true }));
    try {
      const compressed = await compressIfImage(file, COMPRESS_TO_MB[kind], ENCODE_AS[kind]);
      if (compressed.size > UPLOAD_MAX_BYTES[kind]) {
        throw new Error(
          `The file is still ${formatBytes(compressed.size)} after shrinking — it must be under ${formatUploadLimit(kind)}.`
        );
      }
      // What's sent must still be an allowed file, whatever the shrinking did.
      const sent = checkFileContent(kind, await readFileHead(compressed));
      if (!sent.ok) throw new Error(sent.message);

      const presignRes = await fetch("/api/uploads/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tournamentSlug,
          kind,
          contentType: sent.type,
          size: compressed.size,
          ...(registrationId && { registrationId }),
        }),
      });
      if (!presignRes.ok) {
        const body = await presignRes.json().catch(() => null);
        if (body?.verifyEmail) onVerifyEmail?.();
        throw new Error(body?.error ?? "Could not start the upload");
      }
      const { uploadUrl, key } = await presignRes.json();

      const putRes = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": sent.type },
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
