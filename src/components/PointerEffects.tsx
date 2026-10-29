"use client";

import { useEffect } from "react";

/**
 * One delegated listener drives every `.spotlight` (cursor glow) and `.tilt` (3D tilt) element,
 * so server-rendered sections get pointer effects without becoming client components.
 */
export default function PointerEffects() {
  useEffect(() => {
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!fine || reduced) return;

    let current: HTMLElement | null = null;
    let magnet: HTMLElement | null = null;
    const reset = (el: HTMLElement) => {
      el.style.removeProperty("--rx");
      el.style.removeProperty("--ry");
    };
    const releaseMagnet = () => {
      magnet?.style.removeProperty("--tx");
      magnet?.style.removeProperty("--ty");
      magnet = null;
    };
    const onMove = (e: PointerEvent) => {
      const target = e.target instanceof Element ? e.target : null;
      // Magnetic buttons lean a few pixels towards the pointer.
      const m = target?.closest<HTMLElement>(".magnetic") ?? null;
      if (m !== magnet) releaseMagnet();
      if (m) {
        magnet = m;
        const r = m.getBoundingClientRect();
        m.style.setProperty("--tx", `${((e.clientX - (r.left + r.width / 2)) * 0.22).toFixed(1)}px`);
        m.style.setProperty("--ty", `${((e.clientY - (r.top + r.height / 2)) * 0.3).toFixed(1)}px`);
      }
      const el = target?.closest<HTMLElement>(".spotlight, .tilt") ?? null;
      if (current && current !== el) reset(current);
      current = el;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width;
      const y = (e.clientY - r.top) / r.height;
      el.style.setProperty("--mx", `${(x * 100).toFixed(1)}%`);
      el.style.setProperty("--my", `${(y * 100).toFixed(1)}%`);
      if (el.classList.contains("tilt")) {
        el.style.setProperty("--rx", `${((0.5 - y) * 10).toFixed(2)}deg`);
        el.style.setProperty("--ry", `${((x - 0.5) * 12).toFixed(2)}deg`);
      }
    };
    document.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", releaseMagnet);
    return () => {
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", releaseMagnet);
    };
  }, []);

  return null;
}
