import type { CSSProperties } from "react";
import RevealScope from "@/components/RevealScope";

// Reviews and the "12,000+" figure are copied verbatim from thecaffix.in.
// Confirm they come from real customers before launch; remove anything that can't be backed up.
const REVIEWS = [
  {
    quote:
      "I got the Classic and Dark Mocha jars. No clumping at the bottom of the glass at all. Each 125g jar gives 5 thick, luxurious café-style tall glasses!",
    name: "Rohan Mehta",
  },
  {
    quote: "Irish Cream has that luxurious, velvety aroma without being sickly sweet. Total value for money for such premium quality!",
    name: "Sneha Patel",
  },
  {
    quote:
      "The Hazelnut cold coffee is dangerously good. Literally 5 seconds to prepare in cold milk with zero effort. My morning routine is set!",
    name: "Kunal Shah",
  },
];

export default function Reviews() {
  return (
    <section className="section reviews" aria-labelledby="reviews-title">
      <RevealScope>
        <div className="section-head">
          <div className="reveal">
            <p className="eyebrow">Verified buyers</p>
            <h2 id="reviews-title" className="section-title">
              Loved by cold <em>coffee drinkers.</em>
            </h2>
          </div>
          <p className="section-lede reveal" style={{ "--d": 1 } as CSSProperties}>
            Over 12,000+ happy mornings across India.
          </p>
        </div>
        <div className="reviews__grid">
          {REVIEWS.map((r, i) => (
            <figure key={r.name} className="review reveal spotlight" style={{ "--d": i } as CSSProperties}>
              <p className="review__stars" aria-label="Rated 5 out of 5">
                ★★★★★
              </p>
              <blockquote>“{r.quote}”</blockquote>
              <figcaption>
                <strong>{r.name}</strong>
                <span>Verified Buyer</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </RevealScope>
    </section>
  );
}
