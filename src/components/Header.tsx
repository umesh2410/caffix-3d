"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import SearchDialog from "@/components/SearchDialog";
import { scrollToTop } from "@/components/SmoothScroll";
import { asset } from "@/lib/assets";
import { LOGO_IMAGE } from "@/lib/catalog";
import { cart, useCart } from "@/lib/cartStore";

const NAV = [
  { href: "/#flavours", label: "Flavours" },
  { href: "/#brew", label: "How it works" },
  { href: "/#why", label: "Why Caffix" },
  { href: "/shop", label: "Shop" },
];
const MORE = [
  { href: "/info/bulk", label: "HoReCa & Corporate" },
  { href: "/track", label: "Track order" },
  { href: "/info/contact", label: "Contact" },
];

export default function Header() {
  const pathname = usePathname();
  const { lines, bump } = useCart();
  const count = lines.reduce((n, l) => n + l.qty, 0);
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const closeSearch = useCallback(() => setSearchOpen(false), []);
  const isHome = pathname === "/";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenuOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  const solid = scrolled || !isHome || menuOpen;

  return (
    <header
      className={`header${solid ? " is-solid" : ""}${scrolled ? " is-scrolled" : ""}${menuOpen ? " is-menu-open" : ""}`}
    >
      <div className="header__inner">
        <Link
          href="/"
          className="header__logo"
          aria-label="CAFFIX home"
          onClick={(e) => {
            setMenuOpen(false);
            // Already on home: glide back to the hero instead of reloading.
            if (isHome) {
              e.preventDefault();
              scrollToTop();
            }
          }}
        >
          <Image src={asset(LOGO_IMAGE)} alt="CAFFIX" width={94} height={40} preload />
        </Link>

        <nav className="header__nav" aria-label="Primary">
          <ul>
            {NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`nav-link${pathname === item.href ? " is-active" : ""}`}
                  onClick={() => setMenuOpen(false)}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="header__actions">
          <button type="button" className="cart-button" onClick={() => setSearchOpen(true)} aria-label="Search products">
            <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
              <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="1.6" />
              <path d="m20 20-3.5-3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </button>
          <button
            type="button"
            className="cart-button"
            onClick={() => cart.setDrawer(true)}
            aria-label={`Open cart, ${count} ${count === 1 ? "item" : "items"}`}
          >
            <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
              <path
                d="M5 8h14l-1.2 11.1a2 2 0 0 1-2 1.9H8.2a2 2 0 0 1-2-1.9L5 8Zm4 0V6.5a3 3 0 0 1 6 0V8"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span key={bump} className={`cart-button__count${bump ? " is-bumped" : ""}`} aria-hidden="true">
              {count}
            </span>
          </button>
          <button
            type="button"
            className="menu-button"
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            onClick={() => setMenuOpen((o) => !o)}
          >
            <span className="sr-only">{menuOpen ? "Close menu" : "Open menu"}</span>
            <span className="menu-button__bars" aria-hidden="true" />
          </button>
        </div>
      </div>

      <SearchDialog open={searchOpen} onClose={closeSearch} />

      <div id="mobile-menu" className="mobile-menu" hidden={!menuOpen}>
        <ul>
          {[...NAV, ...MORE].map((item, i) => (
            <li key={item.href} style={{ transitionDelay: `${i * 40}ms` }}>
              <Link href={item.href} onClick={() => setMenuOpen(false)}>
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </header>
  );
}
