import imageCompression from "browser-image-compression";

/**
 * Compresses image files client-side before upload; PDFs pass through untouched.
 * `toType` re-encodes the image (e.g. passport photos become JPEG, which the
 * ID-card PDF can embed; WEBP can't be).
 */
export async function compressIfImage(file: File, maxSizeMB = 1, toType?: string): Promise<File> {
  if (!file.type.startsWith("image/")) return file;
  try {
    return await imageCompression(file, {
      maxSizeMB,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
      fileType: toType ?? file.type,
    });
  } catch {
    return file;
  }
}
