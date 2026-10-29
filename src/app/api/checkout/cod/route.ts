import { apiError, forwardOrder, newOrderId, orderSummary, parseCheckout } from "@/lib/orders";

/** Places a cash-on-delivery order by handing it to the store's order inbox. */
export async function POST(request: Request) {
  const parsed = await parseCheckout(request);
  if (!parsed.ok) return parsed.response;

  if (!process.env.ORDER_WEBHOOK_URL) {
    return apiError(503, "cod_not_configured", "Cash on delivery isn't available on this server yet.");
  }

  const { totals, customer } = parsed;
  const orderId = newOrderId();
  const ok = await forwardOrder({
    orderId,
    paymentMethod: "cod",
    paymentStatus: "pending",
    total: totals.total,
    subtotal: totals.subtotal,
    discount: totals.couponDiscount,
    delivery: totals.deliveryFee,
    coupon: totals.couponCode ?? "",
    items: orderSummary(totals),
    lines: totals.lines.map((l) => ({ id: l.product.id, name: l.product.officialName, qty: l.qty, flavours: l.flavours ?? [] })),
    customer,
  });
  if (!ok) return apiError(502, "order_failed", "We couldn't place the order. Please try again.");

  return Response.json({ orderId, total: totals.total });
}
