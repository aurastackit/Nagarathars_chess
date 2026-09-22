import crypto from "crypto";
import Razorpay from "razorpay";

export function isRazorpayConfigured() {
  const id = process.env.RAZORPAY_KEY_ID;
  const secret = process.env.RAZORPAY_KEY_SECRET;
  return Boolean(id && secret && id !== "rzp_test_placeholder" && secret !== "placeholder");
}

function getClient() {
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
  });
}

export async function createRazorpayOrder(params: { amountInRupees: number; receipt: string }) {
  const client = getClient();
  return client.orders.create({
    amount: Math.round(params.amountInRupees * 100),
    currency: "INR",
    receipt: params.receipt,
  });
}

export function verifyRazorpaySignature(params: {
  orderId: string;
  paymentId: string;
  signature: string;
}) {
  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
    .update(`${params.orderId}|${params.paymentId}`)
    .digest("hex");
  return expected === params.signature;
}
