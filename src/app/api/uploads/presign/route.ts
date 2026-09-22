import { NextResponse } from "next/server";
import { z } from "zod";
import { ALLOWED_UPLOAD_TYPES, createUploadUrl } from "@/lib/s3";

const presignSchema = z.object({
  tournamentSlug: z.string().trim().min(1),
  kind: z.enum(["ageProof", "passportPhoto"]),
  contentType: z.enum(ALLOWED_UPLOAD_TYPES),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = presignSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid request" }, { status: 400 });
  }

  try {
    const { uploadUrl, key } = await createUploadUrl(parsed.data);
    return NextResponse.json({ uploadUrl, key });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload is unavailable right now";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
