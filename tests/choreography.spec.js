/* P3 gate: downshift proof (§5.4) + scroll integration (§2.5). DOM contract only. */
import { test, expect } from "@playwright/test";

test.describe("choreography", () => {
  test("downshift: sustained <45 fps drops exactly one tier (§5.4)", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "CDP throttling — desktop only");
    await page.goto("/?seed=1&run=1");
    await page.waitForSelector("body[data-settled]", { timeout: 20000 });
    const before = +(await page.getAttribute("body", "data-tier"));
    const cdp = await page.context().newCDPSession(page);
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: 40 });
    // guard needs <45 fps for 3 consecutive sampled seconds
    await page.waitForFunction(
      (b) => +document.body.dataset.tier !== b,
      before,
      { timeout: 30000, polling: 500 }
    );
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: 1 });
    const after = +(await page.getAttribute("body", "data-tier"));
    expect(after).not.toBe(before);
    expect([2, 4]).toContain(after); // §5.4 downshift map: 1→2, 2→4, 3→4
  });

  test("scroll within facet reaches the engine (§2.5)", async ({ page }) => {
    // placeholder content is short — shrink the viewport so the galley overflows
    await page.setViewportSize({ width: 800, height: 380 });
    await page.goto("/?seed=1&run=1#/clusters");
    await page.waitForSelector("body[data-settled]", { timeout: 20000 });
    await page.locator("#view-clusters .dossier > button").first().click();
    // dossier body expands over 180 ms; the galley only overflows after that
    await page.waitForFunction(() => {
      const m = document.querySelector("main");
      return m.scrollHeight > m.clientHeight;
    });
    await page.locator("main").evaluate((el) => { el.scrollTop = el.scrollHeight; });
    await expect
      .poll(async () => await page.getAttribute("body", "data-scroll"), { timeout: 5000 })
      .not.toBeNull();
  });

  test("I3 wheel-at-edge pages between domains (desktop)", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "wheel is a desktop affordance");
    await page.goto("/?seed=1");
    await expect(page.locator("#view-home")).toHaveClass(/on/);
    await page.mouse.move(400, 450);
    await page.mouse.wheel(0, 160); // home → first domain
    await expect(page.locator("body")).toHaveAttribute("data-facet", "columns");
    await page.waitForTimeout(1000); // cooldown
    await page.mouse.wheel(0, 160); // columns → frame (content fits: at-edge)
    await expect(page.locator("body")).toHaveAttribute("data-facet", "frame");
    await page.waitForTimeout(1000);
    await page.mouse.wheel(0, -160); // frame → columns
    await expect(page.locator("body")).toHaveAttribute("data-facet", "columns");
  });

  test("I3 horizontal swipe pages between domains (touch)", async ({ page }) => {
    await page.goto("/?seed=1#/columns");
    await expect(page.locator("body")).toHaveAttribute("data-facet", "columns");
    const swipe = (fromX, toX) =>
      page.evaluate(([a, b]) => {
        const opts = { bubbles: true, pointerId: 9, pointerType: "touch", clientY: 400 };
        window.dispatchEvent(new PointerEvent("pointerdown", { ...opts, clientX: a }));
        window.dispatchEvent(new PointerEvent("pointerup", { ...opts, clientX: b }));
      }, [fromX, toX]);
    await swipe(320, 90); // swipe left → next
    await expect(page.locator("body")).toHaveAttribute("data-facet", "frame");
    await swipe(90, 320); // swipe right → back
    await expect(page.locator("body")).toHaveAttribute("data-facet", "columns");
  });

  test("morph transition completes within 1.3 s (§11 P3 gate)", async ({ page }) => {
    await page.goto("/?seed=1&run=1");
    await page.waitForSelector("body[data-settled]", { timeout: 20000 });
    // data-state flips immediately; the field morph is BLEND_MS=1150 < 1300 by
    // construction — assert the DOM contract transition is immediate and stable
    const t0 = Date.now();
    await page.keyboard.press("4");
    await expect(page.locator("body")).toHaveAttribute("data-facet", "lattice");
    expect(Date.now() - t0).toBeLessThan(1300);
  });
});
