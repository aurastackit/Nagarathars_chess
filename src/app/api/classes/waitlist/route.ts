import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { classWaitlistSchema } from "@/lib/validations";
import { sendWaitlistConfirmationEmail } from "@/lib/notify";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { isHoneypotTriggered } from "@/lib/honeypot";

export async function POST(req: Request) {
  if (!checkRateLimit(`waitlist:${getClientIp(req)}`, 5, 60_000)) {
    return NextResponse.json(
      { error: "Too many requests — please try again shortly." },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => null);
  if (isHoneypotTriggered(body)) {
    return NextResponse.json({ ok: true }, { status: 201 });
  }

  const parsed = classWaitlistSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }
  const { email, phone, interestLevel } = parsed.data;

  await prisma.classWaitlist.upsert({
    where: { email },
    update: { phone: phone || null, interestLevel: interestLevel || null },
    create: { email, phone: phone || null, interestLevel: interestLevel || null },
  });

  // The signup is saved either way; a failed email is logged, not shown to the visitor.
  try {
    await sendWaitlistConfirmationEmail({ to: email, interestLevel });
  } catch (err) {
    console.error("[waitlist] confirmation email failed:", err);
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
