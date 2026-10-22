import { NextResponse } from "next/server";
import { getPosterObject } from "@/lib/s3";

/**
 * Public: tournament posters uploaded from the admin (the bucket itself is
 * private). File names are random and never reused, so they're cached for a year.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  const poster = await getPosterObject(file);
  if (!poster) return new NextResponse("Not found", { status: 404 });
  return new NextResponse(poster.body, {
    headers: {
      "Content-Type": poster.contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
