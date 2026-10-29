import { randomUUID } from "node:crypto";
import { validateCustomer, type Customer } from "./checkout";
import { computeTotals, validateLine, type LineInput, type Totals } from "./pricing";

export interface CheckoutBody {
  items?: LineInput[];
  coupon?: string;
  customer?: Partial<Customer>;
}

export type Parsed =
  | { ok: true; items: LineInput[]; customer: Customer; totals: Totals }
  | { ok: false; response: Response };

export function apiError(status: number, code: string, message: string) {
  return Response.json({ error: code, message }, { status });
}

/** Validates a checkout request and prices it from the server-side catalogue. */
export async function parseCheckout(request: Request): Promise<Parsed> {
  let body: CheckoutBody;
  try {
    body = await request.json();
  } catch {
    return { ok: false, response: apiError(400, "bad_request", "Invalid request.") };
  }
  const items = Array.isArray(body.items) ? body.items : [];
  if (items.length === 0) return { ok: false, response: apiError(400, "empty_cart", "Your cart is empty.") };
  for (const item of items) {
    const problem = validateLine(item);
    if (problem) return { ok: false, response: apiError(400, "invalid_item", problem) };
  }
  if (Object.keys(validateCustomer(body.customer)).length) {
    return { ok: false, response: apiError(400, "invalid_customer", "Please check your delivery details.") };
  }
  const customer = body.customer as Customer;
  return { ok: true, items, customer, totals: computeTotals(items, body.coupon) };
}

export function newOrderId() {
  return `CFX-${randomUUID().slice(0, 8).toUpperCase()}`;
}

export function orderSummary(totals: Totals) {
  return totals.lines
    .map((l) => `${l.product.id}x${l.qty}${l.flavours?.length ? `(${l.flavours.join("+")})` : ""}`)
    .join(", ");
}

/**
 * Sends a confirmed order to the store's order inbox (ORDER_WEBHOOK_URL — e.g. the existing
 * backend, a Google Apps Script, Zapier or Make). Returns false when it isn't configured or fails.
 */
export async function forwardOrder(order: Record<string, unknown>): Promise<boolean> {
  const url = process.env.ORDER_WEBHOOK_URL;
  if (!url) return false;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(process.env.ORDER_WEBHOOK_SECRET ? { Authorization: `Bearer ${process.env.ORDER_WEBHOOK_SECRET}` } : {}),
      },
      body: JSON.stringify(order),
    });
    if (!res.ok) console.error("[orders] webhook rejected order", res.status);
    return res.ok;
  } catch (e) {
    console.error("[orders] webhook unreachable", e);
    return false;
  }
}
