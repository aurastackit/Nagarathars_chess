import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { enrollmentSchema } from "@/lib/validations";
import { notifyRegistration } from "@/lib/notify";

export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const body = await req.json().catch(() => null);
  const parsed = enrollmentSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const classProgram = await prisma.classProgram.findUnique({ where: { slug } });
  if (!classProgram) {
    return NextResponse.json({ error: "Class not found" }, { status: 404 });
  }

  const { fullName, email, phone, message } = parsed.data;

  try {
    await prisma.classEnrollment.create({
      data: { classProgramId: classProgram.id, fullName, email, phone, message: message || null },
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return NextResponse.json({ error: "You've already enrolled interest with this email" }, { status: 409 });
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
