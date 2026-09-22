import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildTournamentIcs } from "@/lib/ics";

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tournament = await prisma.tournament.findUnique({ where: { slug } });

  if (!tournament || tournament.status === "draft") {
    return NextResponse.json({ error: "Tournament not found" }, { status: 404 });
  }

  const ics = buildTournamentIcs(tournament);

  return new NextResponse(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${tournament.slug}.ics"`,
    },
  });
}
