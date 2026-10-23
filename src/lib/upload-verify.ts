import "server-only";
import { SIGNATURE_BYTES, checkFileContent, typeFromKey } from "@/lib/file-signature";
import { deleteObjects, getObjectHead } from "@/lib/s3";
import type { UploadKind } from "@/lib/upload-limits";

const DOCUMENT: Record<UploadKind, { name: string; field: string; types: string }> = {
  ageProof: { name: "age proof", field: "ageProofKey", types: "JPG, PNG, WEBP image or PDF" },
  passportPhoto: { name: "photo", field: "passportPhotoKey", types: "JPG, PNG or WEBP image" },
};

/**
 * Checks uploaded documents by reading their first bytes from S3: each must
 * exist and really be an allowed file of the type its key says (the browser
 * checks too, but anyone can call the API). A file that fails is deleted.
 * S3 errors are thrown — better to stop a submission than accept an unchecked file.
 * Returns the first problem, in words a player can act on, or null.
 */
export async function checkUploadedDocuments(docs: { kind: UploadKind; key: string }[]) {
  const results = await Promise.all(
    docs.map(async ({ kind, key }) => {
      const doc = DOCUMENT[kind];
      const head = await getObjectHead(key, SIGNATURE_BYTES);
      if (!head?.length) {
        return {
          field: doc.field,
          problem: `Your ${doc.name} didn't finish uploading. Please upload it again.`,
        };
      }
      const content = checkFileContent(kind, head);
      if (content.ok && content.type === typeFromKey(key)) return null;
      await deleteObjects([key]);
      return {
        field: doc.field,
        problem: `Your ${doc.name} isn't a real ${doc.types}. Please upload it again.`,
      };
    })
  );
  return results.find(Boolean) ?? null;
}
