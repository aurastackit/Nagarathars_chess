import imageCompression from "browser-image-compression";

/** Compresses image files client-side before upload; PDFs pass through untouched. */
export async function compressIfImage(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) return file;
  try {
    return await imageCompression(file, {
      maxSizeMB: 1,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
      fileType: file.type,
    });
  } catch {
    return file;
  }
}
