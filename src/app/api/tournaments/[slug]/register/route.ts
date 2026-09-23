import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createRegistrationWizardSchema } from "@/lib/registration-schema";
import { sendRegistrationConfirmationEmail } from "@/lib/notify";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { isHoneypotTriggered } from "@/lib/honeypot";

export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!checkRateLimit(`register:${getClientIp(req)}`, 8, 60_000)) {
    return NextResponse.json(
      { error: "Too many requests — please try again shortly." },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => null);
  if (isHoneypotTriggered(body)) {
    return NextResponse.json({ id: "ok", requiresPayment: false, amount: 0 }, { status: 201 });
  }

  const tournament = await prisma.tournament.findUnique({ where: { slug } });
  if (!tournament || tournament.status !== "published") {
    return NextResponse.json({ error: "Tournament not found" }, { status: 404 });
  }
  if (new Date() > tournament.registrationDeadline) {
    return NextResponse.json(
      { error: "Registration is closed for this tournament" },
      { status: 400 }
    );
  }

  const schema = createRegistrationWizardSchema(tournament.startDate);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }
  const data = parsed.data;

  const requiresPayment = tournament.entryFee > 0;

  let registrationId: string;
  try {
    registrationId = await prisma.$transaction(async (tx) => {
      if (tournament.maxParticipants !== null) {
        const count = await tx.registration.count({ where: { tournamentId: tournament.id } });
        if (count >= tournament.maxParticipants) {
          throw new Error("FULL");
        }
      }
      const playerEmail = data.email.trim().toLowerCase();
      const player = await tx.player.upsert({
        where: { email: playerEmail },
        update: { fullName: data.fullName, dob: data.dob },
        create: { email: playerEmail, fullName: data.fullName, dob: data.dob },
      });
      const registration = await tx.registration.create({
        data: {
          tournamentId: tournament.id,
          playerId: player.id,
          fullName: data.fullName,
          email: data.email,
          phone: data.phone,
          dob: data.dob,
          gender: data.gender || null,
          city: data.city || null,
          address: data.address || null,
          fideId: data.fideId || null,
          rating: data.rating ? Number(data.rating) : null,
          kovil: data.kovil || null,
          pirivu: data.pirivu || null,
          native: data.native || null,
          fatherName: data.fatherName || null,
          motherName: data.motherName || null,
          fatherGrandparents: data.fatherGrandparents || null,
          motherGrandparents: data.motherGrandparents || null,
          motherNative: data.motherNative || null,
          motherKovil: data.motherKovil || null,
          motherPirivu: data.motherPirivu || null,
          sangamMember: data.sangamMember,
          ageProofType: data.ageProofType,
          ageProofKey: data.ageProofKey,
          passportPhotoKey: data.passportPhotoKey,
          consentAccepted: data.consentAccepted,
          guardianName: data.guardianName || null,
          guardianConsent: data.guardianConsent,
          ageCategory: data.ageCategory,
          status: "pending",
          paymentStatus: requiresPayment ? "pending" : "not_required",
        },
      });
      return registration.id;
    });
  } catch (err) {
    if (err instanceof Error && err.message === "FULL") {
      return NextResponse.json({ error: "This tournament is full" }, { status: 400 });
    }
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return NextResponse.json(
        {
          error: "You've already registered for this tournament with this email and date of birth",
        },
        { status: 409 }
      );
    }
    throw err;
  }

  if (!requiresPayment) {
    await sendRegistrationConfirmationEmail({
      to: data.email,
      fullName: data.fullName,
      registrationId,
      tournament,
    });
  }

  return NextResponse.json(
    { id: registrationId, requiresPayment, amount: tournament.entryFee },
    { status: 201 }
  );
}
