import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/require-admin";
import { getDownloadUrl } from "@/lib/s3";
import { prisma } from "@/lib/prisma";
import { recordRegistrationEvent } from "@/lib/registration-events";

const DOC_LABEL = { ageProof: "Age proof", photo: "Passport photo" } as const;
type Doc = keyof typeof DOC_LABEL;

/** Every view goes on the timeline: who, which document, when. */
function recordView(registrationId: string, doc: Doc, admin: string | null | undefined) {
  return recordRegistrationEvent(prisma, {
    registrationId,
    type: "document_viewed",
    actor: { type: "admin", email: admin },
    note: DOC_LABEL[doc],
  });
}

/** Legacy rows keep the file inline as a data URL. */
function decodeDataUrl(dataUrl: string | null) {
  const m = dataUrl?.match(/^data:([\w/+.-]+);base64,(.+)$/);
  return m ? { contentType: m[1], bytes: Buffer.from(m[2], "base64") } : null;
}

/**
 * Admin-only document access.
 *  - ?registration=<id>&doc=photo|ageProof[&download=1]: the registration's file,
 *    from S3 (redirect to a short-lived signed URL) or, for old rows, the inline copy.
 *    Every age-proof view goes on the timeline; the photo is printed on the ID card
 *    and the public verify page, so viewing it isn't recorded.
 *  - ?key=<s3 key>: the older form, still used by the tournament page; every view is recorded.
 */
export async function GET(req: Request) {
  const session = await requireAdminApi();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const params = new URL(req.url).searchParams;
  const admin = session.user?.email;

  const registrationId = params.get("registration");
  if (registrationId) {
    const doc = params.get("doc");
    if (doc !== "photo" && doc !== "ageProof") {
      return NextResponse.json({ error: "Invalid document" }, { status: 400 });
    }
    const r = await prisma.registration.findUnique({
      where: { id: registrationId },
      select: {
        id: true,
        registrationNo: true,
        ageProofKey: true,
        passportPhotoKey: true,
        aadhaarImageData: true,
        passportPhotoData: true,
      },
    });
    if (!r) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const key = doc === "photo" ? r.passportPhotoKey : r.ageProofKey;
    const legacy = decodeDataUrl(doc === "photo" ? r.passportPhotoData : r.aadhaarImageData);
    if (!key && !legacy) return NextResponse.json({ error: "Not uploaded" }, { status: 404 });

    if (doc === "ageProof") await recordView(r.id, doc, admin);
    const base = `${r.registrationNo ?? r.id}-${doc === "photo" ? "photo" : "age-proof"}`;
    const download = params.get("download") === "1";
    if (key) {
      try {
        const ext = key.split(".").pop();
        return NextResponse.redirect(
          await getDownloadUrl(key, download ? `${base}.${ext}` : undefined)
        );
      } catch (err) {
        const message = err instanceof Error ? err.message : "Could not generate a download link";
        return NextResponse.json({ error: message }, { status: 503 });
      }
    }
    const ext = legacy!.contentType.split("/")[1]?.replace("jpeg", "jpg") ?? "bin";
    return new NextResponse(new Uint8Array(legacy!.bytes), {
      headers: {
        "Content-Type": legacy!.contentType,
        "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${base}.${ext}"`,
        "Cache-Control": "private, no-store",
      },
    });
  }

  const key = params.get("key");
  if (!key || !key.startsWith("registrations/")) {
    return NextResponse.json({ error: "Invalid key" }, { status: 400 });
  }

  // Only keys that belong to a registration, and every view goes on its timeline.
  const registration = await prisma.registration.findFirst({
    where: { OR: [{ ageProofKey: key }, { passportPhotoKey: key }] },
    select: { id: true, ageProofKey: true },
  });
  if (!registration) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const url = await getDownloadUrl(key);
    await recordRegistrationEvent(prisma, {
      registrationId: registration.id,
      type: "document_viewed",
      actor: { type: "admin", email: admin },
      note: registration.ageProofKey === key ? "Age proof" : "Passport photo",
    });
    return NextResponse.redirect(url);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not generate a download link";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
