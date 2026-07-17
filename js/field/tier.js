/* Capability tiers (PLAN §5.4). Pure detection — no three.js import here so the
   content layer can call this before the engine is dynamically loaded.
   T1 webgpu desktop 131072 · T2 webgpu mobile 49152 · T3 webgl desktop 65536 ·
   T4 webgl mobile 16384 · T0 static (no JS / reduced-motion / init failure). */

export const TIERS = {
  1: { renderer: "webgpu", particles: 131072 },
  2: { renderer: "webgpu", particles: 49152 },
  3: { renderer: "webgl", particles: 65536 },
  4: { renderer: "webgl", particles: 16384 },
  0: { renderer: "static", particles: 0 },
};

export function detectTier({ force } = {}) {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return 0;
  const mobile = matchMedia("(pointer: coarse)").matches;
  const webgpu = force === "webgl" ? false : "gpu" in navigator;
  if (webgpu) return mobile ? 2 : 1;
  const gl = document.createElement("canvas").getContext("webgl2");
  if (!gl) return 0;
  return mobile ? 4 : 3;
}

/* One tier down for the FPS guard (§5.4: downshift if sampled FPS < 45 for 3 s). */
export function downshift(tier) {
  return { 1: 2, 2: 4, 3: 4, 4: 4, 0: 0 }[tier] ?? 0;
}
