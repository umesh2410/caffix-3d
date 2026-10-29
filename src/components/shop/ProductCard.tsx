"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, type CSSProperties, type PointerEvent } from "react";
import AddToCartButton from "@/components/AddToCartButton";
import { asset } from "@/lib/assets";
import { altImage, discountPercent, getFlavour, type Product } from "@/lib/catalog";
import { formatINR } from "@/lib/pricing";

const CARD_SIZES = "(max-width: 600px) 92vw, (max-width: 1100px) 45vw, 22vw";

export default function ProductCard({ product, index = 0 }: { product: Product; index?: number }) {
  const ref = useRef<HTMLElement>(null);
  const alt = altImage(product);
  const off = discountPercent(product);
  const flavour = product.flavourId ? getFlavour(product.flavourId) : undefined;
  const href = `/products/${product.id}`;

  const onMove = (e: PointerEvent<HTMLElement>) => {
    const el = ref.current;
    if (!el || e.pointerType !== "mouse") return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    el.style.setProperty("--rx", `${(-y * 6).toFixed(2)}deg`);
    el.style.setProperty("--ry", `${(x * 8).toFixed(2)}deg`);
  };
  const onLeave = () => {
    ref.current?.style.setProperty("--rx", "0deg");
    ref.current?.style.setProperty("--ry", "0deg");
  };

  return (
    <article
      ref={ref}
      className={`product-card${product.soldOut ? " is-sold-out" : ""}`}
      style={{ "--d": index } as CSSProperties}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
    >
      <div className="product-card__media">
        <div className="product-card__tags">
          {product.badge && (
            <span className={`product-card__tag${product.soldOut ? " product-card__tag--muted" : ""}`}>{product.badge}</span>
          )}
          {off > 0 && <span className="product-card__tag product-card__tag--save">-{off}%</span>}
        </div>
        {/* Same photo, blurred, fills the frame so the real photo can show uncropped on top. */}
        <Image src={asset(product.image)} alt="" fill sizes={CARD_SIZES} className="media-backdrop" aria-hidden />
        <Image
          src={asset(product.image)}
          alt={`${product.name} — ${product.packLabel}`}
          fill
          sizes={CARD_SIZES}
          className="media-photo"
        />
        {alt && <Image src={asset(alt)} alt="" fill sizes={CARD_SIZES} className="media-photo is-alt" />}
        {flavour && product.category === "sachet" && (
          <span className="product-card__flavour" style={{ "--chip": flavour.color } as CSSProperties}>
            {flavour.name.split(" ")[0]}
          </span>
        )}
      </div>
      <div className="product-card__body">
        <p className="product-card__pack">{product.packLabel}</p>
        <h3 className="product-card__name">
          <Link href={href}>{product.name}</Link>
        </h3>
        {product.rating && (
          <p className="rating" aria-label={`Rated ${product.rating} out of 5 from ${product.reviewsCount} reviews`}>
            <span aria-hidden="true">★ {product.rating.toFixed(1)}</span>
            <span aria-hidden="true">({product.reviewsCount?.toLocaleString("en-IN")})</span>
          </p>
        )}
        <p className="product-card__short">{product.short}</p>
        <div className="product-card__foot">
          <p className="price">
            <strong>{formatINR(product.price)}</strong>
            {off > 0 && (
              <s>
                <span className="sr-only">MRP </span>
                {formatINR(product.mrp)}
              </s>
            )}
          </p>
          {product.soldOut ? (
            <button type="button" className="btn btn--ghost" disabled>
              Sold out
            </button>
          ) : product.pickFlavours ? (
            <Link href={href} className="btn btn--ghost">
              Pick flavours
            </Link>
          ) : (
            <AddToCartButton productId={product.id} label="Add" className="btn btn--primary" />
          )}
        </div>
      </div>
    </article>
  );
}
