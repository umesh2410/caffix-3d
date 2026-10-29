import Link from "next/link";
import { BRAND, CATEGORIES } from "@/lib/catalog";
import { INFO_PAGES } from "@/lib/info";
import BackToTop from "./BackToTop";
import NewsletterForm from "./NewsletterForm";

export default function Footer() {
  const info = INFO_PAGES.filter((p) => p.group === "Information");
  const support = INFO_PAGES.filter((p) => p.group === "Support");

  return (
    <footer className="footer">
      <div className="footer__hero">
        <div>
          <p className="footer__kicker">Got a coffee question?</p>
          <p className="footer__title" aria-hidden="true">
            Stay <em>caffeinated.</em>
          </p>
        </div>
        <NewsletterForm />
      </div>

      <div className="footer__grid">
        <div>
          <h2 className="footer__heading">Shop</h2>
          <ul>
            <li>
              <Link href="/shop">All Caffix</Link>
            </li>
            {CATEGORIES.map((c) => (
              <li key={c.id}>
                <Link href={`/shop#${c.id}`}>{c.label}</Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="footer__heading">Information</h2>
          <ul>
            {info.map((p) => (
              <li key={p.slug}>
                <Link href={`/info/${p.slug}`}>{p.title}</Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="footer__heading">Support</h2>
          <ul>
            {support.map((p) => (
              <li key={p.slug}>
                <Link href={`/info/${p.slug}`}>{p.title}</Link>
              </li>
            ))}
            <li>
              <Link href="/track">Track your order</Link>
            </li>
          </ul>
        </div>
        <div>
          <h2 className="footer__heading">Contact us</h2>
          <p className="footer__muted">{BRAND.supportHours}</p>
          <ul>
            <li>
              <a href={`mailto:${BRAND.email}`}>{BRAND.email}</a>
            </li>
            <li>
              <a href={BRAND.phoneHref}>{BRAND.phone}</a>
            </li>
            <li>
              <a href={BRAND.whatsapp} target="_blank" rel="noopener noreferrer">
                WhatsApp
              </a>
            </li>
          </ul>
          <div className="footer__social">
            <a href={BRAND.instagram} target="_blank" rel="noopener noreferrer">
              Instagram
            </a>
            <a href={BRAND.facebook} target="_blank" rel="noopener noreferrer">
              Facebook
            </a>
          </div>
        </div>
      </div>

      <div className="footer__bottom">
        <p className="footer__legal">© Caffix™. All Rights Reserved.</p>
        <ul className="footer__pay" aria-label="Payment options">
          {/* Methods offered through the Razorpay checkout the store uses. */}
          {["UPI", "Cards", "Net banking", "Wallets"].map((m) => (
            <li key={m}>{m}</li>
          ))}
        </ul>
        <BackToTop />
      </div>
    </footer>
  );
}
