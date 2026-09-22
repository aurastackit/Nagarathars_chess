import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDownloadUrl } from "@/lib/s3";

/** Admin-only: exchanges a stored S3 object key for a short-lived signed GET URL. */
export async function GET(req: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const key = new URL(req.url).searchParams.get("key");
  if (!key || !key.startsWith("registrations/")) {
    return NextResponse.json({ error: "Invalid key" }, { status: 400 });
  }

  try {
    const url = await getDownloadUrl(key);
    return NextResponse.redirect(url);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not generate a download link";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
