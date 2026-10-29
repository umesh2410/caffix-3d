import { useState } from "react";
import * as THREE from "three";

/**
 * Render resolution that adapts to the device: starts at a capped device pixel ratio and is
 * stepped down by <PerformanceMonitor> when frames drop, so scrolling stays smooth.
 */
export function useAdaptiveDpr(lowPower: boolean) {
  const [range] = useState(() => {
    const max = Math.min(window.devicePixelRatio || 1, lowPower ? 1.25 : 1.5);
    return { min: Math.min(0.8, max), max };
  });
  const [dpr, setDpr] = useState(range.max);
  const onChange = ({ factor }: { factor: number }) =>
    setDpr(Math.round((range.min + (range.max - range.min) * factor) * 20) / 20);
  return { dpr, onChange, onFallback: () => setDpr(range.min) };
}

export const TAU = Math.PI * 2;

/** Phones and portrait tablets get the stacked composition — mirrors the CSS media query. */
export const isStacked = (w: number, h: number) => w <= 760 || (w <= 1100 && h >= w);

export const clamp01 =(v: number) => Math.min(1, Math.max(0, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
export const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
/** Smoothstep between edges a and b. */
export const smooth = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
export const easeOutBounce = (t: number) => {
  const n = 7.5625;
  const d = 2.75;
  if (t < 1 / d) return n * t * t;
  if (t < 2 / d) return n * (t -= 1.5 / d) * t + 0.75;
  if (t < 2.5 / d) return n * (t -= 2.25 / d) * t + 0.9375;
  return n * (t -= 2.625 / d) * t + 0.984375;
};

export function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function canvasTexture(width: number, height: number, draw: (c: HTMLCanvasElement) => void) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  draw(canvas);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
