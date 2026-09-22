"use client";

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open: () => void };
  }
}

function loadScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Could not load the payment gateway. Check your connection and try again."));
    document.body.appendChild(script);
  });
}

export async function openRazorpayCheckout(params: {
  keyId: string;
  orderId: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  prefill: { name: string; email: string; contact: string };
}): Promise<{ razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }> {
  await loadScript();
  return new Promise((resolve, reject) => {
    const rzp = new window.Razorpay({
      key: params.keyId,
      order_id: params.orderId,
      amount: params.amount,
      currency: params.currency,
      name: params.name,
      description: params.description,
      prefill: params.prefill,
      theme: { color: "#c8922f" },
      handler: (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
        resolve(response);
      },
      modal: {
        ondismiss: () => reject(new Error("Payment was cancelled")),
      },
    });
    rzp.open();
  });
}
