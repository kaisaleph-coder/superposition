/* S4 print: canonical record, graphics/UI removed. */
import { test, expect } from "@playwright/test";

test.describe("print", () => {
  test("print collapses to record only", async ({ page }) => {
    await page.goto("/?force=static");
    await page.emulateMedia({ media: "print" });
    await expect(page.locator("#field")).toBeHidden();
    await expect(page.locator(".domain-strip")).toBeHidden();
    await expect(page.locator(".site-head")).toBeHidden();
    await expect(page.locator("#view-record .record-list li").first()).toBeVisible();
    await expect(page.locator("#view-columns")).toBeHidden();
  });
});
