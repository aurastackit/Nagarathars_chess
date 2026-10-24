export type DetectedVideo =
  | { provider: "YOUTUBE"; id: string; embedUrl: string; thumbnailUrl: string }
  | { provider: "DRIVE"; id: string; embedUrl: string }
  | { provider: "S3"; key: string }
  | { provider: "NONE" };

/**
 * Classifies a pasted video link (or, for S3, a bare object key) by provider. Pure/sync —
 * no I/O — so it's safe to use both server-side (scripts/add-videos.ts) and if ever needed
 * client-side. YouTube/Drive store the *original* URL as GalleryItem.url and re-derive the
 * embed here each time; S3 stores the bare key as GalleryItem.url (see resolveVideoPlayback).
 */
export function detectVideoProvider(input: string): DetectedVideo {
  const trimmed = input.trim();

  const youtube = trimmed.match(
    /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  if (youtube) {
    const id = youtube[1];
    return {
      provider: "YOUTUBE",
      id,
      embedUrl: `https://www.youtube-nocookie.com/embed/${id}`,
      thumbnailUrl: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
    };
  }

  const drive = trimmed.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (drive) {
    const id = drive[1];
    return { provider: "DRIVE", id, embedUrl: `https://drive.google.com/file/d/${id}/preview` };
  }

  if (/\.mp4(\?.*)?$/i.test(trimmed)) {
    if (/^https?:\/\//i.test(trimmed)) {
      try {
        const key = decodeURIComponent(new URL(trimmed).pathname.replace(/^\//, ""));
        return { provider: "S3", key };
      } catch {
        return { provider: "NONE" };
      }
    }
    return { provider: "S3", key: trimmed.replace(/^\//, "") };
  }

  return { provider: "NONE" };
}

/** The youtube.com watch page for a YouTube link (any form), or null if it isn't one. */
export function youtubeWatchUrl(input: string): string | null {
  const detected = detectVideoProvider(input);
  return detected.provider === "YOUTUBE" ? `https://www.youtube.com/watch?v=${detected.id}` : null;
}

export class UnsupportedVideoUrlError extends Error {
  constructor(input: string) {
    super(
      `Unsupported video link — must be a YouTube URL, a Google Drive file link, or an .mp4 path on our S3 bucket: ${input}`
    );
    this.name = "UnsupportedVideoUrlError";
  }
}
