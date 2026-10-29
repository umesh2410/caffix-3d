/** Fired once the hero is ready to be revealed (first 3D frame rendered, or no WebGL). */
export const HERO_READY_EVENT = "caffix:hero-ready";

declare global {
  interface Window {
    __caffixHeroReady?: boolean;
  }
}

export function announceHeroReady() {
  if (window.__caffixHeroReady) return;
  window.__caffixHeroReady = true;
  window.dispatchEvent(new Event(HERO_READY_EVENT));
}
