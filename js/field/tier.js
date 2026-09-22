/* Capability tiers (PLAN §5.4). Pure detection — no three.js import here so the
   content layer can call this before the engine is dynamically loaded.
   T1 webgpu desktop 65536 · T2 webgpu mobile 49152 · T3 webgl desktop 65536 ·
   T4 webgl mobile 16384 · T0 static (no JS / reduced-motion / init failure). */

export const TIERS = {
  1: { renderer: "webgpu", particles: 65536 },
  2: { renderer: "webgpu", particles: 49152 },
  3: { renderer: "webgl", particles: 65536 },
  4: { renderer: "webgl", particles: 16384 },
  0: { renderer: "static", particles: 0 },
};

export function isSoftwareRendererName(name = "") {
  return /swiftshader|llvmpipe|softpipe|software rasterizer|lavapipe|mesa offscreen/i.test(String(name));
}

function rendererName(gl) {
  try {
    const ext = gl.getExtension("WEBGL_debug_renderer_info");
    if (ext) return gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) || "";
  } catch {}
  try { return gl.getParameter(gl.RENDERER) || ""; } catch { return ""; }
}

export function detectTier({ force } = {}) {
  if (force === "static") return 0;
  const mobile = matchMedia("(pointer: coarse)").matches;
  // Explicit QA/developer override: let FieldEngine attempt WebGL directly and
  // fall back to T0 on initialization failure. Capability probes can under-report
  // WebGL2 even when Three's WebGPURenderer can create its WebGL backend.
  if (force === "webgl") return mobile ? 4 : 3;
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return 0;
  const webgpu = "gpu" in navigator;
  if (webgpu) return mobile ? 2 : 1;
  const gl = document.createElement("canvas").getContext("webgl2");
  if (!gl) return 0;
  if (isSoftwareRendererName(rendererName(gl))) return 0;
  return mobile ? 4 : 3;
}

export function downshift(tier) {
  return { 1: 2, 2: 4, 3: 4, 4: 4, 0: 0 }[tier] ?? 0;
}

export function adaptTier({ tier, fps, lowStreak = 0 }) {
  const nextStreak = fps < 45 ? lowStreak + 1 : 0;
  if (tier === 4 && fps < 30 && nextStreak >= 2) {
    return { tier: 0, lowStreak: 0, staticFallback: true };
  }
  const next = downshift(tier);
  if (nextStreak >= 3 && tier !== next) {
    return { tier: next, lowStreak: 0, staticFallback: false };
  }
  return { tier, lowStreak: nextStreak, staticFallback: false };
}
