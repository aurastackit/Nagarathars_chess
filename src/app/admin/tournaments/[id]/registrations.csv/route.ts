import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/require-admin";
import { prisma } from "@/lib/prisma";
import { toCsv } from "@/lib/csv";
import { formatDate } from "@/lib/format";
import { ageCategoryLabel } from "@/lib/age-category";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdminApi();
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
    [
      "Full name",
      "Email",
      "Phone",
      "DOB",
      "Gender",
      "City",
      "Address",
      "Rating",
      "FIDE ID",
      "Native",
      "Kovil",
      "Pirivu",
      "Father name",
      "Mother name",
      "Father side grandparents",
      "Mother side grandparents",
      "Mother native",
      "Mother Kovil",
      "Mother Pirivu",
      "Sangam member",
      "Age proof type",
      "Age proof uploaded",
      "Passport photo uploaded",
      "Age category",
      "Payment status",
      "Amount paid",
      "Review status",
      "Rejection reason",
      "Registered at",
    ],
    tournament.registrations.map((r) => [
      r.fullName,
      r.email,
      r.phone,
      r.dob ? formatDate(r.dob) : "",
      r.gender ?? "",
      r.city ?? "",
      r.address ?? "",
      r.rating ?? "",
      r.fideId ?? "",
      r.native ?? "",
      r.kovil ?? "",
      r.pirivu ?? "",
      r.fatherName ?? "",
      r.motherName ?? "",
      r.fatherGrandparents ?? "",
      r.motherGrandparents ?? "",
      r.motherNative ?? "",
      r.motherKovil ?? "",
      r.motherPirivu ?? "",
      r.sangamMember ? "Yes" : "No",
      r.ageProofType ?? "",
      r.ageProofKey || r.aadhaarImageData ? "Yes" : "No",
      r.passportPhotoKey || r.passportPhotoData ? "Yes" : "No",
      ageCategoryLabel(r.ageCategory),
      r.paymentStatus,
      r.amountPaid ?? "",
      r.status,
      r.rejectionReason ?? "",
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
