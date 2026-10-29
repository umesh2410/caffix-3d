"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { setScrollLocked } from "@/components/SmoothScroll";
import { asset } from "@/lib/assets";
import { getFlavour } from "@/lib/catalog";
import { cart, useCart } from "@/lib/cartStore";
import { computeTotals, formatINR, FREE_DELIVERY_THRESHOLD } from "@/lib/pricing";

export default function CartDrawer() {
  const { lines, drawerOpen } = useCart();
  const totals = computeTotals(lines);
  const closeRef = useRef<HTMLButtonElement>(null);
  const restoreRef = useRef<Element | null>(null);
  const remaining = Math.max(0, FREE_DELIVERY_THRESHOLD - totals.subtotal);
  const progress = Math.min(1, totals.subtotal / FREE_DELIVERY_THRESHOLD);

  useEffect(() => {
    if (!drawerOpen) return;
    restoreRef.current = document.activeElement;
    setScrollLocked(true);
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && cart.setDrawer(false);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      setScrollLocked(false);
      (restoreRef.current as HTMLElement | null)?.focus?.();
    };
  }, [drawerOpen]);

  return (
    <div className={`drawer${drawerOpen ? " is-open" : ""}`} aria-hidden={!drawerOpen} inert={!drawerOpen}>
      <div className="drawer__scrim" onClick={() => cart.setDrawer(false)} />
      <aside className="drawer__panel" role="dialog" aria-modal="true" aria-labelledby="cart-title" data-lenis-prevent>
        <div className="drawer__head">
          <h2 id="cart-title">Your cart</h2>
          <button ref={closeRef} type="button" className="icon-button" onClick={() => cart.setDrawer(false)}>
            <span className="sr-only">Close cart</span>
            <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
              <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {totals.lines.length === 0 ? (
          <div className="drawer__empty">
            <div className="drawer__mascot">
              <Image src={asset("/images/empty-cart-mascot.png")} alt="" fill sizes="160px" />
            </div>
            <p>Your cart is empty.</p>
            <Link href="/shop" className="btn btn--primary" onClick={() => cart.setDrawer(false)}>
              Shop Caffix
            </Link>
          </div>
        ) : (
          <>
            <div className="drawer__shipping" aria-live="polite">
              <p>
                {remaining > 0 ? (
                  <>
                    Add <strong>{formatINR(remaining)}</strong> more for free delivery
                  </>
                ) : (
                  <>You&apos;ve unlocked free delivery</>
                )}
              </p>
              <div className="meter" aria-hidden="true">
                <span style={{ transform: `scaleX(${progress})` }} />
              </div>
            </div>

            <ul className="drawer__lines">
              {totals.lines.map((line) => {
                const { key } = line;
                return (
                  <li key={key} className="cart-line">
                    <Link
                      href={`/products/${line.product.id}`}
                      className="cart-line__media"
                      aria-label={line.product.name}
                      onClick={() => cart.setDrawer(false)}
                    >
                      <Image src={asset(line.product.image)} alt="" fill sizes="80px" />
                    </Link>
                    <div className="cart-line__body">
                      <p className="cart-line__name">{line.product.name}</p>
                      <p className="cart-line__meta">
                        {line.flavours?.length
                          ? line.flavours.map((f) => getFlavour(f)?.name).join(" · ")
                          : line.product.packLabel}
                      </p>
                      <div className="cart-line__row">
                        <div className="stepper" role="group" aria-label={`Quantity for ${line.product.name}`}>
                          <button type="button" onClick={() => cart.setQty(key, line.qty - 1)} aria-label="Decrease quantity">
                            −
                          </button>
                          <span aria-live="polite">{line.qty}</span>
                          <button type="button" onClick={() => cart.setQty(key, line.qty + 1)} aria-label="Increase quantity">
                            +
                          </button>
                        </div>
                        <p className="cart-line__price">{formatINR(line.lineTotal)}</p>
                      </div>
                      <button type="button" className="link-button" onClick={() => cart.remove(key)}>
                        Remove
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>

            <div className="drawer__foot">
              <dl className="totals">
                <div>
                  <dt>Subtotal</dt>
                  <dd>{formatINR(totals.subtotal)}</dd>
                </div>
                <div>
                  <dt>Delivery</dt>
                  <dd>{totals.deliveryFee ? formatINR(totals.deliveryFee) : "Free"}</dd>
                </div>
              </dl>
              <p className="drawer__note">Coupons are applied at checkout.</p>
              <Link href="/checkout" className="btn btn--primary btn--block" onClick={() => cart.setDrawer(false)}>
                Checkout · {formatINR(totals.subtotal + totals.deliveryFee)}
              </Link>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
