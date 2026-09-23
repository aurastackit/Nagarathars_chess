import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createRazorpayOrder, isRazorpayConfigured } from "@/lib/razorpay";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

const createOrderSchema = z.object({ registrationId: z.string().min(1) });

export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!checkRateLimit(`pay-order:${getClientIp(req)}`, 10, 60_000)) {
    return NextResponse.json(
      { error: "Too many requests — please try again shortly." },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = createOrderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Missing registration" }, { status: 400 });
  }
  const { registrationId } = parsed.data;

  if (!isRazorpayConfigured()) {
    return NextResponse.json(
      { error: "Online payment isn't configured yet — please contact the organizers." },
      { status: 503 }
    );
  }

  const tournament = await prisma.tournament.findUnique({ where: { slug } });
  if (!tournament) {
    return NextResponse.json({ error: "Tournament not found" }, { status: 404 });
  }

  const registration = await prisma.registration.findUnique({ where: { id: registrationId } });
  if (!registration || registration.tournamentId !== tournament.id) {
    return NextResponse.json({ error: "Registration not found" }, { status: 404 });
  }
  if (registration.paymentStatus === "paid") {
    return NextResponse.json({ error: "This registration is already paid" }, { status: 400 });
  }

  const order = await createRazorpayOrder({
    amountInRupees: tournament.entryFee,
    receipt: registration.id,
  });

  await prisma.registration.update({
    where: { id: registration.id },
    data: { razorpayOrderId: order.id },
  });

  return NextResponse.json({
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
    keyId: process.env.RAZORPAY_KEY_ID,
  });
}
