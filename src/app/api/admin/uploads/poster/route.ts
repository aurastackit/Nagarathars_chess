import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/require-admin";
import { POSTER_MAX_BYTES, POSTER_TYPES, createPosterUploadUrl } from "@/lib/s3";

const schema = z.object({
  contentType: z.enum(POSTER_TYPES),
  size: z.number().int().positive().max(POSTER_MAX_BYTES),
});

/** Admin-only: a signed URL for uploading a tournament poster to `posters/`. */
export async function POST(req: Request) {
  if (!(await requireAdminApi())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Posters must be JPG, PNG or WEBP images under 3 MB" },
      { status: 400 }
    );
  }
  try {
    return NextResponse.json(await createPosterUploadUrl(parsed.data));
  } catch (err) {
    console.error("[poster-upload] could not create an upload URL:", err);
    return NextResponse.json({ error: "Upload is unavailable right now" }, { status: 503 });
  }
}
