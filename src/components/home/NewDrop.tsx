import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import RevealScope from "@/components/RevealScope";
import { asset } from "@/lib/assets";
import { getProduct, SACHET_IMAGE } from "@/lib/catalog";
import { formatINR } from "@/lib/pricing";

// Copy from the "New drop" section of thecaffix.in.
const FEATURES = [
  { title: "Café-Style Taste", text: "Classic • Vanilla • Hazelnut • Irish • Mocha" },
  { title: "Ready in 5 Secs", text: "Just mix & enjoy" },
  { title: "Single Serve", text: "Portable & easy" },
];

export default function NewDrop() {
  const sachetPrice = getProduct("caffix-classic-sachet")?.price;
  return (
    <section className="section drop" aria-labelledby="drop-title">
      <RevealScope className="drop__grid">
        <div className="tilt drop__tilt">
          {sachetPrice && (
            <span className="drop__sticker" aria-hidden="true">
              <svg viewBox="0 0 120 120">
                <defs>
                  <path id="drop-sticker-ring" d="M60,60 m-47,0 a47,47 0 1,1 94,0 a47,47 0 1,1 -94,0" />
                </defs>
                <text>
                  <textPath href="#drop-sticker-ring">Single serve · Stay caffeinated · Single serve ·</textPath>
                </text>
              </svg>
              <span className="drop__sticker-price">
                {formatINR(sachetPrice)}
                <small>per sachet</small>
              </span>
            </span>
          )}
          <figure className="drop__media reveal reveal--open">
            <Image
              src={asset(SACHET_IMAGE)}
              alt="Caffix Cold Coffee Sachets - Ready to Unwrap Pure Coffee"
              fill
              sizes="(max-width: 900px) 92vw, 46vw"
            />
            <span className="tilt__glare" aria-hidden="true" />
          </figure>
        </div>
        <div className="drop__copy">
          <p className="eyebrow reveal">New drop</p>
          <h2 id="drop-title" className="section-title reveal" style={{ "--d": 1 } as CSSProperties}>
            Ready to unwrap. <em>Pure coffee.</em>
          </h2>
          <p className="section-lede reveal" style={{ "--d": 2 } as CSSProperties}>
            Meet the Caffix Sachets — your café-style coffee, now in a convenient, single-serve pack. Just mix, shake and
            enjoy in seconds. No blender, no mess, just pure chill.
          </p>
          <ul className="drop__features">
            {FEATURES.map((f, i) => (
              <li key={f.title} className="reveal" style={{ "--d": 3 + i } as CSSProperties}>
                <strong>{f.title}</strong>
                <span>{f.text}</span>
              </li>
            ))}
          </ul>
          <Link href="/shop#sachet" className="btn btn--primary magnetic reveal" style={{ "--d": 6 } as CSSProperties}>
            Shop sachets
          </Link>
        </div>
      </RevealScope>
    </section>
  );
}
