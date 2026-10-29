"use client";

import { useSyncExternalStore } from "react";
import type { FlavourId } from "./catalog";
import { MAX_QTY, validateLine, type LineInput } from "./pricing";

export interface CartLine extends LineInput {
  key: string;
}

interface CartState {
  lines: CartLine[];
  drawerOpen: boolean;
  /** Increments after every successful add so the header badge can animate. */
  bump: number;
  /** Product id of the most recent add (for the "added to cart" toast). */
  lastAdded: string | null;
  /** True when the last add also opened the drawer, so no toast is needed. */
  lastAddOpenedDrawer: boolean;
}

const STORAGE_KEY = "caffix_cart_v1";
const EMPTY: CartState = { lines: [], drawerOpen: false, bump: 0, lastAdded: null, lastAddOpenedDrawer: false };

let state: CartState = EMPTY;
let hydrated = false;
const listeners = new Set<() => void>();

function lineKey(id: string, flavours?: FlavourId[]): string {
  return flavours?.length ? `${id}:${[...flavours].sort().join("+")}` : id;
}

function readStorage(): CartLine[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((l): l is CartLine => !!l && typeof l === "object" && validateLine(l as LineInput) === null)
      .map((l) => ({ id: l.id, qty: l.qty, flavours: l.flavours, key: lineKey(l.id, l.flavours) }));
  } catch {
    return [];
  }
}

function hydrate() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  state = { ...state, lines: readStorage() };
  window.addEventListener("storage", (e) => {
    if (e.key !== STORAGE_KEY) return;
    state = { ...state, lines: readStorage() };
    emit();
  });
}

function emit() {
  listeners.forEach((l) => l());
}

function setLines(lines: CartLine[], extra?: Partial<CartState>) {
  state = { ...state, ...extra, lines };
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(lines.map(({ id, qty, flavours }) => ({ id, qty, flavours })))
    );
  } catch {
    // Storage can be unavailable (private mode); the cart still works for this tab.
  }
  emit();
}

export const cart = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  getSnapshot(): CartState {
    hydrate();
    return state;
  },
  getServerSnapshot(): CartState {
    return EMPTY;
  },
  add(input: LineInput, { open = false }: { open?: boolean } = {}) {
    if (validateLine(input)) return false;
    hydrate();
    const key = lineKey(input.id, input.flavours);
    const existing = state.lines.find((l) => l.key === key);
    const lines = existing
      ? state.lines.map((l) => (l.key === key ? { ...l, qty: Math.min(MAX_QTY, l.qty + input.qty) } : l))
      : [...state.lines, { ...input, key }];
    setLines(lines, {
      bump: state.bump + 1,
      drawerOpen: open || state.drawerOpen,
      lastAdded: input.id,
      lastAddOpenedDrawer: open,
    });
    return true;
  },
  setQty(key: string, qty: number) {
    const next = Math.max(0, Math.min(MAX_QTY, Math.round(qty)));
    setLines(
      next === 0 ? state.lines.filter((l) => l.key !== key) : state.lines.map((l) => (l.key === key ? { ...l, qty: next } : l))
    );
  },
  remove(key: string) {
    setLines(state.lines.filter((l) => l.key !== key));
  },
  clear() {
    setLines([]);
  },
  setDrawer(open: boolean) {
    state = { ...state, drawerOpen: open };
    emit();
  },
};

export function useCart(): CartState {
  return useSyncExternalStore(cart.subscribe, cart.getSnapshot, cart.getServerSnapshot);
}

export function useCartCount(): number {
  return useCart().lines.reduce((n, l) => n + l.qty, 0);
}
