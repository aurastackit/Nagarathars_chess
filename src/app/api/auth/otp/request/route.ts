import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { isHoneypotTriggered } from "@/lib/honeypot";
import { generateOtp, hashOtp, OTP_TTL_MS } from "@/lib/otp";
import { sendOtpEmail } from "@/lib/otp-email";

const requestOtpSchema = z.object({
  email: z.string().trim().email("Enter a valid email"),
});

export async function POST(req: Request) {
  if (!checkRateLimit(`otp-request:ip:${getClientIp(req)}`, 5, 60_000)) {
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
  if (!checkRateLimit(`otp-request:email:${email}`, 3, 5 * 60_000)) {
    return NextResponse.json(
      { error: "Too many requests for this email — please try again shortly." },
      { status: 429 }
    );
  }

  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: { email },
  });

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
