import { FLAVOURS, getProduct, type FlavourId, type Product } from "./catalog";

// Rules mirrored from the live storefront: ₹40 delivery below ₹349, CHILL10 / CHILL20 coupons.
export const DELIVERY_FEE = 40;
export const FREE_DELIVERY_THRESHOLD = 349;
export const COUPONS: Record<string, number> = { CHILL10: 0.1, CHILL20: 0.2 };
export const MAX_QTY = 20;

export interface LineInput {
  id: string;
  qty: number;
  flavours?: FlavourId[];
}

export type PricedLine<T extends LineInput = LineInput> = T & {
  product: Product;
  lineTotal: number;
  lineMrp: number;
};

export interface Totals<T extends LineInput = LineInput> {
  lines: PricedLine<T>[];
  subtotal: number;
  mrpTotal: number;
  couponCode: string | null;
  couponDiscount: number;
  deliveryFee: number;
  total: number;
}

const FLAVOUR_IDS = new Set<string>(FLAVOURS.map((f) => f.id));

export function normaliseCoupon(code: string | null | undefined): string | null {
  const c = (code ?? "").trim().toUpperCase();
  return c in COUPONS ? c : null;
}

/** Returns an error message, or null when the line is valid. */
export function validateLine(line: LineInput): string | null {
  const product = getProduct(line.id);
  if (!product) return `Unknown product: ${line.id}`;
  if (product.soldOut) return `${product.name} is sold out.`;
  if (!Number.isInteger(line.qty) || line.qty < 1 || line.qty > MAX_QTY) {
    return `Quantity for ${product.name} must be between 1 and ${MAX_QTY}.`;
  }
  if (product.pickFlavours) {
    const picked = line.flavours ?? [];
    const unique = new Set(picked);
    if (picked.length !== product.pickFlavours || unique.size !== picked.length) {
      return `${product.name} needs ${product.pickFlavours} different flavours.`;
    }
    if (picked.some((f) => !FLAVOUR_IDS.has(f))) return `Unknown flavour in ${product.name}.`;
  }
  return null;
}

export function computeTotals<T extends LineInput>(input: T[], couponCode?: string | null): Totals<T> {
  const lines: PricedLine<T>[] = [];
  for (const line of input) {
    const product = getProduct(line.id);
    if (!product || validateLine(line)) continue;
    lines.push({ ...line, product, lineTotal: product.price * line.qty, lineMrp: product.mrp * line.qty });
  }
  const subtotal = lines.reduce((sum, l) => sum + l.lineTotal, 0);
  const mrpTotal = lines.reduce((sum, l) => sum + l.lineMrp, 0);
  const code = normaliseCoupon(couponCode);
  const couponDiscount = code ? Math.round(subtotal * COUPONS[code]) : 0;
  const deliveryFee = subtotal === 0 || subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;
  return {
    lines,
    subtotal,
    mrpTotal,
    couponCode: code,
    couponDiscount,
    deliveryFee,
    total: Math.max(0, subtotal - couponDiscount + deliveryFee),
  };
}

export function formatINR(value: number): string {
  return `₹${value.toLocaleString("en-IN")}`;
}
