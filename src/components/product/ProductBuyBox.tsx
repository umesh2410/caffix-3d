"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import AddToCartButton from "@/components/AddToCartButton";
import { discountPercent, FLAVOURS, type FlavourId, type Product } from "@/lib/catalog";
import { formatINR, FREE_DELIVERY_THRESHOLD, MAX_QTY } from "@/lib/pricing";

export default function ProductBuyBox({ product }: { product: Product }) {
  const [qty, setQty] = useState(1);
  const [picked, setPicked] = useState<FlavourId[]>([]);
  const [showBar, setShowBar] = useState(false);
  const rowRef = useRef<HTMLDivElement>(null);
  const pickerRef = useRef<HTMLFieldSetElement>(null);
  const off = discountPercent(product);
  const need = product.pickFlavours ?? 0;
  const ready = !need || picked.length === need;

  // Phones: once the main "Add to cart" row scrolls out of view, a slim bar takes over.
  useEffect(() => {
    const row = rowRef.current;
    if (!row || product.soldOut) return;
    const io = new IntersectionObserver(([entry]) => setShowBar(!entry.isIntersecting && entry.boundingClientRect.top < 0));
    io.observe(row);
    return () => io.disconnect();
  }, [product.soldOut]);

  const toggle = (id: FlavourId) =>
    setPicked((cur) => (cur.includes(id) ? cur.filter((f) => f !== id) : cur.length < need ? [...cur, id] : cur));

  return (
    <div className="buybox">
      <p className="buybox__pack">
        {product.packLabel}
        {product.badge && <span className="buybox__badge">{product.badge}</span>}
      </p>
      <h1>{product.name}</h1>
      {product.rating && (
        <p className="rating rating--lg">
          <span aria-hidden="true">★★★★★</span> {product.rating.toFixed(1)} · {product.reviewsCount?.toLocaleString("en-IN")} reviews
        </p>
      )}
      <p className="buybox__short">{product.short}</p>

      <p className="price">
        <strong>{formatINR(product.price)}</strong>
        {off > 0 && (
          <>
            <s>
              <span className="sr-only">MRP </span>
              {formatINR(product.mrp)}
            </s>
            <span className="save-tag">Save {off}%</span>
          </>
        )}
      </p>
      <p className="buybox__tax">Prices in INR include applicable GST.</p>

      {need > 0 && (
        <fieldset className="picker" ref={pickerRef}>
          <legend>
            Choose {need} flavours{" "}
            <span>
              ({picked.length}/{need} selected)
            </span>
          </legend>
          <div className="picker__options">
            {FLAVOURS.map((f) => {
              const checked = picked.includes(f.id);
              return (
                <label key={f.id} className="picker__option" style={{ "--chip": f.color } as CSSProperties}>
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={!checked && picked.length >= need}
                    onChange={() => toggle(f.id)}
                  />
                  <span>{f.name}</span>
                </label>
              );
            })}
          </div>
        </fieldset>
      )}

      {product.allFlavours && (
        <p className="buybox__hint">Includes all five: {FLAVOURS.map((f) => f.name).join(", ")}.</p>
      )}

      {product.soldOut ? (
        <div className="buybox__row">
          <button type="button" className="btn btn--primary" disabled>
            Sold out
          </button>
        </div>
      ) : (
      <div className="buybox__row" ref={rowRef}>
        <div className="stepper" role="group" aria-label="Quantity">
          <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Decrease quantity">
            −
          </button>
          <span aria-live="polite">{qty}</span>
          <button type="button" onClick={() => setQty((q) => Math.min(MAX_QTY, q + 1))} aria-label="Increase quantity">
            +
          </button>
        </div>
        <AddToCartButton
          productId={product.id}
          qty={qty}
          flavours={need ? picked : undefined}
          label={ready ? `Add to cart · ${formatINR(product.price * qty)}` : `Pick ${need - picked.length} more`}
          disabled={!ready}
          openDrawer
        />
      </div>
      )}
      <p className="buybox__hint">Free shipping on orders above {formatINR(FREE_DELIVERY_THRESHOLD)}.</p>

      {!product.soldOut && (
        <div className={`buybar${showBar ? " is-visible" : ""}`} aria-hidden={!showBar} inert={!showBar}>
          <div className="buybar__info">
            <strong>{product.name}</strong>
            <span>{formatINR(product.price * qty)}</span>
          </div>
          {ready ? (
            <AddToCartButton
              productId={product.id}
              qty={qty}
              flavours={need ? picked : undefined}
              label="Add to cart"
              openDrawer
            />
          ) : (
            <button
              type="button"
              className="btn btn--primary"
              onClick={() => pickerRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })}
            >
              Pick {need - picked.length} flavours
            </button>
          )}
        </div>
      )}
    </div>
  );
}
