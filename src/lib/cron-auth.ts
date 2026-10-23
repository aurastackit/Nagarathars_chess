import "server-only";
import { createHash, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";

/**
 * The daily jobs (.github/workflows/daily-jobs.yml) call with
 * `Authorization: Bearer $CRON_SECRET`. Returns the error response to send,
 * or null when the caller may run the job.
 */
export function cronAuthError(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET is not set" }, { status: 503 });
  }
  const given = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  const digest = (s: string) => createHash("sha256").update(s).digest();
  if (!timingSafeEqual(digest(given), digest(secret))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}
