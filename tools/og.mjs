#!/usr/bin/env node
/* §8: assets/og.png — 1200×630 still of the superposition state, name typeset,
   produced from the actual engine (fixed seed). Usage: node tools/og.mjs */
import { chromium } from "@playwright/test";
import { fileURLToPath } from "node:url";
import { join, dirname } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const browser = await chromium.launch({
  headless: true,
  args: ["--enable-unsafe-webgpu", "--enable-features=Vulkan,UseSkiaRenderer", "--use-angle=d3d11"],
});
const page = await (await browser.newContext({
  viewport: { width: 1200, height: 630 },
  deviceScaleFactor: 1,
})).newPage();
await page.goto("http://localhost:8080/?seed=2");
await page.waitForSelector("body[data-settled]", { timeout: 20000 });
// card composition: field + name block only
await page.addStyleTag({ content: "#rail,footer,.hint{display:none!important}" });
await page.screenshot({ path: join(ROOT, "assets/og.png") });
await browser.close();
console.log("assets/og.png written (1200×630, seed 2, settled superposition)");
