"use client";

import { useEffect, useRef, useState } from "react";
import type { FlavourId } from "@/lib/catalog";
import { cart } from "@/lib/cartStore";

interface Props {
  productId: string;
  qty?: number;
  flavours?: FlavourId[];
  label?: string;
  className?: string;
  openDrawer?: boolean;
  disabled?: boolean;
}

export default function AddToCartButton({
  productId,
  qty = 1,
  flavours,
  label = "Add to cart",
  className = "btn btn--primary",
  openDrawer = false,
  disabled = false,
}: Props) {
  const [added, setAdded] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  return (
    <button
      type="button"
      className={`${className}${added ? " is-added" : ""}`}
      disabled={disabled}
      onClick={() => {
        if (!cart.add({ id: productId, qty, flavours }, { open: openDrawer })) return;
        setAdded(true);
        window.clearTimeout(timer.current);
        timer.current = window.setTimeout(() => setAdded(false), 1600);
      }}
    >
      <span className="btn__label" aria-live="polite">
        {added ? "Added ✓" : label}
      </span>
    </button>
  );
}
