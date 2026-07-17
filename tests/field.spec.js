/* §10.3 fallbacks + §10.5 perf smoke — DOM contract only (data-renderer/tier/fps). */
import { test, expect } from "@playwright/test";

test.describe("field fallbacks & perf", () => {
  test("engine boots: renderer webgpu|webgl, settles deterministically (?seed)", async ({ page }) => {
    await page.goto("/?seed=1");
    await page.waitForSelector("body[data-settled]", { timeout: 20000 });
    const renderer = await page.getAttribute("body", "data-renderer");
    expect(["webgpu", "webgl"]).toContain(renderer);
    const boot = +(await page.getAttribute("body", "data-field-boot-ms"));
    expect(boot).toBeGreaterThan(0);
    expect(boot).toBeLessThan(2500); // §6 field boot < 2.5 s desktop
  });

  test("?force=webgl → data-renderer webgl (§10.3)", async ({ page }) => {
    await page.goto("/?seed=1&force=webgl");
    await page.waitForSelector("body[data-settled]", { timeout: 20000 });
    await expect(page.locator("body")).toHaveAttribute("data-renderer", "webgl");
    const tier = +(await page.getAttribute("body", "data-tier"));
    expect([3, 4]).toContain(tier);
  });

  test("prefers-reduced-motion → T0 static, no engine", async ({ browser }) => {
    const ctx = await browser.newContext({ reducedMotion: "reduce" });
    const page = await ctx.newPage();
    await page.goto("/?seed=1");
    await page.waitForTimeout(1500);
    await expect(page.locator("body")).toHaveAttribute("data-tier", "0");
    await expect(page.locator("body")).toHaveAttribute("data-renderer", "static");
    await ctx.close();
  });

  test("perf smoke: rAF fps ≥ 55 desktop / ≥ 30 mobile over sampled seconds (§10.5)", async ({ page }, testInfo) => {
    await page.goto("/?seed=1&run=1");
    await page.waitForSelector("body[data-settled]", { timeout: 20000 });
    const floor = testInfo.project.name === "mobile" ? 30 : 55;
    const samples = [];
    for (let i = 0; i < 5; i++) {
      await page.waitForTimeout(1000);
      const fps = +(await page.getAttribute("body", "data-fps"));
      if (fps) samples.push(fps);
    }
    expect(samples.length).toBeGreaterThan(2);
    const median = samples.sort((a, b) => a - b)[Math.floor(samples.length / 2)];
    expect(median).toBeGreaterThanOrEqual(floor);
  });

  test("pause courtesy: '.' toggles data-paused", async ({ page }) => {
    await page.goto("/?seed=1&run=1");
    await page.waitForSelector("body[data-settled]", { timeout: 20000 });
    await page.keyboard.press(".");
    await expect(page.locator("body[data-paused]")).toBeVisible();
    await page.keyboard.press(".");
    await expect(page.locator("body:not([data-paused])")).toBeVisible();
  });
});
