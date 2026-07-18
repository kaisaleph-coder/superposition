import { chromium } from "@playwright/test";
const url = process.argv[2] || "http://localhost:8080/?seed=1";
const out = process.argv[3] || "shot.png";
const browser = await chromium.launch({
  headless: true,
  args: ["--enable-unsafe-webgpu", "--enable-features=Vulkan,UseSkiaRenderer", "--use-angle=d3d11"],
});
const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
await page.goto(url);
await page.waitForSelector("body[data-settled]", { timeout: 20000 });
console.log(JSON.stringify(await page.evaluate(() => ({ ...document.body.dataset }))));
await page.screenshot({ path: out });
await browser.close();
