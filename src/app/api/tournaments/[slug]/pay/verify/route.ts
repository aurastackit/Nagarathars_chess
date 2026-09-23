import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyRazorpaySignature } from "@/lib/razorpay";
import { sendRegistrationConfirmationEmail } from "@/lib/notify";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

const verifySchema = z.object({
  registrationId: z.string().min(1),
  razorpay_order_id: z.string().min(1),
  razorpay_payment_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
});

export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!checkRateLimit(`pay-verify:${getClientIp(req)}`, 10, 60_000)) {
    return NextResponse.json(
      { error: "Too many requests — please try again shortly." },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = verifySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Missing payment details" }, { status: 400 });
  }
  const { registrationId, razorpay_order_id, razorpay_payment_id, razorpay_signature } =
    parsed.data;

  const valid = verifyRazorpaySignature({
    orderId: razorpay_order_id,
    paymentId: razorpay_payment_id,
    signature: razorpay_signature,
  });
  if (!valid) {
    return NextResponse.json({ error: "Payment verification failed" }, { status: 400 });
  }

  const tournament = await prisma.tournament.findUnique({ where: { slug } });
  const registration = await prisma.registration.findUnique({ where: { id: registrationId } });
  if (!tournament || !registration || registration.tournamentId !== tournament.id) {
    return NextResponse.json({ error: "Registration not found" }, { status: 404 });
  }
  if (registration.razorpayOrderId !== razorpay_order_id) {
    return NextResponse.json({ error: "Order mismatch" }, { status: 400 });
  }

  await prisma.registration.update({
    where: { id: registration.id },
    data: {
      paymentStatus: "paid",
      razorpayPaymentId: razorpay_payment_id,
      amountPaid: tournament.entryFee,
    },
  });

  await sendRegistrationConfirmationEmail({
    to: registration.email,
    fullName: registration.fullName,
    registrationId: registration.id,
    tournament,
  });

  return NextResponse.json({ ok: true });
}
