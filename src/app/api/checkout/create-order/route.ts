import { apiError, newOrderId, orderSummary, parseCheckout } from "@/lib/orders";

/**
 * Creates a Razorpay order for the cart. Prices are always recomputed from the server-side
 * catalogue, so the client can't change what it pays.
 */
export async function POST(request: Request) {
  const parsed = await parseCheckout(request);
  if (!parsed.ok) return parsed.response;

  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    return apiError(503, "payments_not_configured", "Online payment isn't set up on this server yet.");
  }

  const { totals, customer } = parsed;
  const res = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: totals.total * 100,
      currency: "INR",
      receipt: newOrderId(),
      // Notes carry the order to /api/checkout/verify, which forwards it once payment is confirmed.
      notes: {
        name: customer.name.trim().slice(0, 250),
        phone: customer.phone.trim().slice(0, 20),
        email: customer.email.trim().slice(0, 250),
        address: `${customer.address}, ${customer.city}, ${customer.state} ${customer.pincode}`.slice(0, 250),
        items: orderSummary(totals).slice(0, 250),
        coupon: totals.couponCode ?? "",
        subtotal: String(totals.subtotal),
        discount: String(totals.couponDiscount),
        delivery: String(totals.deliveryFee),
      },
    }),
  });

  if (!res.ok) {
    console.error("[razorpay] order creation failed", res.status, await res.text());
    return apiError(502, "gateway_error", "We couldn't start the payment. Please try again.");
  }

  const order = (await res.json()) as { id: string; amount: number; currency: string };
  return Response.json({
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
    keyId,
    total: totals.total,
  });
}
