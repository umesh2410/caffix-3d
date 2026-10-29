"use client";

import { useEffect } from "react";
import { setScrollLocked } from "@/components/SmoothScroll";
import { HERO_READY_EVENT } from "./heroReady";

const MIN_MS = 1400; // long enough to read the brand moment
const MAX_MS = 8000; // never hold shoppers back longer than this
const OPEN_MS = 1000;

// Survives StrictMode's mount → unmount → mount so the intro isn't cut short in development.
let phase: "idle" | "running" | "done" = "idle";

/**
 * Drives the intro overlay rendered by <Intro>: the jar fills with coffee as the hero 3D scene
 * loads, then the doors open onto a ready scene. Touches the DOM directly so nothing re-renders.
 */
export default function IntroController() {
  useEffect(() => {
    const root = document.documentElement;
    const el = document.getElementById("intro");
    const pctEl = document.getElementById("intro-pct");
    if (!el) return;
    if (phase === "done" || (phase === "idle" && !root.classList.contains("intro-active"))) {
      root.classList.remove("intro-active");
      el.classList.add("is-done");
      return;
    }

    phase = "running";
    root.classList.add("intro-active");
    setScrollLocked(true);
    const start = performance.now();
    let shown = 0;
    let raf = 0;
    let doneTimer: number | undefined;
    let ready = !!window.__caffixHeroReady;
    const onReady = () => {
      ready = true;
    };
    window.addEventListener(HERO_READY_EVENT, onReady);

    const finish = () => {
      if (phase !== "running") return;
      phase = "done";
      cancelAnimationFrame(raf);
      el.style.setProperty("--p", "1");
      if (pctEl) pctEl.textContent = "100";
      root.classList.remove("intro-active");
      el.classList.add("is-leaving");
      setScrollLocked(false);
      doneTimer = window.setTimeout(() => el.classList.add("is-done"), OPEN_MS);
    };

    const tick = () => {
      const elapsed = performance.now() - start;
      // Creep towards 90% while loading; run to 100% once the scene is really there.
      const target = ready ? 1 : Math.min(0.9, (elapsed / 2600) * 0.9);
      shown += (target - shown) * (ready ? 0.14 : 0.06);
      el.style.setProperty("--p", shown.toFixed(4));
      if (pctEl) pctEl.textContent = String(Math.round(shown * 100)).padStart(3, "0");
      if ((ready && shown > 0.985 && elapsed > MIN_MS) || elapsed > MAX_MS) {
        finish();
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    el.addEventListener("pointerdown", finish);
    window.addEventListener("keydown", finish);

    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(doneTimer);
      window.removeEventListener(HERO_READY_EVENT, onReady);
      el.removeEventListener("pointerdown", finish);
      window.removeEventListener("keydown", finish);
      if (phase === "running") {
        // Leaving mid-intro: never strand the next page with a locked scroll.
        root.classList.remove("intro-active");
        setScrollLocked(false);
      }
    };
  }, []);

  return null;
}
