import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { toXlsxBuffer } from "@/lib/xlsx";
import { formatDate } from "@/lib/format";
import { ageCategoryLabel } from "@/lib/age-category";

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

  const buffer = toXlsxBuffer(
    "Registrations",
    [
      "Full name",
      "Email",
      "Phone",
      "DOB",
      "Gender",
      "City",
      "Rating",
      "FIDE ID",
      "Kovil",
      "Pirivu",
      "Age category",
      "Registered at",
    ],
    tournament.registrations.map((r) => [
      r.fullName,
      r.email,
      r.phone,
      r.dob ? formatDate(r.dob) : "",
      r.gender ?? "",
      r.city ?? "",
      r.rating ?? "",
      r.fideId ?? "",
      r.kovil ?? "",
      r.pirivu ?? "",
      ageCategoryLabel(r.ageCategory),
      formatDate(r.registeredAt),
    ])
  );

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${tournament.slug}-registrations.xlsx"`,
    },
  });
}
