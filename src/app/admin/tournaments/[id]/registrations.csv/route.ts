import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { toCsv } from "@/lib/csv";
import { formatDate } from "@/lib/format";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const tournament = await prisma.tournament.findUnique({
    where: { id },
    include: { registrations: { orderBy: { registeredAt: "asc" } } },
  });

  if (!tournament) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const csv = toCsv(
    ["Full name", "Email", "Phone", "DOB", "Gender", "City", "FIDE ID", "Registered at"],
    tournament.registrations.map((r) => [
      r.fullName,
      r.email,
      r.phone,
      r.dob ? formatDate(r.dob) : "",
      r.gender ?? "",
      r.city ?? "",
      r.fideId ?? "",
      formatDate(r.registeredAt),
    ])
  );

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="${tournament.slug}-registrations.csv"`,
    },
  });
}
