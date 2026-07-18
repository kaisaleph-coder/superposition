/* §7 accessibility floor + §10.6 — axe zero-critical, keyboard operability, focus. */
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const scan = (page) => new AxeBuilder({ page }).analyze();
const critical = (r) => r.violations.filter((v) => v.impact === "critical");
const serious = (r) => r.violations.filter((v) => v.impact === "serious");

test.describe("a11y", () => {
  for (const route of ["/?seed=1", "/?seed=1#/columns", "/?seed=1#/clusters", "/?seed=1#/record"]) {
    test(`axe: zero critical on ${route}`, async ({ page }) => {
      await page.goto(route);
      await expect(page.locator(".view.on").first()).toBeVisible();
      const r = await scan(page);
      expect(critical(r).map((v) => v.id)).toEqual([]);
      // serious logged for the receipt, not gating (floor is zero-critical)
      if (serious(r).length) console.log(`serious on ${route}:`, serious(r).map((v) => v.id).join(", "));
    });
  }

  test("axe: zero critical with dossier open", async ({ page }) => {
    await page.goto("/?seed=1#/columns");
    await page.locator("#view-columns .dossier > button").first().click();
    const r = await scan(page);
    expect(critical(r).map((v) => v.id)).toEqual([]);
  });

  test("tab order: skip link first, header then rail marks in order", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === "mobile", "hardware-keyboard flow");
    // a domain page: the brand is visible there (hidden on home under the monumental h1)
    await page.goto("/?seed=1#/columns");
    await page.keyboard.press("Tab");
    await expect(page.locator(".skip")).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(page.locator("header.site .brand")).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(page.locator("header.site .resume-btn")).toBeFocused();
    // then through the home view's focusables to the rail
    const seq = [];
    for (let i = 0; i < 14 && seq.length < 8; i++) {
      await page.keyboard.press("Tab");
      const f = await page.evaluate(() => document.activeElement?.dataset?.facet || null);
      if (f) seq.push(f);
    }
    expect(seq).toEqual(["columns", "frame", "tables", "lattice", "surface", "clusters", "vector", "orbit"]);
  });

  test("focus-visible ring on rail (§7) — visual receipt", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "one receipt is enough");
    await page.goto("/?seed=1");
    await page.waitForSelector("body[data-settled]", { timeout: 20000 });
    await page.locator('#rail a[data-facet="columns"]').focus();
    await expect(page.locator("#rail")).toHaveScreenshot("rail-focus-ring.png");
  });

  test("dossier region wiring: aria-controls resolves, region labelled", async ({ page }) => {
    await page.goto("/?seed=1#/lattice");
    const btn = page.locator("#view-lattice .dossier > button").first();
    const controls = await btn.getAttribute("aria-controls");
    const region = page.locator(`#${controls}`);
    await expect(region).toHaveAttribute("role", "region");
    await expect(region).toHaveAttribute("aria-labelledby", await btn.getAttribute("id"));
  });
});
