"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { getFlavour } from "@/lib/catalog";
import { cart, useCart } from "@/lib/cartStore";
import {
  EMPTY_CUSTOMER,
  LAST_ORDER_KEY,
  validateCustomer,
  type CreateOrderResponse,
  type Customer,
  type CustomerErrors,
  type PlacedOrder,
} from "@/lib/checkout";
import { computeTotals, formatINR, normaliseCoupon } from "@/lib/pricing";

interface RazorpayResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}
interface RazorpayInstance {
  open(): void;
  on(event: "payment.failed", cb: (r: { error?: { description?: string } }) => void): void;
}
declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => RazorpayInstance;
  }
}

const FIELDS: { name: keyof Customer; label: string; autoComplete: string; type?: string; full?: boolean; inputMode?: "numeric" | "tel" | "email" }[] = [
  { name: "name", label: "Full name", autoComplete: "name", full: true },
  { name: "phone", label: "Mobile number", autoComplete: "tel-national", type: "tel", inputMode: "tel" },
  { name: "email", label: "Email", autoComplete: "email", type: "email", inputMode: "email" },
  { name: "address", label: "Address (house no., street, area)", autoComplete: "street-address", full: true },
  { name: "city", label: "City", autoComplete: "address-level2" },
  { name: "state", label: "State", autoComplete: "address-level1" },
  { name: "pincode", label: "Pincode", autoComplete: "postal-code", inputMode: "numeric" },
];

