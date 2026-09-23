import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { enrollmentSchema } from "@/lib/validations";
import { notifyRegistration } from "@/lib/notify";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { isHoneypotTriggered } from "@/lib/honeypot";

export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!checkRateLimit(`enroll:${getClientIp(req)}`, 5, 60_000)) {
    return NextResponse.json(
      { error: "Too many requests — please try again shortly." },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => null);
  if (isHoneypotTriggered(body)) {
    return NextResponse.json({ ok: true }, { status: 201 });
  }

  const parsed = enrollmentSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const classProgram = await prisma.classProgram.findUnique({ where: { slug } });
  if (!classProgram) {
    return NextResponse.json({ error: "Class not found" }, { status: 404 });
  }

  const { fullName, email, phone, fideId, message } = parsed.data;

  if (classProgram.level !== "beginner" && !fideId) {
    return NextResponse.json(
      { error: "A FIDE ID is required to enroll in intermediate or advanced classes" },
      { status: 400 }
    );
  }

  try {
    await prisma.classEnrollment.create({
      data: {
        classProgramId: classProgram.id,
        fullName,
        email,
        phone,
        fideId: fideId || null,
        message: message || null,
      },
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return NextResponse.json(
        { error: "You've already enrolled interest with this email" },
        { status: 409 }
      );
    }
    throw err;
  }

  await notifyRegistration({
    to: email,
    fullName,
    subject: `Enrollment interest: ${classProgram.title}`,
    context: `Enrollment interest received for ${classProgram.title}`,
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}
