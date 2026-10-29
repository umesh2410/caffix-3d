import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import JsonLd from "@/components/JsonLd";
import Gallery from "@/components/product/Gallery";
import ProductBuyBox from "@/components/product/ProductBuyBox";
import ProductCard from "@/components/shop/ProductCard";
import { absoluteAsset, asset } from "@/lib/assets";
import { BRAND, CATEGORIES, getFlavour, getProduct, PRODUCTS } from "@/lib/catalog";

export function generateStaticParams() {
  return PRODUCTS.map((p) => ({ id: p.id }));
}

export async function generateMetadata({ params }: PageProps<"/products/[id]">): Promise<Metadata> {
  const { id } = await params;
  const product = getProduct(id);
  if (!product) return {};
  return {
    title: `${product.name} — ${product.packLabel}`,
    description: product.short,
    alternates: { canonical: `/products/${product.id}` },
    openGraph: {
      title: `${product.name} | CAFFIX`,
      description: product.short,
      url: `/products/${product.id}`,
      images: [{ url: asset(product.image) }],
    },
  };
}

const COFFEE_CATEGORIES = new Set(["jar", "sachet", "combo"]);

// Every product is prerendered from generateStaticParams, so blocking on params costs nothing and
// keeps unknown ids returning a real 404 (a Suspense boundary would stream a soft 404 instead).
export const instant = false;

export default async function ProductPage({ params }: PageProps<"/products/[id]">) {
  const { id } = await params;
  const product = getProduct(id);
  if (!product) notFound();

  const category = CATEGORIES.find((c) => c.id === product.category);
  const flavour = product.flavourId ? getFlavour(product.flavourId) : undefined;
  const related = PRODUCTS.filter((p) => p.category === product.category && p.id !== product.id).slice(0, 4);
  const facts: [string, string][] = [
    ["Pack", product.packLabel],
    ...(product.servings ? ([["Serves", product.servings]] as [string, string][]) : []),
    ...(flavour ? ([["Flavour", `${flavour.name} · ${flavour.sub}`]] as [string, string][]) : []),
    ...(product.nutrition
      ? ([
          ["Calories", product.nutrition.calories],
          ["Caffeine", product.nutrition.caffeine],
          ["Dissolves", product.nutrition.dissolve],
        ] as [string, string][])
      : []),
    ["Shipping", "Free above ₹349, otherwise ₹40"],
  ];

  return (
    <div className="page">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Product",
              name: product.officialName,
              description: product.description,
              sku: product.id,
              image: product.images.map(absoluteAsset),
              brand: { "@type": "Brand", name: BRAND.name },
              offers: {
                "@type": "Offer",
                url: `${BRAND.url}/products/${product.id}`,
                priceCurrency: "INR",
                price: product.price,
              },
            },
            {
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: "Home", item: BRAND.url },
                { "@type": "ListItem", position: 2, name: "Shop", item: `${BRAND.url}/shop` },
                { "@type": "ListItem", position: 3, name: product.name, item: `${BRAND.url}/products/${product.id}` },
              ],
            },
          ],
        }}
      />

      <nav className="crumbs" aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <span aria-hidden="true">/</span>
        <Link href={`/shop#${product.category}`}>{category?.label ?? "Shop"}</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{product.name}</span>
      </nav>

      <div className="pdp">
        <Gallery images={product.images} name={product.name} />
        <div className="pdp__aside">
          <ProductBuyBox product={product} />
          <dl className="buybox__facts">
            {facts.map(([k, v]) => (
              <div key={k}>
                <dt>{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      <section className="pdp__story" aria-label="Product details">
        <div>
          <h2>About this product</h2>
          <p>{product.description}</p>
        </div>
        {COFFEE_CATEGORIES.has(product.category) && (
          <div>
            <h2>How to make it</h2>
            <ol className="howto">
              <li>Scoop 2–3 spoons, or tear one sachet, into a glass.</li>
              <li>Pour cold milk over ice.</li>
              <li>Stir for 5 seconds and enjoy.</li>
            </ol>
          </div>
        )}
      </section>

      {related.length > 0 && (
        <section className="related" aria-labelledby="related-title">
          <h2 id="related-title">You may also like</h2>
          <div className="product-grid">
            {related.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
