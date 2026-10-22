import { createHash, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { expireChangesRequests } from "@/lib/registration-expiry";
import { isReadOnly, readOnlyResponse } from "@/lib/read-only";

/**
 * Called once a day by .github/workflows/daily-jobs.yml with
 * `Authorization: Bearer $CRON_SECRET`. Amplify Hosting has no scheduler of its own.
 */
export async function POST(req: Request) {
  if (isReadOnly()) return readOnlyResponse();
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET is not set" }, { status: 503 });
  }
  const given = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  const digest = (s: string) => createHash("sha256").update(s).digest();
  if (!timingSafeEqual(digest(given), digest(secret))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const result = await expireChangesRequests();
  console.log("[cron] expire-changes-requests:", JSON.stringify(result));
  return NextResponse.json(result);
}
