export interface Customer {
  name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
}

export type CustomerErrors = Partial<Record<keyof Customer, string>>;

export const EMPTY_CUSTOMER: Customer = { name: "", phone: "", email: "", address: "", city: "", state: "", pincode: "" };

export function validateCustomer(c: Partial<Customer> | undefined): CustomerErrors {
  const errors: CustomerErrors = {};
  const v = (k: keyof Customer) => (typeof c?.[k] === "string" ? c[k]!.trim() : "");
  if (v("name").length < 2) errors.name = "Enter your full name.";
  if (!/^[6-9]\d{9}$/.test(v("phone").replace(/^(\+91|0)/, "").replace(/\s|-/g, ""))) {
    errors.phone = "Enter a valid 10-digit Indian mobile number.";
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v("email"))) errors.email = "Enter a valid email address.";
  if (v("address").length < 8) errors.address = "Enter your full delivery address.";
  if (v("city").length < 2) errors.city = "Enter your city.";
  if (v("state").length < 2) errors.state = "Enter your state.";
  if (!/^[1-9]\d{5}$/.test(v("pincode"))) errors.pincode = "Enter a valid 6-digit pincode.";
  return errors;
}

export interface CreateOrderResponse {
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
  total: number;
}

export interface PlacedOrder {
  method: "online" | "cod";
  orderId?: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  total: number;
  items: { name: string; qty: number; detail: string }[];
}

export const LAST_ORDER_KEY = "caffix_last_order";
