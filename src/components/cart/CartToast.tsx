"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { asset } from "@/lib/assets";
import { getProduct } from "@/lib/catalog";
import { cart, useCart } from "@/lib/cartStore";

/** Small confirmation after "Add to cart" (skipped when the add already opened the drawer). */
export default function CartToast() {
  const { bump, lastAdded, lastAddOpenedDrawer } = useCart();
  const [shown, setShown] = useState(0);
  const timer = useRef<number | undefined>(undefined);
  const announced = useRef(0);
  const visible = shown === bump && bump > 0 && !lastAddOpenedDrawer;
  const product = lastAdded ? getProduct(lastAdded) : undefined;

  useEffect(() => {
    // Only new adds show a toast (not a remount after navigating back).
    if (!bump || bump <= announced.current) return;
    announced.current = bump;
    window.clearTimeout(timer.current);
    const show = window.setTimeout(() => setShown(bump), 0);
    timer.current = window.setTimeout(() => setShown(0), 2800);
    return () => window.clearTimeout(show);
  }, [bump]);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  return (
    <div className={`toast${visible && product ? " is-visible" : ""}`} role="status" aria-live="polite">
      {visible && product && (
        <>
          <span className="toast__thumb">
            <Image src={asset(product.image)} alt="" fill sizes="44px" />
          </span>
          <span className="toast__text">
            <small>Added to cart</small>
            <strong>{product.name}</strong>
          </span>
          <button
            type="button"
            className="toast__cta"
            onClick={() => {
              setShown(0);
              cart.setDrawer(true);
            }}
          >
            View cart
          </button>
        </>
      )}
    </div>
  );
}
