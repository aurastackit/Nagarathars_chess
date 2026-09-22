import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createRazorpayOrder, isRazorpayConfigured } from "@/lib/razorpay";

export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const body = await req.json().catch(() => null);
  const registrationId = body?.registrationId as string | undefined;
  if (!registrationId) {
    return NextResponse.json({ error: "Missing registration" }, { status: 400 });
  }

  if (!isRazorpayConfigured()) {
    return NextResponse.json({ error: "Online payment isn't configured yet — please contact the organizers." }, { status: 503 });
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
