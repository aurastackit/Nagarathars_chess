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
  const classProgram = await prisma.classProgram.findUnique({
    where: { id },
    include: { enrollments: { orderBy: { enrolledAt: "asc" } } },
  });

  if (!classProgram) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const csv = toCsv(
    ["Full name", "Email", "Phone", "Message", "Enrolled at"],
    classProgram.enrollments.map((e) => [e.fullName, e.email, e.phone, e.message ?? "", formatDate(e.enrolledAt)])
  );

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="${classProgram.slug}-enrollments.csv"`,
    },
  });
}
