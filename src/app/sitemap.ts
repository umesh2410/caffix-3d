import type { MetadataRoute } from "next";
import { BRAND, PRODUCTS } from "@/lib/catalog";
import { INFO_PAGES } from "@/lib/info";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: BRAND.url, priority: 1 },
    { url: `${BRAND.url}/shop`, priority: 0.9 },
    { url: `${BRAND.url}/track`, priority: 0.3 },
    ...PRODUCTS.map((p) => ({ url: `${BRAND.url}/products/${p.id}`, priority: 0.8 })),
    ...INFO_PAGES.map((p) => ({ url: `${BRAND.url}/info/${p.slug}`, priority: 0.4 })),
  ];
}
