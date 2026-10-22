import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/require-admin";
import { getDownloadUrl } from "@/lib/s3";
import { prisma } from "@/lib/prisma";
import { recordRegistrationEvent } from "@/lib/registration-events";

/** Admin-only: exchanges a stored S3 object key for a short-lived signed GET URL. */
export async function GET(req: Request) {
  const session = await requireAdminApi();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const key = new URL(req.url).searchParams.get("key");
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
      actor: { type: "admin", email: session.user?.email },
      note: registration.ageProofKey === key ? "Age proof" : "Passport photo",
    });
    return NextResponse.redirect(url);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not generate a download link";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
