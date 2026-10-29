import Link from "next/link";
import BrewLab from "@/components/home/BrewLab";
import Intro from "@/components/home/Intro";
import Marquee from "@/components/Marquee";
import RevealScope from "@/components/RevealScope";
import NewDrop from "@/components/home/NewDrop";
import Reviews from "@/components/home/Reviews";
import Stage from "@/components/home/Stage";
import WhyCaffix from "@/components/home/WhyCaffix";
import JsonLd from "@/components/JsonLd";
import Showcase from "@/components/shop/Showcase";
import { absoluteAsset } from "@/lib/assets";
import { BRAND, FLAVOURS, LOGO_IMAGE } from "@/lib/catalog";

export default function Home() {
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Organization",
              name: BRAND.name,
              url: BRAND.url,
              logo: absoluteAsset(LOGO_IMAGE),
              email: BRAND.email,
              telephone: BRAND.phone,
              sameAs: [BRAND.instagram, BRAND.facebook],
            },
            { "@type": "WebSite", name: BRAND.name, url: BRAND.url },
          ],
        }}
      />
      <Intro />
      <Stage />
      <Marquee
        label="Caffix flavours"
        items={FLAVOURS.map((f) => (
          <span key={f.id}>
            {f.name.split(" ")[0]} <em>{f.name.split(" ").slice(1).join(" ").toLowerCase()}</em>
          </span>
        ))}
      />
      <BrewLab />
      <NewDrop />
      <Marquee
        label="Why Caffix"
        variant="dark"
        reverse
        items={["Ready in 5 secs", "Mixes in cold milk", "3 in 1", "No blender, no mess", "Free shipping above ₹349"]}
      />
      <WhyCaffix />
      <section id="shop" className="section shop" aria-labelledby="shop-title">
        <RevealScope>
          <Showcase
            head={
              <div className="section-head">
                <div className="reveal">
                  <p className="eyebrow">The Caffix shop</p>
                  <h2 id="shop-title" className="section-title">
                    Pick your <em>pour.</em>
                  </h2>
                </div>
                <Link href="/shop" className="text-link">
                  View all products
                </Link>
              </div>
            }
          />
        </RevealScope>
      </section>
      <Reviews />
      <Marquee label="Stay caffeinated" items={["Stay caffeinated", "Your coffee. Your moment.", "Use code CHILL10 for 10% off"]} />
    </>
  );
}
