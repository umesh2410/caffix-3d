import Image from "next/image";
import type { CSSProperties, ReactNode } from "react";
import CountUp from "@/components/CountUp";
import RevealScope from "@/components/RevealScope";
import { asset } from "@/lib/assets";

// Figures from the catalogue: five flavours, ready in 5 seconds, 125 g jars, 3-in-1 mix.
const STATS: { label: string; count?: number; value?: string; unit: string }[] = [
  { label: "Signature flavours", count: 5, unit: "" },
  { label: "To mix in cold milk", count: 5, unit: "secs" },
  { label: "Airtight glass jar", count: 125, unit: "g" },
  { label: "Coffee, creamer, sweetener", value: "3", unit: "in 1" },
];

// Trust badges and labels from thecaffix.in.
const TRUST = [
  { img: asset("/images/trust/trust_plant_based.png"), alt: "100% Plant Based", label: "All-Natural Ingredients" },
  { img: asset("/images/trust/trust_no_preservatives.png"), alt: "No Added Preservatives", label: "Zero Artificial Additives" },
  { img: asset("/images/trust/trust_fssai.png"), alt: "FSSAI Approved", label: "Govt Food Safety Certified" },
];

// Every claim below appears on the current thecaffix.in storefront.
const ITEMS: { title: string; text: string; icon: ReactNode }[] = [
  {
    title: "Café-style taste",
    text: "Classic, Vanilla, Hazelnut, Irish and Mocha — five flavours, one easy ritual.",
    icon: (
      <>
        <path d="M14 20h22v14a9 9 0 0 1-9 9h-4a9 9 0 0 1-9-9V20Z" />
        <path d="M36 24h3a5 5 0 0 1 0 10h-3" />
        <path d="M20 8c0 3-3 3-3 6M27 8c0 3-3 3-3 6" />
      </>
    ),
  },
  {
    title: "Ready in 5 secs",
    text: "Just mix with cold milk and enjoy. No blender, no mess.",
    icon: (
      <>
        <circle cx="26" cy="28" r="15" />
        <path d="M26 20v8l5 4M22 8h8" />
      </>
    ),
  },
  {
    title: "3 in 1",
    text: "Coffee, creamer and sweetener in a single mix.",
    icon: (
      <>
        <circle cx="18" cy="22" r="8" />
        <circle cx="34" cy="22" r="8" />
        <circle cx="26" cy="35" r="8" />
      </>
    ),
  },
  {
    title: "Made with Arabica",
    text: "100% Arabica coffee, granulated to dissolve straight into ice-cold milk.",
    icon: (
      <>
        <path d="M26 8c9 4 13 12 11 21s-10 15-17 13S9 32 11 23 18 5 26 8Z" />
        <path d="M24 11c-4 8-3 18 3 29" />
      </>
    ),
  },
  {
    title: "No added preservatives",
    text: "No chicory and no artificial preservatives in the mix.",
    icon: (
      <>
        <rect x="14" y="12" width="24" height="30" rx="5" />
        <path d="M20 26l5 5 8-10" />
      </>
    ),
  },
  {
    title: "FSSAI approved",
    text: "Government food safety certified, as stated by the brand.",
    icon: (
      <>
        <path d="M26 7l15 6v11c0 10-6 17-15 21-9-4-15-11-15-21V13l15-6Z" />
        <path d="M19 26l5 5 9-10" />
      </>
    ),
  },
];

export default function WhyCaffix() {
  return (
    <section id="why" className="section why" aria-labelledby="why-title">
      <RevealScope>
        <div className="section-head">
          <div className="reveal">
            <p className="eyebrow">Why Caffix</p>
            <h2 id="why-title" className="section-title">
              Real coffee. <em>Zero fuss.</em>
            </h2>
          </div>
          <p className="section-lede reveal" style={{ "--d": 1 } as CSSProperties}>
            Everything that makes the ritual easy, and nothing you have to work for.
          </p>
        </div>
        <dl className="stats">
          {STATS.map((s, i) => (
            <div key={s.label} className="stat reveal" style={{ "--d": i } as CSSProperties}>
              <dt>{s.label}</dt>
              <dd>
                {s.count ? <CountUp to={s.count} /> : s.value}
                <small>{s.unit}</small>
              </dd>
            </div>
          ))}
        </dl>
        <div className="why__grid">
          {ITEMS.map((item, i) => (
            <article key={item.title} className="why-card reveal spotlight" style={{ "--d": i } as CSSProperties}>
              <svg
                className="why-card__icon"
                viewBox="0 0 52 52"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                {item.icon}
              </svg>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </article>
          ))}
        </div>

        <div className="trust reveal">
          <p className="trust__title">Here&apos;s why you can trust CAFFIX!</p>
          <ul className="trust__list">
            {TRUST.map((t) => (
              <li key={t.label}>
                <Image src={t.img} alt={t.alt} width={72} height={72} />
                <span>{t.label}</span>
              </li>
            ))}
          </ul>
        </div>
      </RevealScope>
    </section>
  );
}
