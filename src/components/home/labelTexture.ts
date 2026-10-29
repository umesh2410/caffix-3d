import type { Flavour } from "@/lib/catalog";

// Draws the jar wrap label onto a canvas. The front panel follows the real jar layout
// (logo, "instant", flavour name, "3 in 1"); the side panels carry copy from the brand's FAQ.
// Swap this for the printed label artwork once the brand shares a flat export.

export const LABEL_W = 2048;
export const LABEL_H = 640;

export interface LabelFonts {
  display: string;
  serif: string;
  sans: string;
}

export function readFonts(): LabelFonts {
  const css = getComputedStyle(document.documentElement);
  const pick = (name: string, fallback: string) => css.getPropertyValue(name).trim() || fallback;
  return {
    display: pick("--font-display", "sans-serif"),
    serif: pick("--font-serif", "serif"),
    sans: pick("--font-sans", "sans-serif"),
  };
}

export async function ensureFonts(f: LabelFonts) {
  try {
    await Promise.all([
      document.fonts.load(`800 120px ${f.display}`),
      document.fonts.load(`italic 400 80px ${f.serif}`),
      document.fonts.load(`600 28px ${f.sans}`),
    ]);
  } catch {
    // Fall back to system fonts; the label still renders.
  }
}

export function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hexToRgb(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function rgba(hex: string, a: number) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r},${g},${b},${a})`;
}

function tracked(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, spacing: number) {
  ctx.letterSpacing = `${spacing}px`;
  ctx.fillText(text, x, y);
  ctx.letterSpacing = "0px";
}

export function drawLabel(
  canvas: HTMLCanvasElement,
  flavour: Flavour,
  fonts: LabelFonts,
  logo: HTMLImageElement | null
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const { bg, ink, accent, word1, word2 } = flavour.label;
  const W = LABEL_W;
  const H = LABEL_H;

  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Paper grain
  const rand = mulberry32(7);
  for (let i = 0; i < 9000; i++) {
    ctx.fillStyle = rand() > 0.5 ? rgba("#ffffff", 0.035) : rgba("#000000", 0.05);
    ctx.fillRect(rand() * W, rand() * H, 2, 2);
  }

  // Rules
  ctx.strokeStyle = accent;
  ctx.lineWidth = 3;
  for (const y of [34, H - 34]) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = rgba(accent, 0.6);
  for (const y of [44, H - 44]) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }
  ctx.strokeStyle = rgba(ink, 0.16);
  for (const x of [690, 1358]) {
    ctx.beginPath();
    ctx.moveTo(x, 90);
    ctx.lineTo(x, H - 90);
    ctx.stroke();
  }

  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";

  // ---- Front panel ----
  const cx = 1024;
  if (logo) {
    const lw = 300;
    const lh = (logo.naturalHeight / logo.naturalWidth) * lw;
    ctx.drawImage(logo, cx - lw / 2, 66, lw, lh);
  } else {
    ctx.fillStyle = ink;
    ctx.font = `800 110px ${fonts.display}`;
    ctx.fillText("caffix", cx, 180);
  }

  ctx.fillStyle = accent;
  ctx.font = `italic 400 58px ${fonts.serif}`;
  ctx.fillText("instant", cx, 262);

  let size = 156;
  ctx.font = `800 ${size}px ${fonts.display}`;
  ctx.letterSpacing = "-4px";
  while (ctx.measureText(word1.toUpperCase()).width > 560 && size > 80) {
    size -= 4;
    ctx.font = `800 ${size}px ${fonts.display}`;
  }
  const word1Width = ctx.measureText(word1.toUpperCase()).width;
  ctx.fillStyle = ink;
  ctx.fillText(word1.toUpperCase(), cx, 404);
  ctx.letterSpacing = "0px";

  ctx.fillStyle = accent;
  ctx.font = `italic 400 96px ${fonts.serif}`;
  ctx.textAlign = "right";
  ctx.fillText(word2, cx + word1Width / 2 + 10, 482);
  ctx.textAlign = "center";

  ctx.fillStyle = rgba(ink, 0.78);
  ctx.font = `600 26px ${fonts.sans}`;
  tracked(ctx, "COLD COFFEE", cx, 540, 10);

  // Pills: "3 in 1" and net weight
  const pill = (label: string, x: number) => {
    ctx.font = `700 24px ${fonts.sans}`;
    ctx.letterSpacing = "4px";
    const w = ctx.measureText(label).width + 44;
    ctx.strokeStyle = rgba(ink, 0.55);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(x - w / 2, 560, w, 40, 20);
    ctx.stroke();
    ctx.fillStyle = ink;
    ctx.fillText(label, x + 2, 589);
    ctx.letterSpacing = "0px";
  };
  pill("3 IN 1", cx - 170);
  pill("125 G", cx + 170);

  // ---- Left panel: how to ----
  const lx = 348;
  ctx.fillStyle = accent;
  ctx.font = `700 24px ${fonts.sans}`;
  tracked(ctx, "HOW TO", lx, 150, 8);
  ctx.fillStyle = ink;
  ctx.font = `italic 400 76px ${fonts.serif}`;
  ctx.fillText("Cold in 5 secs", lx, 236);
  ctx.font = `500 30px ${fonts.sans}`;
  ctx.textAlign = "left";
  const steps = ["Add 2–3 spoons", "Pour chilled milk over ice", "Stir for 5 seconds"];
  steps.forEach((s, i) => {
    const y = 330 + i * 72;
    ctx.fillStyle = accent;
    ctx.font = `700 26px ${fonts.sans}`;
    ctx.fillText(`0${i + 1}`, lx - 210, y);
    ctx.fillStyle = ink;
    ctx.font = `500 30px ${fonts.sans}`;
    ctx.fillText(s, lx - 150, y);
  });
  ctx.textAlign = "center";

  // ---- Right panel: inside ----
  const rx = 1702;
  ctx.fillStyle = accent;
  ctx.font = `700 24px ${fonts.sans}`;
  tracked(ctx, "INSIDE", rx, 150, 8);
  ctx.fillStyle = ink;
  ctx.font = `italic 400 76px ${fonts.serif}`;
  ctx.fillText("3 in 1", rx, 236);
  ctx.font = `500 30px ${fonts.sans}`;
  ["Coffee + creamer + sweetener", "Made with 100% Arabica", "Dissolves in cold milk"].forEach((s, i) => {
    ctx.fillText(s, rx, 330 + i * 72);
  });
  ctx.fillStyle = rgba(ink, 0.6);
  ctx.font = `700 22px ${fonts.sans}`;
  tracked(ctx, "STAY CAFFEINATED", rx, 560, 8);
}

/** Near-white speckle map; the powder material tints it with the flavour colour. */
export function drawPowder(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const { width: W, height: H } = canvas;
  ctx.fillStyle = "#e6e2dc";
  ctx.fillRect(0, 0, W, H);
  const rand = mulberry32(42);
  for (let i = 0; i < 14000; i++) {
    const v = rand();
    const shade = v > 0.6 ? 255 : v > 0.25 ? 200 : 120;
    ctx.fillStyle = `rgba(${shade},${shade - 6},${shade - 14},${0.35 + rand() * 0.5})`;
    const s = 1 + rand() * 2.5;
    ctx.fillRect(rand() * W, rand() * H, s, s);
  }
}

export function drawSoftDot(canvas: HTMLCanvasElement, inner = "rgba(255,255,255,1)") {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const { width: W } = canvas;
  const g = ctx.createRadialGradient(W / 2, W / 2, 0, W / 2, W / 2, W / 2);
  g.addColorStop(0, inner);
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, W);
}

export function drawShadow(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const { width: W } = canvas;
  const g = ctx.createRadialGradient(W / 2, W / 2, 0, W / 2, W / 2, W / 2);
  g.addColorStop(0, "rgba(0,0,0,0.55)");
  g.addColorStop(0.45, "rgba(0,0,0,0.22)");
  g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, W);
}
