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
const out = await page.evaluate(() => {
  const src = document.getElementById("field");
  let pixelFrac = null;
  try {
    const c2 = document.createElement("canvas");
    c2.width = 240; c2.height = 150;
    const ctx = c2.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(src, 0, 0, 240, 150);
    const px = ctx.getImageData(0, 0, 240, 150).data;
    let drawn = 0;
    for (let i = 3; i < px.length; i += 4) if (px[i] > 8) drawn++;
    pixelFrac = +(drawn / 36000).toFixed(4);
  } catch {}
  return { ...document.body.dataset, webgpu: !!navigator.gpu, pixelFrac };
});
// field-density heuristic: PNG byte size of the center crop (empty paper ≈ <3 KB)
const png = await page.screenshot({ clip: { x: 520, y: 250, width: 400, height: 400 } });
console.log(JSON.stringify({ out, centerCropPngBytes: png.length, errors: errors.slice(0, 6) }, null, 1));
await browser.close();
