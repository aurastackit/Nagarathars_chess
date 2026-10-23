import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { isHoneypotTriggered } from "@/lib/honeypot";
import { OTP_SEND_LIMITS, OTP_TTL_MS, generateOtp, hashOtp, otpSendLimitMessage } from "@/lib/otp";
import { sendOtpEmail } from "@/lib/otp-email";
import { isReadOnly, readOnlyResponse } from "@/lib/read-only";

const requestOtpSchema = z.object({
  email: z.string().trim().email("Enter a valid email"),
});

export async function POST(req: Request) {
  if (isReadOnly()) return readOnlyResponse();
  const ip = getClientIp(req);
  if (
    !checkRateLimit(`otp-request:ip:${ip}`, 5, 60_000) ||
    !checkRateLimit(`otp-request:ip-hour:${ip}`, 20, 60 * 60_000)
  ) {
    return NextResponse.json(
      { error: "Too many requests — please try again shortly." },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => null);
  if (isHoneypotTriggered(body)) {
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  const parsed = requestOtpSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const email = parsed.data.email.toLowerCase();
  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: { email },
  });
  const recent = await prisma.otpCode.findMany({
    where: {
      userId: user.id,
      createdAt: { gt: new Date(Date.now() - Math.max(...OTP_SEND_LIMITS.map((l) => l.windowMs))) },
    },
    select: { createdAt: true },
  });
  const limited = otpSendLimitMessage(recent.map((c) => c.createdAt));
  if (limited) return NextResponse.json({ error: limited }, { status: 429 });

  const code = generateOtp();
  await prisma.otpCode.create({
    data: {
      userId: user.id,
      codeHash: hashOtp(code),
      expiresAt: new Date(Date.now() + OTP_TTL_MS),
    },
  });

  try {
    await sendOtpEmail({ to: email, code });
  } catch (err) {
    console.error("[otp-request] sendOtpEmail failed:", err);
    return NextResponse.json(
      { error: "Could not send the verification email. Please try again shortly." },
      { status: 502 }
    );
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
