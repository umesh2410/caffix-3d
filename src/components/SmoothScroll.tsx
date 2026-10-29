"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

let lenis: Lenis | null = null;

export function scrollToTarget(target: string | HTMLElement) {
  if (lenis) {
    lenis.scrollTo(target, { duration: 1.4 });
    return;
  }
  const el = typeof target === "string" ? document.querySelector(target) : target;
  el?.scrollIntoView({ behavior: "smooth" });
}

export function scrollToY(y: number) {
  if (lenis) lenis.scrollTo(y, { duration: 1.2 });
  else window.scrollTo({ top: y, behavior: "smooth" });
}

export function scrollToTop() {
  if (lenis) lenis.scrollTo(0, { duration: 1.4 });
  else window.scrollTo({ top: 0, behavior: "smooth" });
}

export function setScrollLocked(locked: boolean) {
  document.documentElement.classList.toggle("is-scroll-locked", locked);
  if (locked) lenis?.stop();
  else lenis?.start();
}

export default function SmoothScroll() {
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    // Mobile address-bar show/hide shouldn't recalculate every trigger mid-scroll.
    ScrollTrigger.config({ ignoreMobileResize: true });
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    // Wheel and touch scrolling stay native: the browser scrolls on its compositor thread, so the page
    // keeps gliding even while the 3D scenes are busy on the main thread. Lenis only animates
    // programmatic scrolls (anchors, "back to top", step jumps).
    const instance = new Lenis({ smoothWheel: false, syncTouch: false, anchors: true });
    lenis = instance;
    instance.on("scroll", ScrollTrigger.update);
    const tick = (time: number) => instance.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(tick);
      instance.destroy();
      if (lenis === instance) lenis = null;
    };
  }, []);

  return null;
}
