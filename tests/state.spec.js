/* §10.2 state machine — DOM contract (§5.6) only. */
import { test, expect } from "@playwright/test";

const FACETS = ["columns", "frame", "tables", "lattice", "surface", "clusters", "vector", "orbit"];
const body = (page) => page.locator("body");

test.describe("state machine", () => {
  test("keys 1–8 drive data-state/data-facet; Esc returns; r opens record", async ({ page }) => {
    await page.goto("/?seed=1");
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

  test("arrow keys cycle facets in order, wrapping", async ({ page }) => {
    await page.goto("/?seed=1");
    await page.keyboard.press("ArrowRight");
    await expect(body(page)).toHaveAttribute("data-facet", "columns");
    await page.keyboard.press("ArrowLeft");
    await expect(body(page)).toHaveAttribute("data-facet", "orbit");
    await page.keyboard.press("ArrowRight");
    await expect(body(page)).toHaveAttribute("data-facet", "columns");
  });

  test("deep link restores state; back/forward work (§2.5)", async ({ page }) => {
    await page.goto("/#/lattice");
    await expect(body(page)).toHaveAttribute("data-state", "facet");
    await expect(body(page)).toHaveAttribute("data-facet", "lattice");
    await page.goto("/#/record");
    await expect(body(page)).toHaveAttribute("data-state", "record");
    await page.goBack();
    await expect(body(page)).toHaveAttribute("data-facet", "lattice");
    await page.goForward();
    await expect(body(page)).toHaveAttribute("data-state", "record");
  });

  test("dossier open → data-state=dossier, aria-expanded; close restores", async ({ page }) => {
    await page.goto("/#/columns");
    const btn = page.locator("#view-columns .dossier > button").first();
    await btn.click();
    await expect(body(page)).toHaveAttribute("data-state", "dossier");
    await expect(btn).toHaveAttribute("aria-expanded", "true");
    await btn.click();
    await expect(body(page)).toHaveAttribute("data-state", "facet");
    await expect(btn).toHaveAttribute("aria-expanded", "false");
  });

  test("rail marks navigate and mark aria-current", async ({ page }) => {
    await page.goto("/?seed=1");
    await page.locator('#rail a[data-facet="vector"]').click();
    await expect(body(page)).toHaveAttribute("data-facet", "vector");
    await expect(page.locator('#rail a[data-facet="vector"]')).toHaveAttribute("aria-current", "page");
    await page.locator("#view-vector .back").click();
    await expect(body(page)).toHaveAttribute("data-state", "superposition");
  });

  test("unknown hash falls back to home", async ({ page }) => {
    await page.goto("/#/nonsense");
    await expect(body(page)).toHaveAttribute("data-state", "superposition");
  });
});
