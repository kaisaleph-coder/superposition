#!/usr/bin/env node
/* P2 gate: 5-minute memory soak (PLAN §11). Runs the live field (?seed&run) in
   headless chromium, samples JS heap every 10 s, asserts stability: mean of the
   final third ≤ 1.15 × mean of the first third, and fps stays ≥ 50.
   Usage: node tools/soak.mjs [minutes] */
import { chromium } from "@playwright/test";

const minutes = parseFloat(process.argv[2] || "5");
const browser = await chromium.launch({
  headless: true,
  args: ["--enable-unsafe-webgpu", "--enable-features=Vulkan,UseSkiaRenderer", "--use-angle=d3d11"],
});
const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
await page.goto("http://localhost:8080/?seed=1&run=1");
await page.waitForSelector("body[data-settled]", { timeout: 20000 });

const heap = [], fpsS = [];
const ticks = Math.round((minutes * 60) / 10);
for (let i = 0; i < ticks; i++) {
  await page.waitForTimeout(10_000);
  const s = await page.evaluate(() => ({
    heap: performance.memory ? performance.memory.usedJSHeapSize : 0,
    fps: +document.body.dataset.fps || 0,
  }));
  heap.push(s.heap); fpsS.push(s.fps);
  console.log(`t+${(i + 1) * 10}s heap=${(s.heap / 1048576).toFixed(1)}MB fps=${s.fps}`);
}
await browser.close();

const third = Math.max(1, Math.floor(heap.length / 3));
const mean = (a) => a.reduce((s, x) => s + x, 0) / a.length;
const first = mean(heap.slice(0, third)), last = mean(heap.slice(-third));
const growth = last / first;
const fpsMedian = fpsS.sort((a, b) => a - b)[Math.floor(fpsS.length / 2)];
console.log(`heap first-third ${(first / 1048576).toFixed(1)}MB → last-third ${(last / 1048576).toFixed(1)}MB (×${growth.toFixed(3)}); median fps ${fpsMedian}`);
if (growth > 1.15) { console.log("SOAK FAIL: heap growth"); process.exit(1); }
if (fpsMedian < 50) { console.log("SOAK FAIL: fps degraded"); process.exit(1); }
console.log("SOAK PASS");
