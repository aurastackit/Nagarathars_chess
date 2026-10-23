import { NextResponse } from "next/server";
import { deleteDueAgeProofs } from "@/lib/document-retention";
import { cronAuthError } from "@/lib/cron-auth";
import { isReadOnly, readOnlyResponse } from "@/lib/read-only";

/**
 * Called once a day by .github/workflows/daily-jobs.yml with
 * `Authorization: Bearer $CRON_SECRET`: deletes age proofs kept for the
 * retention period after their tournament (see /admin/privacy).
 */
export async function POST(req: Request) {
  if (isReadOnly()) return readOnlyResponse();
  const denied = cronAuthError(req);
  if (denied) return denied;
  const result = await deleteDueAgeProofs({ type: "system" });
  console.log("[cron] document-retention:", JSON.stringify(result));
  return NextResponse.json(result, { status: result.failed.length ? 502 : 200 });
}
