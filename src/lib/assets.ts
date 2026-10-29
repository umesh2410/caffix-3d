// Brand photography is copied from thecaffix.in into /public/images and /public/image.
// Set NEXT_PUBLIC_ASSET_ORIGIN (e.g. "https://www.thecaffix.in") to serve it from a CDN instead.
export const ASSET_ORIGIN = process.env.NEXT_PUBLIC_ASSET_ORIGIN ?? "";

export function asset(path: string): string {
  return /^https?:\/\//.test(path) ? path : `${ASSET_ORIGIN}${path}`;
}

const SITE_URL = "https://www.thecaffix.in";

/** Absolute URL for structured data and feeds. */
export function absoluteAsset(path: string): string {
  const url = asset(path);
  return /^https?:\/\//.test(url) ? url : `${SITE_URL}${url}`;
}

/** Same-origin URL (via the Next.js image optimizer) that WebGL can safely read as a texture. */
export function textureUrl(path: string, width = 640): string {
  // Local files are already same-origin; skip the optimizer round-trip so the 3D label paints sooner.
  if (!ASSET_ORIGIN) return path;
  return `/_next/image?url=${encodeURIComponent(asset(path))}&w=${width}&q=75`;
}
