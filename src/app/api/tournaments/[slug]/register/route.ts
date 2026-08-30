import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { registrationSchema } from "@/lib/validations";
import { notifyRegistration } from "@/lib/notify";

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

  const { fullName, email, phone, dob, gender, city, fideId } = parsed.data;

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
          fideId: fideId || null,
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
