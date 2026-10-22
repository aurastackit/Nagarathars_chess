import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/require-admin";
import { prisma } from "@/lib/prisma";
import { exportResponse } from "@/lib/admin-exports";
import { DEFAULT_FILTERS } from "@/lib/player-filters";
import { registrationsExportTable } from "@/lib/player-list";

/** Every registration for one tournament — the same columns as the player list export. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdminApi())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const tournament = await prisma.tournament.findUnique({ where: { id }, select: { slug: true } });
  if (!tournament) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const table = await registrationsExportTable({ ...DEFAULT_FILTERS, t: id });
  return exportResponse({ name: "Registrations", ...table }, "csv", `${tournament.slug}-registrations`);
}
