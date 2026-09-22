"use client";

import { useState, type ChangeEvent } from "react";
import type { FieldError } from "react-hook-form";
import type { UploadKind } from "@/lib/use-s3-upload";

export function FileUploadField({
  label,
  helper,
  kind,
  value,
  error,
  uploading,
  onUpload,
}: {
  label: string;
  helper: string;
  kind: UploadKind;
  value: string;
  error?: FieldError;
  uploading: boolean;
  onUpload: (kind: UploadKind, file: File) => Promise<string>;
}) {
  const [fileName, setFileName] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  async function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setLocalError(null);
    try {
      await onUpload(kind, file);
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "Upload failed");
    }
  }

  return (
    <div>
      <label htmlFor={kind} className="mb-1 block text-sm font-medium text-foreground">
        {label}
      </label>
      <label
        htmlFor={kind}
        className="flex cursor-pointer items-center gap-3 rounded-md border border-dashed border-charcoal/30 bg-background px-3.5 py-3 text-sm text-charcoal transition-colors hover:bg-charcoal/5"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-5 w-5 flex-none">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 16V4m0 0L7 9m5-5l5 5M5 20h14" />
        </svg>
        <span className="truncate">
          {uploading ? "Uploading…" : value ? fileName ?? "Uploaded" : "Click to choose a file"}
        </span>
        {value && !uploading && <span className="ml-auto flex-none text-xs font-semibold text-gold">✓</span>}
      </label>
      <input
        id={kind}
        type="file"
        accept="image/jpeg,image/png,image/webp,application/pdf"
        onChange={handleChange}
        className="hidden"
      />
      {error || localError ? (
        <p className="mt-1 text-xs text-red-600">{error?.message ?? localError}</p>
      ) : (
        <p className="mt-1 text-xs text-foreground/50">{helper}</p>
      )}
    </div>
  );
}
