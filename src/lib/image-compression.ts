import imageCompression from "browser-image-compression";

/** Compresses image files client-side before upload; PDFs pass through untouched. */
export async function compressIfImage(file: File, maxSizeMB = 1): Promise<File> {
  if (!file.type.startsWith("image/")) return file;
  try {
    return await imageCompression(file, {
      maxSizeMB,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
      fileType: file.type,
    });
  } catch {
    return file;
  }
}
