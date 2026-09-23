import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { classWaitlistSchema } from "@/lib/validations";
import { notifyRegistration } from "@/lib/notify";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = classWaitlistSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }
  const { email, phone } = parsed.data;

  await prisma.classWaitlist.upsert({
    where: { email },
    update: { phone: phone || null },
    create: { email, phone: phone || null },
  });

  await notifyRegistration({
    to: email,
    fullName: email,
    subject: "Added to the classes waitlist",
    context: `${email} joined the class waitlist${phone ? ` (phone: ${phone})` : ""}`,
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}
