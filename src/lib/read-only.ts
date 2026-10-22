import "@/lib/env-runtime";
import { NextResponse } from "next/server";

/**
 * Read-only mode (READ_ONLY_MODE=true in the Amplify environment, then
 * redeploy): every write is refused so the database can be copied safely —
 * public forms answer 503 with READ_ONLY_MESSAGE, and the proxy refuses admin
 * POSTs (server actions and admin APIs). Pages stay readable.
 */
export function isReadOnly() {
  return process.env.READ_ONLY_MODE === "true";
}

export const READ_ONLY_MESSAGE =
  "We're upgrading the site. Registration and forms are paused for about 15 minutes — please try again shortly.";

export function readOnlyResponse() {
  return NextResponse.json(
    { error: READ_ONLY_MESSAGE, readOnly: true },
    { status: 503, headers: { "Retry-After": "900" } }
  );
}