function loadRazorpay(): Promise<boolean> {
  if (window.Razorpay) return Promise.resolve(true);
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

type Status = "idle" | "creating" | "paying" | "verifying";

export default function CheckoutForm() {
  const router = useRouter();
  const { lines } = useCart();
  const [customer, setCustomer] = useState<Customer>(EMPTY_CUSTOMER);
  const [errors, setErrors] = useState<CustomerErrors>({});
  const [couponInput, setCouponInput] = useState("CHILL10");
  const [coupon, setCoupon] = useState<string | null>("CHILL10");
  const [couponMessage, setCouponMessage] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [method, setMethod] = useState<"online" | "cod">("online");
  const [notice, setNotice] = useState<{ kind: "error" | "info"; text: string; hint?: boolean } | null>(null);
  const totals = computeTotals(lines, coupon);
  const busy = status !== "idle";

  const finishOrder = (order: Omit<PlacedOrder, "items">) => {
    const placed: PlacedOrder = {
      ...order,
      items: totals.lines.map((l) => ({
        name: l.product.name,
        qty: l.qty,
        detail: l.flavours?.map((f) => getFlavour(f)?.name).join(", ") || l.product.packLabel,
      })),
    };
    try {
      sessionStorage.setItem(LAST_ORDER_KEY, JSON.stringify(placed));
    } catch {
      // The confirmation page falls back to a generic message.
    }
    cart.clear();
    router.push("/order/success");
  };

  // Same public pincode directory the live store uses to fill in city and state.
  const onPincode = async (value: string) => {
    setCustomer((c) => ({ ...c, pincode: value }));
    if (!/^[1-9]\d{5}$/.test(value)) return;
    try {
      const res = await fetch(`https://api.postalpincode.in/pincode/${value}`);
      const data = (await res.json()) as { Status: string; PostOffice?: { District: string; State: string }[] }[];
      const office = data?.[0]?.Status === "Success" ? data[0].PostOffice?.[0] : undefined;
      if (office) setCustomer((c) => ({ ...c, city: c.city || office.District, state: c.state || office.State }));
    } catch {
      // Lookup is a convenience; the customer can type city and state.
    }
  };

  const applyCoupon = () => {
    const code = normaliseCoupon(couponInput);
    setCoupon(code);
    setCouponMessage(code ? `${code} applied.` : "Invalid coupon. Try CHILL10 (10% off) or CHILL20 (20% off).");
  };

  const pay = async (e: FormEvent) => {
    e.preventDefault();
    setNotice(null);
    const found = validateCustomer(customer);
    setErrors(found);
    if (Object.keys(found).length) {
      document.getElementById(`field-${Object.keys(found)[0]}`)?.focus();
      return;
    }

    setStatus("creating");
    const payload = {
      items: lines.map(({ id, qty, flavours }) => ({ id, qty, flavours })),
      coupon,
      customer,
    };

    if (method === "cod") {
      try {
        const res = await fetch("/api/checkout/cod", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) {
          setNotice({ kind: res.status === 503 ? "info" : "error", text: data.message ?? "Couldn't place the order.", hint: res.status === 503 });
          setStatus("idle");
          return;
        }
        finishOrder({ method: "cod", orderId: data.orderId, total: data.total });
      } catch {
        setNotice({ kind: "error", text: "Network error. Please try again." });
        setStatus("idle");
      }
      return;
    }

    try {
      const res = await fetch("/api/checkout/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setNotice({
          kind: data.error === "payments_not_configured" ? "info" : "error",
          text: data.message ?? "Something went wrong. Please try again.",
          hint: data.error === "payments_not_configured",
        });
        setStatus("idle");
        return;
      }
      const order = data as CreateOrderResponse;
      if (!(await loadRazorpay()) || !window.Razorpay) {
        setNotice({ kind: "error", text: "Couldn't load the payment window. Check your connection and try again." });
        setStatus("idle");
        return;
      }

      setStatus("paying");
      const rzp = new window.Razorpay({
        key: order.keyId,
        order_id: order.orderId,
        amount: order.amount,
        currency: order.currency,
        name: "CAFFIX",
        description: "Instant cold coffee",
        prefill: { name: customer.name, email: customer.email, contact: customer.phone },
        theme: { color: "#120b07" },
        modal: { ondismiss: () => setStatus("idle") },
        handler: async (response: RazorpayResponse) => {
          setStatus("verifying");
          const verify = await fetch("/api/checkout/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(response),
          });
          const result = await verify.json().catch(() => ({}));
          if (!verify.ok || !result.verified) {
            setNotice({
              kind: "error",
              text: `We couldn't confirm this payment (${response.razorpay_payment_id}). Please contact support before paying again.`,
            });
            setStatus("idle");
            return;
          }
          finishOrder({
            method: "online",
            razorpayOrderId: response.razorpay_order_id,
            razorpayPaymentId: response.razorpay_payment_id,
            total: order.total,
          });
        },
      });
      rzp.on("payment.failed", (r) => {
        setNotice({ kind: "error", text: r.error?.description ?? "Payment failed. Please try again." });
        setStatus("idle");
      });
      rzp.open();
    } catch {
      setNotice({ kind: "error", text: "Network error. Please try again." });
      setStatus("idle");
    }
  };

  if (totals.lines.length === 0) {
    return (
      <div className="checkout">
        <div>
          <h1>Checkout</h1>
          <p>Your cart is empty.</p>
          <p style={{ marginTop: "1.5rem" }}>
            <Link href="/shop" className="btn btn--primary">
              Shop Caffix
            </Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <form className="checkout" onSubmit={pay} noValidate>
      <div>
        <ol className="checkout-steps" aria-label="Checkout progress">
          <li className="is-done" data-n="1">
            Cart
          </li>
          <li className={busy ? "is-done" : "is-current"} data-n="2" aria-current={busy ? undefined : "step"}>
            Delivery
          </li>
          <li className={busy ? "is-current" : undefined} data-n="3" aria-current={busy ? "step" : undefined}>
            Payment
          </li>
        </ol>
        <h1>Checkout</h1>
        <fieldset disabled={busy} style={{ border: 0, padding: 0, margin: 0 }}>
          <legend className="eyebrow" style={{ marginBottom: "1rem" }}>
            Delivery details
          </legend>
          <div className="form-grid">
            {FIELDS.map((f) => (
              <div key={f.name} className={`field${f.full ? " field--full" : ""}`}>
                <label htmlFor={`field-${f.name}`}>{f.label}</label>
                <input
                  id={`field-${f.name}`}
                  name={f.name}
                  type={f.type ?? "text"}
                  inputMode={f.inputMode}
                  autoComplete={f.autoComplete}
                  value={customer[f.name]}
                  aria-invalid={!!errors[f.name]}
                  aria-describedby={errors[f.name] ? `error-${f.name}` : undefined}
                  onChange={(e) =>
                    f.name === "pincode"
                      ? onPincode(e.target.value.replace(/\D/g, "").slice(0, 6))
                      : setCustomer((c) => ({ ...c, [f.name]: e.target.value }))
                  }
                />
                {errors[f.name] && (
                  <p id={`error-${f.name}`} className="field__error">
                    {errors[f.name]}
                  </p>
                )}
              </div>
            ))}
          </div>
        </fieldset>
      </div>

      <aside className="summary" aria-labelledby="summary-title">
        <h2 id="summary-title">Order summary</h2>
        {totals.lines.map((l) => (
          <div key={l.key} className="summary__line">
            <div>
              {l.product.name} × {l.qty}
              <small>{l.flavours?.map((f) => getFlavour(f)?.name).join(", ") || l.product.packLabel}</small>
            </div>
            <strong>{formatINR(l.lineTotal)}</strong>
          </div>
        ))}

        <div className="coupon">
          <label htmlFor="coupon" className="sr-only">
            Coupon code
          </label>
          <input id="coupon" value={couponInput} onChange={(e) => setCouponInput(e.target.value)} placeholder="Coupon code" />
          <button type="button" className="btn btn--ghost" onClick={applyCoupon} disabled={busy}>
            Apply
          </button>
        </div>
        {couponMessage && (
          <p className="buybox__hint" aria-live="polite" style={{ marginTop: "-0.5rem", marginBottom: "1rem" }}>
            {couponMessage}
          </p>
        )}

        <dl className="totals">
          <div>
            <dt>Subtotal</dt>
            <dd>{formatINR(totals.subtotal)}</dd>
          </div>
          {totals.couponDiscount > 0 && (
            <div className="totals__save">
              <dt>Coupon {totals.couponCode}</dt>
              <dd>−{formatINR(totals.couponDiscount)}</dd>
            </div>
          )}
          <div>
            <dt>Delivery</dt>
            <dd>{totals.deliveryFee ? formatINR(totals.deliveryFee) : "Free"}</dd>
          </div>
          <div className="totals__grand">
            <dt>Total</dt>
            <dd>{formatINR(totals.total)}</dd>
          </div>
        </dl>

        <fieldset className="pay-methods" disabled={busy}>
          <legend className="sr-only">Payment method</legend>
          <label className="pay-method">
            <input type="radio" name="method" checked={method === "online"} onChange={() => setMethod("online")} />
            <span>
              <strong>Pay online</strong>
              <small>UPI, cards, net banking, wallets · Razorpay</small>
            </span>
          </label>
          <label className="pay-method">
            <input type="radio" name="method" checked={method === "cod"} onChange={() => setMethod("cod")} />
            <span>
              <strong>Cash on delivery</strong>
              <small>Pay when your order arrives</small>
            </span>
          </label>
        </fieldset>

        <button type="submit" className="btn btn--primary btn--block" style={{ marginTop: "1.25rem" }} disabled={busy}>
          {method === "cod" && status === "idle"
            ? `Place COD order · ${formatINR(totals.total)}`
            : status === "creating"
            ? "Preparing payment…"
            : status === "paying"
              ? "Waiting for payment…"
              : status === "verifying"
                ? "Confirming payment…"
                : `Pay ${formatINR(totals.total)} securely`}
        </button>
        <p className="drawer__note" style={{ marginTop: "0.75rem" }}>
          Payments are processed by Razorpay (UPI, cards, net banking, wallets).
        </p>

        {notice && (
          <div className={`notice notice--${notice.kind}`} role="alert">
            {notice.text}
            {notice.hint && process.env.NODE_ENV !== "production" && (
              <p style={{ marginTop: "0.5rem" }}>
                Developer note:{" "}
                {method === "cod" ? (
                  <>
                    set <code>ORDER_WEBHOOK_URL</code>
                  </>
                ) : (
                  <>
                    add <code>RAZORPAY_KEY_ID</code> and <code>RAZORPAY_KEY_SECRET</code>
                  </>
                )}{" "}
                in <code>.env.local</code> and restart the server.
              </p>
            )}
          </div>
        )}
      </aside>
    </form>
  );
}
