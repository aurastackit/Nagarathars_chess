import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/require-admin";
import { contactMessagesTable, exportResponse } from "@/lib/admin-exports";

export async function GET() {
  if (!(await requireAdminApi())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return exportResponse(await contactMessagesTable(), "csv", "contact-messages");
}
