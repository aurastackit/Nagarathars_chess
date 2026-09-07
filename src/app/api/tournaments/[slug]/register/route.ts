import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { registrationSchema } from "@/lib/validations";
import { notifyRegistration } from "@/lib/notify";
import { ageAt, isAgeCategoryAllowed, naturalAgeCategory, type AgeCategoryValue } from "@/lib/age-category";

export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const body = await req.json().catch(() => null);
  const parsed = registrationSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const tournament = await prisma.tournament.findUnique({ where: { slug } });
  if (!tournament || tournament.status !== "published") {
    return NextResponse.json({ error: "Tournament not found" }, { status: 404 });
  }
  if (new Date() > tournament.registrationDeadline) {
    return NextResponse.json({ error: "Registration is closed for this tournament" }, { status: 400 });
  }

  const {
    fullName,
    email,
    phone,
    dob,
    gender,
    city,
    address,
    fideId,
    rating,
    kovil,
    pirivu,
    native,
    fatherName,
    motherName,
    fatherGrandparents,
    motherGrandparents,
    motherNative,
    motherKovil,
    motherPirivu,
    sangamMember,
    aadhaarImageData,
    passportPhotoData,
    ageCategory,
  } = parsed.data;

  if (dob) {
    const natural = naturalAgeCategory(ageAt(new Date(dob), tournament.startDate));
    if (!isAgeCategoryAllowed(ageCategory as AgeCategoryValue, natural)) {
      return NextResponse.json(
        { error: "You can register in your own age category or a higher one, not a lower one" },
        { status: 400 }
      );
    }
  }

  try {
    await prisma.$transaction(async (tx) => {
      if (tournament.maxParticipants !== null) {
        const count = await tx.registration.count({ where: { tournamentId: tournament.id } });
        if (count >= tournament.maxParticipants) {
          throw new Error("FULL");
        }
      }
      await tx.registration.create({
        data: {
          tournamentId: tournament.id,
          fullName,
          email,
          phone,
          dob: dob ? new Date(dob) : null,
          gender: gender || null,
          city: city || null,
          address: address || null,
          fideId: fideId || null,
          rating: rating ? Number(rating) : null,
          kovil: kovil || null,
          pirivu: pirivu || null,
          native: native || null,
          fatherName: fatherName || null,
          motherName: motherName || null,
          fatherGrandparents: fatherGrandparents || null,
          motherGrandparents: motherGrandparents || null,
          motherNative: motherNative || null,
          motherKovil: motherKovil || null,
          motherPirivu: motherPirivu || null,
          sangamMember: sangamMember ?? false,
          aadhaarImageData: aadhaarImageData || null,
          passportPhotoData: passportPhotoData || null,
          ageCategory,
        },
      });
    });
  } catch (err) {
    if (err instanceof Error && err.message === "FULL") {
      return NextResponse.json({ error: "This tournament is full" }, { status: 400 });
    }
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return NextResponse.json({ error: "You've already registered with this email" }, { status: 409 });
    }
    throw err;
  }

  await notifyRegistration({
    to: email,
    fullName,
    subject: `Registered: ${tournament.title}`,
    context: `Registration confirmed for ${tournament.title} (${tournament.slug})`,
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}
