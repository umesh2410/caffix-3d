import { createHmac, timingSafeEqual } from "node:crypto";
import { forwardOrder } from "@/lib/orders";

interface Body {
  razorpay_order_id?: unknown;
  razorpay_payment_id?: unknown;
  razorpay_signature?: unknown;
}

/** Verifies the Razorpay checkout signature (HMAC-SHA256 of "order_id|payment_id"), then forwards the order. */
export async function POST(request: Request) {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !secret) {
    return Response.json({ verified: false, message: "Online payment isn't set up on this server yet." }, { status: 503 });
  }

  let body: Body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ verified: false, message: "Invalid request." }, { status: 400 });
  }
  const { razorpay_order_id: orderId, razorpay_payment_id: paymentId, razorpay_signature: signature } = body;
  if (typeof orderId !== "string" || typeof paymentId !== "string" || typeof signature !== "string") {
    return Response.json({ verified: false, message: "Missing payment details." }, { status: 400 });
  }

  const expected = Buffer.from(createHmac("sha256", secret).update(`${orderId}|${paymentId}`).digest("hex"));
  const received = Buffer.from(signature);
  const verified = expected.length === received.length && timingSafeEqual(expected, received);
  if (!verified) {
    return Response.json({ verified: false, message: "Payment signature mismatch." }, { status: 400 });
  }

  // Read the order back from Razorpay so the forwarded record comes from the gateway, not the browser.
  let forwarded = false;
  try {
    const res = await fetch(`https://api.razorpay.com/v1/orders/${encodeURIComponent(orderId)}`, {
      headers: { Authorization: `Basic ${Buffer.from(`${keyId}:${secret}`).toString("base64")}` },
    });
    if (res.ok) {
      const order = (await res.json()) as { receipt: string; amount: number; notes: Record<string, string> };
      forwarded = await forwardOrder({
        orderId: order.receipt,
        paymentMethod: "online",
        paymentStatus: "paid",
        razorpayOrderId: orderId,
        razorpayPaymentId: paymentId,
        total: order.amount / 100,
        ...order.notes,
      });
    }
  } catch (e) {
    console.error("[razorpay] could not read order for fulfilment", e);
  }

  return Response.json({ verified: true, orderId, paymentId, forwarded });
}
