import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createUploadUrl } from "@/lib/s3";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { canRegisterFor } from "@/lib/tournament-status";
import { isReadOnly, readOnlyResponse } from "@/lib/read-only";
import {
  ALL_UPLOAD_TYPES,
  UPLOAD_MAX_BYTES,
  formatUploadLimit,
  isAllowedUpload,
} from "@/lib/upload-limits";

const presignSchema = z.object({
  tournamentSlug: z.string().trim().min(1).max(120),
  kind: z.enum(["ageProof", "passportPhoto"]),
  contentType: z.enum(ALL_UPLOAD_TYPES),
  size: z.number().int().positive().max(UPLOAD_MAX_BYTES.ageProof),
});

const fail = (error: string, status: number) => NextResponse.json({ error }, { status });

/**
 * Public: a registrant uploading an age proof or photo. Only for tournaments
 * open for registration, only allowed types, and the exact file size is signed
 * into the URL — S3 rejects a body of any other length.
 */
export async function POST(req: Request) {
  if (isReadOnly()) return readOnlyResponse();
  // Each registration needs two uploads, plus a few retries.
  if (!checkRateLimit(`presign:${getClientIp(req)}`, 20, 10 * 60_000)) {
    return fail("Too many uploads. Please wait a few minutes and try again.", 429);
  }

  const parsed = presignSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail("Invalid upload request", 400);
  const { tournamentSlug, kind, contentType, size } = parsed.data;

  if (!isAllowedUpload(kind, contentType, size)) {
    return fail(
      kind === "passportPhoto"
        ? `The photo must be a JPG, PNG or WEBP image under ${formatUploadLimit(kind)}`
        : `The file must be a JPG, PNG, WEBP or PDF under ${formatUploadLimit(kind)}`,
      400
    );
  }

  const tournament = await prisma.tournament.findUnique({
    where: { slug: tournamentSlug },
    select: { slug: true, status: true, endDate: true, registrationDeadline: true },
  });
  if (!tournament || !canRegisterFor(tournament)) {
    return fail("Registration is not open for this tournament", 400);
  }

  try {
    const { uploadUrl, key } = await createUploadUrl({
      tournamentSlug: tournament.slug,
      kind,
      contentType,
      size,
    });
    return NextResponse.json({ uploadUrl, key });
  } catch (err) {
    console.error("[presign] could not create an upload URL:", err);
    return fail("Upload is unavailable right now. Please try again later.", 503);
  }
}
