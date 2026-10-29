"use client";

import { useState, useSyncExternalStore, type ReactNode } from "react";
import { CATEGORIES, PRODUCTS, type Category } from "@/lib/catalog";
import ProductCard from "./ProductCard";

type Filter = Category | "all";
const FILTERS: { id: Filter; label: string }[] = [{ id: "all", label: "All Caffix" }, ...CATEGORIES];
const isFilter = (v: string): v is Filter => FILTERS.some((f) => f.id === v);

function subscribeHash(cb: () => void) {
  window.addEventListener("hashchange", cb);
  return () => window.removeEventListener("hashchange", cb);
}
function readHash(): Filter {
  const h = window.location.hash.slice(1);
  return isFilter(h) ? h : "all";
}

interface Props {
  head: ReactNode;
  /** Keep the active filter in the URL hash (used on /shop so footer links can deep-link). */
  syncHash?: boolean;
}

export default function Showcase({ head, syncHash = false }: Props) {
  const hashFilter = useSyncExternalStore(subscribeHash, readHash, () => "all" as Filter);
  const [localFilter, setLocalFilter] = useState<Filter>("all");
  const filter = syncHash ? hashFilter : localFilter;
  const visible = filter === "all" ? PRODUCTS : PRODUCTS.filter((p) => p.category === filter);

  const choose = (id: Filter) => {
    if (!syncHash) return setLocalFilter(id);
    const url = id === "all" ? window.location.pathname : `#${id}`;
    window.history.replaceState(null, "", url);
    window.dispatchEvent(new HashChangeEvent("hashchange"));
  };

  return (
    <>
      {head}
      <div className="filters" role="group" aria-label="Filter products">
        {FILTERS.map((f) => (
          <button key={f.id} type="button" className="filter" aria-pressed={filter === f.id} onClick={() => choose(f.id)}>
            {f.label}
          </button>
        ))}
      </div>
      <p className="sr-only" aria-live="polite">
        {visible.length} products
      </p>
      <div className="product-grid" key={filter}>
        {visible.map((p, i) => (
          <ProductCard key={p.id} product={p} index={i} />
        ))}
      </div>
    </>
  );
}
