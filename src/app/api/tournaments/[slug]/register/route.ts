import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { SEAT_HOLDING_STATUSES } from "@/lib/tournament-status";
import { ageByYear, naturalAgeCategory } from "@/lib/age-category";
import { createRegistrationWizardSchema } from "@/lib/registration-schema";
import { emailRegistration } from "@/lib/registration-notify";
import { TRANSACTION_TIMEOUTS, nextRegistrationNo } from "@/lib/registration-number";
import { recordRegistrationEvent } from "@/lib/registration-events";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { isHoneypotTriggered } from "@/lib/honeypot";
import { EMAIL_VERIFICATION_VALIDITY_MS } from "@/lib/otp";
import { isRazorpayConfigured } from "@/lib/razorpay";
import { endOfDayIST } from "@/lib/datetime";
import { revalidateTournamentSeats } from "@/lib/revalidate-public";
import { isReadOnly, readOnlyResponse } from "@/lib/read-only";

export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  if (isReadOnly()) return readOnlyResponse();
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
  if (new Date() > endOfDayIST(tournament.registrationDeadline)) {
    return NextResponse.json(
      { error: "Registration is closed for this tournament" },
      { status: 400 }
    );
  }

  const parsed = createRegistrationWizardSchema().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }
  const data = parsed.data;
  const playerEmail = data.email.trim().toLowerCase();

  // Only the year of birth is collected: it's stored as 1 January of that year,
  // and the age category is always worked out here, never taken from the form.
  const dob = new Date(Date.UTC(data.birthYear, 0, 1));
  const ageCategory = naturalAgeCategory(ageByYear(data.birthYear, tournament.startDate));

  const verifiedUser = await prisma.user.findUnique({ where: { email: playerEmail } });
  const verifiedRecently =
    verifiedUser?.emailVerifiedAt &&
    Date.now() - verifiedUser.emailVerifiedAt.getTime() < EMAIL_VERIFICATION_VALIDITY_MS;
  if (!verifiedRecently) {
    return NextResponse.json(
      { error: "Please verify your email before submitting your registration" },
      { status: 400 }
    );
  }

  const requiresPayment = tournament.entryFee > 0 && isRazorpayConfigured();

  let registrationId: string;
  try {
    registrationId = await prisma.$transaction(async (tx) => {
      // Taking the number first locks the tournament row until this transaction
      // ends, so simultaneous submissions queue up: no duplicate numbers, and the
      // seat check below can't be raced. A rollback (e.g. FULL) returns the number.
      const registrationNo = await nextRegistrationNo(tx, tournament.id, ageCategory);
      if (tournament.maxParticipants !== null) {
        const count = await tx.registration.count({
          where: { tournamentId: tournament.id, status: { in: SEAT_HOLDING_STATUSES } },
        });
        if (count >= tournament.maxParticipants) {
          throw new Error("FULL");
        }
      }
      const player = await tx.player.upsert({
        where: { email: playerEmail },
        update: { fullName: data.fullName, dob },
        create: { email: playerEmail, fullName: data.fullName, dob },
      });
      const registration = await tx.registration.create({
        data: {
          tournamentId: tournament.id,
          playerId: player.id,
          fullName: data.fullName,
          email: data.email,
          phone: data.phone,
          dob,
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
          sangamRelativeName: data.sangamMember ? data.sangamRelativeName || null : null,
          ageProofType: data.ageProofType,
          ageProofKey: data.ageProofKey,
          passportPhotoKey: data.passportPhotoKey,
          consentAccepted: data.consentAccepted,
          guardianName: data.guardianName || null,
          guardianConsent: data.guardianConsent,
          ageCategory,
          registrationNo,
          status: "pending",
          paymentStatus: requiresPayment ? "pending" : "not_required",
        },
      });
      await recordRegistrationEvent(tx, {
        registrationId: registration.id,
        type: "submitted",
        actor: { type: "player", email: playerEmail },
        note: registrationNo,
      });
      return registration.id;
    }, TRANSACTION_TIMEOUTS);
  } catch (err) {
    if (err instanceof Error && err.message === "FULL") {
      return NextResponse.json({ error: "This tournament is full" }, { status: 400 });
    }
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return NextResponse.json(
        {
          error: "You've already registered for this tournament with this email and year of birth",
        },
        { status: 409 }
      );
    }
    throw err;
  }

  revalidateTournamentSeats(tournament.slug);

  // Best effort: the registration has succeeded whatever happens to the email.
  if (!requiresPayment) {
    await emailRegistration(registrationId, "received");
  }

  return NextResponse.json(
    { id: registrationId, requiresPayment, amount: tournament.entryFee },
    { status: 201 }
  );
}
