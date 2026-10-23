"use client";

import { useState, type ChangeEvent } from "react";
import type { FieldError } from "react-hook-form";
import { UPLOAD_TYPES, type UploadKind } from "@/lib/upload-limits";
import { formatBytes } from "@/lib/upload-checks";
import type { UploadInfo } from "@/lib/use-s3-upload";
import {
  ATTENTION_RING,
  AttentionNote,
  useNeedsAttention,
} from "@/components/registration-wizard/attention";

/** Thrown by an upload step the player backed out of (e.g. closing the photo cropper): no error shown. */
export class UploadCancelled extends Error {
  constructor() {
    super("cancelled");
    this.name = "UploadCancelled";
  }
}

export function FileUploadField({
  label,
  helper,
  kind,
  field,
  value,
  error,
  uploading,
  onUpload,
  info,
  preview,
  existingLabel,
}: {
  label: string;
  helper: string;
  kind: UploadKind;
  /** The form field this fills (for "needs attention" highlighting). */
  field: string;
  value: string;
  error?: FieldError;
  uploading: boolean;
  onUpload: (kind: UploadKind, file: File) => Promise<string>;
  /** Sizes before/after shrinking, shown once uploaded. */
  info?: UploadInfo;
  /** A preview of what was uploaded (e.g. the cropped photo). */
  preview?: string | null;
  /** Shown when a file is already on record (updating an application). */
  existingLabel?: string;
}) {
  const [fileName, setFileName] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const attention = useNeedsAttention(field);

  async function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const input = e.target;
    const file = input.files?.[0];
    // Let the same file be picked again later (e.g. after cancelling the cropper).
    input.value = "";
    if (!file) return;
    setLocalError(null);
    try {
      await onUpload(kind, file);
      setFileName(file.name);
    } catch (err) {
      if (err instanceof UploadCancelled) return;
      setLocalError(err instanceof Error ? err.message : "Upload failed");
    }
  }

  const status = uploading
    ? "Uploading…"
    : value
      ? (fileName ?? existingLabel ?? "Uploaded")
      : "Click to choose a file";

  return (
    <div className={attention ? ATTENTION_RING : ""} data-field={field}>
      {attention && <AttentionNote />}
      <label htmlFor={kind} className="mb-1 block text-sm font-medium text-foreground">
        {label}
      </label>
      <label
        htmlFor={kind}
        className="flex cursor-pointer items-center gap-3 rounded-md border border-dashed border-charcoal/30 bg-background px-3.5 py-3 text-sm text-charcoal transition-colors hover:bg-charcoal/5"
      >
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element -- the player's own photo, from a local object URL
          <img
            src={preview}
            alt="Your photo"
            className="h-12 w-10 flex-none rounded object-cover ring-1 ring-border"
          />
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            className="h-5 w-5 flex-none"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 16V4m0 0L7 9m5-5l5 5M5 20h14"
            />
          </svg>
        )}
        <span className="min-w-0 flex-1 truncate">{status}</span>
        {value && !uploading && (
          <span className="ml-auto flex-none text-xs font-semibold text-gold-ink">✓</span>
        )}
      </label>
      <input
        id={kind}
        type="file"
        accept={UPLOAD_TYPES[kind].join(",")}
        onChange={handleChange}
        className="hidden"
      />
      {error || localError ? (
        <p role="alert" className="mt-1 text-xs text-red-600">
          {localError ?? error?.message}
        </p>
      ) : (
        <p className="mt-1 text-xs text-foreground/50">
          {info && value && fileName
            ? info.before > info.after
              ? `Shrunk from ${formatBytes(info.before)} to ${formatBytes(info.after)} and uploaded.`
              : `${formatBytes(info.after)}, uploaded.`
            : helper}
        </p>
      )}
    </div>
  );
}
