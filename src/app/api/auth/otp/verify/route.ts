import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { OTP_MAX_ATTEMPTS, verifyOtpHash } from "@/lib/otp";

const verifyOtpSchema = z.object({
  email: z.string().trim().email("Enter a valid email"),
  code: z.string().trim().length(6, "Enter the 6-digit code"),
});

export async function POST(req: Request) {
  if (!checkRateLimit(`otp-verify:ip:${getClientIp(req)}`, 10, 60_000)) {
    return NextResponse.json(
      { error: "Too many requests — please try again shortly." },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = verifyOtpSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const email = parsed.data.email.toLowerCase();
  if (!checkRateLimit(`otp-verify:email:${email}`, 10, 5 * 60_000)) {
    return NextResponse.json(
      { error: "Too many attempts for this email — please try again shortly." },
      { status: 429 }
    );
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return NextResponse.json({ error: "Invalid or expired code" }, { status: 400 });
  }

  const otp = await prisma.otpCode.findFirst({
    where: { userId: user.id, consumedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });
  if (!otp || otp.attempts >= OTP_MAX_ATTEMPTS) {
    return NextResponse.json({ error: "Invalid or expired code" }, { status: 400 });
  }

  if (!verifyOtpHash(parsed.data.code, otp.codeHash)) {
    await prisma.otpCode.update({ where: { id: otp.id }, data: { attempts: { increment: 1 } } });
    return NextResponse.json({ error: "Incorrect code" }, { status: 400 });
  }

  await prisma.$transaction([
    prisma.otpCode.update({ where: { id: otp.id }, data: { consumedAt: new Date() } }),
    prisma.user.update({ where: { id: user.id }, data: { emailVerifiedAt: new Date() } }),
  ]);

  return NextResponse.json({ ok: true });
}
