"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { setScrollLocked } from "@/components/SmoothScroll";
import { asset } from "@/lib/assets";
import { CATEGORIES, FLAVOURS, PRODUCTS, type Product } from "@/lib/catalog";
import { formatINR } from "@/lib/pricing";

function haystack(p: Product) {
  const flavour = FLAVOURS.find((f) => f.id === p.flavourId);
  const category = CATEGORIES.find((c) => c.id === p.category);
  return [p.name, p.officialName, p.packLabel, p.short, flavour?.name, flavour?.sub, category?.label]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}
const INDEX = PRODUCTS.map((p) => ({ p, text: haystack(p) }));

export function searchProducts(query: string): Product[] {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (!terms.length) return [];
  return INDEX.filter(({ text }) => terms.every((t) => text.includes(t))).map(({ p }) => p);
}

export default function SearchDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const results = searchProducts(query).slice(0, 8);

  useEffect(() => {
    if (!open) return;
    setScrollLocked(true);
    inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      setScrollLocked(false);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="search" role="dialog" aria-modal="true" aria-label="Search products" data-lenis-prevent>
      <div className="search__scrim" onClick={onClose} />
      <div className="search__panel">
        <form
          className="search__form"
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            if (results[0]) {
              router.push(`/products/${results[0].id}`);
              onClose();
            }
          }}
        >
          <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
            <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="1.6" />
            <path d="m20 20-3.5-3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
          <label htmlFor="search-input" className="sr-only">
            Search products
          </label>
          <input
            ref={inputRef}
            id="search-input"
            type="search"
            placeholder="Search Products"
            autoComplete="off"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button type="button" className="icon-button" onClick={onClose}>
            <span className="sr-only">Close search</span>
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
              <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </button>
        </form>

        <div className="search__body" aria-live="polite">
          {!query.trim() ? (
            <div className="search__suggest">
              <p className="eyebrow">Popular searches</p>
              <div className="search__chips">
                {["Classic", "Vanilla", "Hazelnut", "Irish", "Mocha", "Sachet", "Combo"].map((s) => (
                  <button key={s} type="button" className="filter" onClick={() => setQuery(s)}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : results.length ? (
            <ul className="search__results">
              {results.map((p) => (
                <li key={p.id}>
                  <Link href={`/products/${p.id}`} onClick={onClose}>
                    <span className="search__thumb">
                      <Image src={asset(p.image)} alt="" fill sizes="56px" />
                    </span>
                    <span>
                      <strong>{p.name}</strong>
                      <small>{p.packLabel}</small>
                    </span>
                    <span className="search__price">{p.soldOut ? "Sold out" : formatINR(p.price)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="search__empty">
              <p>No coffee products found for &ldquo;{query}&rdquo;</p>
              <p>Try searching for Classic, Vanilla, Hazelnut, Irish, or Mocha.</p>
              <Link href="/shop" className="btn btn--primary" onClick={onClose}>
                View All Products
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
