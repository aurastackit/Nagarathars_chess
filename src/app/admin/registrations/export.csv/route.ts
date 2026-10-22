import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/require-admin";
import { exportResponse } from "@/lib/admin-exports";
import { parsePlayerFilters } from "@/lib/player-filters";
import { registrationsExportTable } from "@/lib/player-list";

/**
 * The player list as CSV (UTF-8 with BOM), with the same filters and sorting as the page
 * (?ids=a,b,c exports just those rows instead — bulk "Export selected").
 */
export async function GET(req: Request) {
  if (!(await requireAdminApi())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const params = new URL(req.url).searchParams;
  const ids = params.get("ids")?.split(",").filter(Boolean).slice(0, 500);
  const table = await registrationsExportTable(parsePlayerFilters(params), ids);
  return exportResponse({ name: "Players", ...table }, "csv", "players");
}
