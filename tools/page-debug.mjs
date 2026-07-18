import { chromium } from "@playwright/test";
const browser = await chromium.launch({
  headless: true,
  args: ["--enable-unsafe-webgpu", "--enable-features=Vulkan,UseSkiaRenderer", "--use-angle=d3d11"],
});
const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
await page.route("**/*", (r) => r.continue()); // routing disables the HTTP cache
await page.goto("http://localhost:8080/?seed=1#/lattice");
await page.waitForSelector("body[data-settled]", { timeout: 20000 });
const r = await page.evaluate(async () => {
  const e = window.__engineDebug;
  if (!e) return { noEngine: true };
  const { sim, renderer } = e._debug;
  const { buildAttractors } = await import("/js/field/attractors.js");
  const N = { 1: 131072, 2: 49152, 3: 65536, 4: 16384 }[e.tier];
  const { gens } = buildAttractors(N, window.__RESUME__);
  const pos = new Float32Array(await renderer.getArrayBufferAsync(sim.positions.value));
  let totMag = 0, posMag = 0;
  for (let i = 0; i < 1000; i++) posMag += Math.hypot(pos[i*4], pos[i*4+1], pos[i*4+2]);
  let dPos = 0, dCol = 0;
  for (let i = 0; i < 1000; i++) {
    const [ex, ey, ez] = gens.lattice(i); const [cx, cy, cz] = gens.columns(i); dCol += Math.hypot(pos[i*4]-cx, pos[i*4+1]-cy, pos[i*4+2]-cz);
    dPos += Math.hypot(pos[i * 4] - ex, pos[i * 4 + 1] - ey, pos[i * 4 + 2] - ez);
  }
  return {
    engineState: e.state, tier: e.tier, backend: e.renderer,
    k: sim.uniforms.k.value, noise: sim.uniforms.noise.value,
    meanPosErrVsLattice: +(dPos/1000).toFixed(3), meanPosErrVsColumns: +(dCol/1000).toFixed(3),
    meanPosMag: +(posMag/1000).toFixed(3),
  };
});
console.log(JSON.stringify(r, null, 1));
await browser.close();

