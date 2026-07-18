#!/usr/bin/env node
/* Ladder-C Lighthouse substitute: FCP/LCP/CLS under Fast-3G-class throttling
   (CDP network 1.6 Mbps down / 150 ms RTT + 4× CPU), fresh cache-less load.
   Usage: node tools/perf-metrics.mjs [url] */
import { chromium } from "@playwright/test";

const url = process.argv[2] || "http://localhost:8080/";
const browser = await chromium.launch({
  headless: true,
  args: ["--enable-unsafe-webgpu", "--enable-features=Vulkan,UseSkiaRenderer", "--use-angle=d3d11"],
});
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
const cdp = await ctx.newCDPSession(page);
await cdp.send("Network.enable");
await cdp.send("Network.emulateNetworkConditions", {
  offline: false,
  latency: 150,
  downloadThroughput: (1.6 * 1024 * 1024) / 8,
  uploadThroughput: (750 * 1024) / 8,
});
await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });

await page.goto(url, { waitUntil: "load" });
await page.waitForTimeout(4000); // let LCP finalize + field boot
const m = await page.evaluate(() => {
  const paint = performance.getEntriesByType("paint");
  const fcp = paint.find((e) => e.name === "first-contentful-paint")?.startTime;
  const lcpEntries = performance.getEntriesByType("largest-contentful-paint");
  const lcp = lcpEntries.length ? lcpEntries[lcpEntries.length - 1].startTime : null;
  let cls = 0;
  for (const e of performance.getEntriesByType("layout-shift")) if (!e.hadRecentInput) cls += e.value;
  const nav = performance.getEntriesByType("navigation")[0];
  return {
    fcpMs: fcp && +fcp.toFixed(0),
    lcpMs: lcp && +lcp.toFixed(0),
    cls: +cls.toFixed(4),
    domContentLoadedMs: +nav.domContentLoadedEventEnd.toFixed(0),
    loadMs: +nav.loadEventEnd.toFixed(0),
    renderer: document.body.dataset.renderer,
    tier: document.body.dataset.tier,
    fieldBootMs: document.body.dataset.fieldBootMs ?? null,
  };
});
console.log(JSON.stringify(m, null, 1));
await browser.close();
