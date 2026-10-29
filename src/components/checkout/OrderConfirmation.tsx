"use client";

import Link from "next/link";
import { useMemo, useSyncExternalStore } from "react";
import { BRAND } from "@/lib/catalog";
import { LAST_ORDER_KEY, type PlacedOrder } from "@/lib/checkout";
import { formatINR } from "@/lib/pricing";

const noopSubscribe = () => () => {};
function readRaw(): string | null {
  try {
    return sessionStorage.getItem(LAST_ORDER_KEY);
  } catch {
    return null;
  }
}

export default function OrderConfirmation() {
  const raw = useSyncExternalStore(noopSubscribe, readRaw, () => null);
  const order = useMemo<PlacedOrder | null>(() => {
    try {
      return raw ? (JSON.parse(raw) as PlacedOrder) : null;
    } catch {
      return null;
    }
  }, [raw]);

  if (!order) {
    return (
      <div className="info">
        <p className="eyebrow">Order</p>
        <h1>No recent order found.</h1>
        <p>If you just paid, keep your Razorpay payment ID handy and contact us at {BRAND.email}.</p>
        <p style={{ marginTop: "1.5rem" }}>
          <Link href="/shop" className="btn btn--primary">
            Back to the shop
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="info">
      <p className="eyebrow">{order.method === "cod" ? "Order placed · Cash on delivery" : "Payment verified"}</p>
      <h1>Thank you. Your coffee moment is on its way.</h1>
      {order.method === "cod" ? (
        <section>
          <h2>Order details</h2>
          <p>Order ID: {order.orderId}</p>
          <p>Amount to pay on delivery: {formatINR(order.total)}</p>
        </section>
      ) : (
        <section>
          <h2>Payment details</h2>
          <p>Razorpay payment ID: {order.razorpayPaymentId}</p>
          <p>Razorpay order ID: {order.razorpayOrderId}</p>
          <p>Amount paid: {formatINR(order.total)}</p>
        </section>
      )}
      <section>
        <h2>Items</h2>
        {order.items.map((item) => (
          <p key={`${item.name}-${item.detail}`}>
            {item.name} × {item.qty} — {item.detail}
          </p>
        ))}
      </section>
      <section>
        <h2>Questions?</h2>
        <p>
          Email {BRAND.email} or call {BRAND.phone} with your order or payment ID. Once your parcel ships you
          can follow it on the <Link href="/track">order tracking</Link> page.
        </p>
      </section>
    </div>
  );
}
