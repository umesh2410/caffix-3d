let support: boolean | null = null;

/**
 * Checks WebGL once and caches the answer. The probe context is released immediately:
 * browsers cap live WebGL contexts (~16) and drop the oldest — which would be the 3D scenes.
 */
export function hasWebGL(): boolean {
  if (support !== null) return support;
  try {
    const canvas = document.createElement("canvas");
    const gl = (canvas.getContext("webgl2") || canvas.getContext("webgl")) as WebGLRenderingContext | null;
    support = !!gl;
    gl?.getExtension("WEBGL_lose_context")?.loseContext();
  } catch {
    support = false;
  }
  return support;
}
