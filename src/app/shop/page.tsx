import type { Metadata } from "next";
import Marquee from "@/components/Marquee";
import PageHero from "@/components/PageHero";
import Showcase from "@/components/shop/Showcase";
import { formatINR, FREE_DELIVERY_THRESHOLD } from "@/lib/pricing";

export const metadata: Metadata = {
  title: "Shop all Caffix",
  description:
    "Shop Caffix instant cold coffee jars, single-serve sachets, combos, Pure Black instant coffee and brewing essentials.",
  alternates: { canonical: "/shop" },
};

export default function ShopPage() {
  return (
    <>
      <PageHero
        eyebrow="All Caffix"
        title="The"
        accent="shop."
        lede={`Jars, single-serve sachets, combos and brewing essentials. Free shipping on orders above ${formatINR(FREE_DELIVERY_THRESHOLD)}.`}
      />
      <Marquee
        label="Shop categories"
        items={["Caffix Jar", "Caffix Sachet", "Caffix Combo", "Caffix Instant Coffee", "Caffix Essential"]}
      />
      <div className="section shop">
        <Showcase syncHash head={null} />
      </div>
    </>
  );
}
