/* S4 state machine — DOM contract only. */
import { test, expect } from "@playwright/test";

const FACETS = ["columns","tables","frame","surface","vector","lattice","clusters","orbit"];
const body = (page) => page.locator("body");

test.describe("state machine", () => {
  test("keys 1–8 drive owner-facing domain order; Esc returns; r opens record", async ({ page }) => {
    await page.goto("/?seed=1&force=static");
    for (let i = 0; i < 8; i++) {
      await page.keyboard.press(String(i + 1));
      await expect(body(page)).toHaveAttribute("data-state", "facet");
      await expect(body(page)).toHaveAttribute("data-facet", FACETS[i]);
      await expect(page.locator(`#view-${FACETS[i]}`)).toBeVisible();
    }
    await page.keyboard.press("Escape");
    await expect(body(page)).toHaveAttribute("data-state", "superposition");
    await page.keyboard.press("r");
    await expect(body(page)).toHaveAttribute("data-state", "record");
    await page.keyboard.press("Escape");
    await expect(body(page)).toHaveAttribute("data-state", "superposition");
  });

  test("arrow keys cycle owner-facing order, wrapping", async ({ page }) => {
    await page.goto("/?seed=1&force=static");
    await page.keyboard.press("ArrowRight");
    await expect(body(page)).toHaveAttribute("data-facet", "columns");
    await page.keyboard.press("ArrowLeft");
    await expect(body(page)).toHaveAttribute("data-facet", "orbit");
    await page.keyboard.press("ArrowRight");
    await expect(body(page)).toHaveAttribute("data-facet", "columns");
  });

  test("deep link restores state; back/forward work", async ({ page }) => {
    await page.goto("/?force=static#/lattice");
    await expect(body(page)).toHaveAttribute("data-facet", "lattice");
    await page.goto("/?force=static#/record");
    await expect(body(page)).toHaveAttribute("data-state", "record");
    await page.goBack();
    await expect(body(page)).toHaveAttribute("data-facet", "lattice");
    await page.goForward();
    await expect(body(page)).toHaveAttribute("data-state", "record");
  });

  test("dossier open mirrors data-state and aria-expanded", async ({ page }) => {
    await page.goto("/?force=static#/columns");
    const btn = page.locator("#view-columns .dossier > button").first();
    await btn.click();
    await expect(body(page)).toHaveAttribute("data-state", "dossier");
    await expect(btn).toHaveAttribute("aria-expanded", "true");
    await btn.click();
    await expect(body(page)).toHaveAttribute("data-state", "facet");
  });

  test("domain strip navigates and marks aria-current", async ({ page }) => {
    await page.goto("/?seed=1&force=static");
    await page.locator('.domain-strip a[data-facet="vector"]').click();
    await expect(body(page)).toHaveAttribute("data-facet", "vector");
    await expect(page.locator('.domain-strip a[data-facet="vector"]')).toHaveAttribute("aria-current", "page");
  });

  test("Index opens, previews remain non-committing on static tier, selection commits", async ({ page }) => {
    await page.goto("/?seed=1&force=static");
    await page.locator('[data-ui="index"]').click();
    await expect(page.locator("#indexOverlay")).toHaveAttribute("aria-hidden", "false");
    await expect(body(page)).toHaveAttribute("data-index", "open");
    await page.locator('.index-list a[data-facet="tables"]').click();
    await expect(body(page)).toHaveAttribute("data-facet", "tables");
    await expect(page.locator("#indexOverlay")).toHaveAttribute("aria-hidden", "true");
  });

  test("System panel exposes renderer contract even on T0", async ({ page }) => {
    await page.goto("/?seed=1&force=static");
    await page.locator('[data-ui="system"]').click();
    await expect(page.locator("#systemPanel")).toHaveAttribute("aria-hidden", "false");
    await expect(page.locator("#sysRenderer")).toContainText("static");
  });

  test("unknown hash falls back to home", async ({ page }) => {
    await page.goto("/?force=static#/nonsense");
    await expect(body(page)).toHaveAttribute("data-state", "superposition");
  });
});
