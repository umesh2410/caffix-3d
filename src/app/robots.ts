import type { MetadataRoute } from "next";
import { BRAND } from "@/lib/catalog";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/checkout", "/order/", "/api/"] },
    sitemap: `${BRAND.url}/sitemap.xml`,
  };
}
