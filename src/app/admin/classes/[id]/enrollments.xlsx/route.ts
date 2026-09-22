import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/require-admin";
import { prisma } from "@/lib/prisma";
import { toXlsxBuffer } from "@/lib/xlsx";
import { formatDate } from "@/lib/format";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdminApi();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const classProgram = await prisma.classProgram.findUnique({
    where: { id },
    include: { enrollments: { orderBy: { enrolledAt: "asc" } } },
  });

  if (!classProgram) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const buffer = toXlsxBuffer(
    "Enrollments",
    ["Full name", "Email", "Phone", "FIDE ID", "Message", "Enrolled at"],
    classProgram.enrollments.map((e) => [
      e.fullName,
      e.email,
      e.phone,
      e.fideId ?? "",
      e.message ?? "",
      formatDate(e.enrolledAt),
    ])
  );

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${classProgram.slug}-enrollments.xlsx"`,
    },
  });
}
