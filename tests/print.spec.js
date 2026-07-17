/* §8 print — the canonical one-pager. Snapshot via print media emulation. */
import { test, expect } from "@playwright/test";

test.describe("print", () => {
  test("print media collapses to typeset record: no field/rail, dossiers open", async ({ page }) => {
    await page.goto("/?seed=1");
    await page.emulateMedia({ media: "print" });
    await expect(page.locator("#rail")).toBeHidden();
    await expect(page.locator("#field")).toBeHidden();
    await expect(page.locator("h1")).toBeVisible();
    await expect(page.locator("#view-record .record li").first()).toBeVisible();
    // dossier bodies visible without interaction
    await expect(page.locator("#view-columns .dossier .body-in").first()).toBeVisible();
  });

  test("print snapshot (visual receipt)", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "print is a desktop artifact");
    await page.goto("/?seed=1");
    await page.emulateMedia({ media: "print" });
    await expect(page).toHaveScreenshot("print-one-pager.png", { fullPage: true });
  });
});
