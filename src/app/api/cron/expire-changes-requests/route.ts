import { NextResponse } from "next/server";
import { expireChangesRequests } from "@/lib/registration-expiry";
import { cronAuthError } from "@/lib/cron-auth";
import { isReadOnly, readOnlyResponse } from "@/lib/read-only";

/**
 * Called once a day by .github/workflows/daily-jobs.yml with
 * `Authorization: Bearer $CRON_SECRET`. Amplify Hosting has no scheduler of its own.
 */
export async function POST(req: Request) {
  if (isReadOnly()) return readOnlyResponse();
  const denied = cronAuthError(req);
  if (denied) return denied;
  const result = await expireChangesRequests();
  console.log("[cron] expire-changes-requests:", JSON.stringify(result));
  return NextResponse.json(result);
}
