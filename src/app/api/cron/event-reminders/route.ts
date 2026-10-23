import { NextResponse } from "next/server";
import { sendEventReminders } from "@/lib/event-reminders";
import { cronAuthError } from "@/lib/cron-auth";
import { isReadOnly, readOnlyResponse } from "@/lib/read-only";

/**
 * Called once a day by .github/workflows/daily-jobs.yml with
 * `Authorization: Bearer $CRON_SECRET`: the 3-day reminder to confirmed players.
 */
export async function POST(req: Request) {
  if (isReadOnly()) return readOnlyResponse();
  const denied = cronAuthError(req);
  if (denied) return denied;
  const result = await sendEventReminders();
  console.log("[cron] event-reminders:", JSON.stringify(result));
  return NextResponse.json(result);
}
