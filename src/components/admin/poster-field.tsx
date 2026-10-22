"use client";

import Image from "next/image";
import { useState, type ChangeEvent } from "react";
import { Input } from "@/components/ui";
import { compressIfImage } from "@/lib/image-compression";
import { isValidImageUrl } from "@/lib/image-url";

const TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 3 * 1024 * 1024;

/**
 * Poster URL input with an Upload button: the image is shrunk in the browser,
 * uploaded straight to S3 (posters/), and its public /media/posters/… path is
 * put in the field. Typing or pasting a URL still works.
 */
export function PosterField({
  defaultValue,
  invalid,
}: {
  defaultValue: string;
  invalid?: boolean;
}) {
  const [url, setUrl] = useState(defaultValue);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError(null);
    if (!TYPES.includes(file.type)) {
      setError("Choose a JPG, PNG or WEBP image");
      return;
    }
    setUploading(true);
    try {
      const image = await compressIfImage(file, 1.5);
      if (image.size > MAX_BYTES) throw new Error("The image must be under 3 MB");
      const presign = await fetch("/api/admin/uploads/poster", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentType: image.type, size: image.size }),
      });
      const body = await presign.json().catch(() => null);
      if (!presign.ok) throw new Error(body?.error ?? "Could not start the upload");
      const put = await fetch(body.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": image.type },
        body: image,
      });
      if (!put.ok) throw new Error("Upload failed — please try again");
      setUrl(body.path);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <div className="flex gap-2">
        <Input
          id="posterImageUrl"
          name="posterImageUrl"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="/brand/logo-primary.png"
          aria-invalid={invalid || undefined}
          aria-describedby={invalid ? "posterImageUrl-error" : undefined}
          className={invalid ? "!border-red-400" : undefined}
        />
        <label className="inline-flex flex-none cursor-pointer items-center rounded-md border border-charcoal px-3 text-sm font-semibold text-charcoal hover:bg-charcoal hover:text-background">
          {uploading ? "Uploading…" : "Upload"}
          <input
            type="file"
            accept={TYPES.join(",")}
            onChange={handleFile}
            disabled={uploading}
            className="sr-only"
          />
        </label>
      </div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      {isValidImageUrl(url) && (
        <Image
          src={url}
          alt="Poster preview"
          width={160}
          height={90}
          unoptimized
          className="mt-2 h-[90px] w-[160px] rounded border border-border bg-background object-contain"
        />
      )}
    </div>
  );
}
