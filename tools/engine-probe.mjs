/* Engine smoke probe — headless chromium, WebGPU flags, DOM-contract readout. */
import { chromium } from "@playwright/test";

const url = process.argv[2] || "http://localhost:8080/?seed=1";
const headless = process.argv[3] !== "headed";
const browser = await chromium.launch({
  headless,
  args: [
    "--enable-unsafe-webgpu",
    "--enable-features=Vulkan,UseSkiaRenderer",
    "--use-angle=d3d11",
  ],
});
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
await page.goto(url);
try {
  await page.waitForSelector("body[data-settled]", { timeout: 20000 });
} catch {}
const out = await page.evaluate(() => ({
  ...document.body.dataset,
  webgpu: !!navigator.gpu,
}));
console.log(JSON.stringify({ out, errors: errors.slice(0, 6) }, null, 1));
await browser.close();
