/* S4 content integrity + ADR-004 no-drift. DOM-only assertions. */
import { test, expect } from "@playwright/test";

const FACETS = ["columns","tables","frame","surface","vector","lattice","clusters","orbit"];
const POPULATED = new Set(["columns","tables","frame","surface"]);

test.describe("content integrity", () => {
  test("every schema surface renders without public placeholders", async ({ page }) => {
    await page.goto("/?seed=1&force=static");
    await expect(page.locator("h1")).toContainText("KAIS ABU-HUSSEIN");
    await expect(page.locator("#view-home .positioning")).toHaveText(/\S+/);
    for (const f of FACETS) {
      const v = page.locator(`#view-${f}`);
      await expect(v.locator("h2")).toBeAttached();
      if (POPULATED.has(f)) {
        expect(await v.locator(".manifest li").count()).toBeGreaterThan(1);
        expect(await v.locator(".dossier").count()).toBeGreaterThan(0);
      } else {
        expect(await v.locator(".manifest li").count()).toBe(0);
        expect(await v.locator(".dossier").count()).toBe(0);
      }
    }
    expect(await page.locator("#view-record .record-list li").count()).toBeGreaterThan(0);
    await expect(page.locator("header.site-head .brand-name")).toContainText("KAIS ABU-HUSSEIN");
    await expect(page.locator('header.site-head .utilities a[href="/resume/"]')).toBeVisible();
    expect(await page.locator(".domain-strip a").count()).toBe(8);
    expect(await page.locator(".index-list a").count()).toBe(8);
    expect(await page.locator("body").innerText()).not.toMatch(/\[[^\]\n]{3,}\]/);
  });

  test("role rows keep role, italic company and duration on the primary text line", async ({ page }) => {
    await page.goto("/?seed=1&force=static#view-columns");
    const row = page.locator("#view-columns .dossier > button.role-row").first();
    await expect(row).toContainText("Chief Financial Officer, Goodman Group McDonald's, 3 yrs");
    await expect(row.locator("em")).toHaveText("Goodman Group McDonald's");
    await expect(row.locator(".dossier-duration")).toHaveText("3 yrs");
    await expect(row.locator("small")).toHaveCount(0);
  });

  test("minimal chrome removes redundant snippet surfaces", async ({ page }) => {
    await page.goto("/?seed=1&force=static");
    await expect(page.locator(".brand-system")).toHaveCount(0);
    await expect(page.locator(".home-kicker")).toHaveCount(0);
    await expect(page.locator(".home-statement")).toHaveCount(0);
    await expect(page.locator(".home-hint")).toHaveCount(0);
    await expect(page.locator("footer.site-foot")).toBeHidden();
    await expect(page.locator("footer.site-foot")).toHaveText("");
  });

  test("no-JS: semantic content remains available in original HTML", async ({ browser }) => {
    const ctx = await browser.newContext({ javaScriptEnabled: false });
    const page = await ctx.newPage();
    await page.goto("/");
    await expect(page.locator("h1")).toContainText("KAIS ABU-HUSSEIN");
    for (const f of FACETS) await expect(page.locator(`#view-${f} h2`)).toBeVisible();
    await expect(page.locator("#view-record .record-list li").first()).toBeVisible();
    await expect(page.locator("body")).toHaveAttribute("data-tier", "0");
    await expect(page.locator("body")).toHaveAttribute("data-renderer", "static");
    await expect(page.locator("#field")).toBeHidden();
    await ctx.close();
  });

  test("baked HTML ≡ runtime render (ADR-004 drift gate)", async ({ browser }) => {
    const read = (p, f) => p.locator(`#view-${f}`).evaluate((el) => el.textContent.replace(/\s+/g, " ").trim());
    const noJs = await browser.newContext({ javaScriptEnabled: false });
    const p1 = await noJs.newPage();
    await p1.goto("/");
    const baked = {};
    for (const f of FACETS) baked[f] = await read(p1, f);
    await noJs.close();
    const withJs = await browser.newContext();
    const p2 = await withJs.newPage();
    await p2.goto("/?force=static");
    await expect(p2.locator("#view-home")).toHaveClass(/on/);
    for (const f of FACETS) expect(await read(p2, f)).toBe(baked[f]);
    await withJs.close();
  });

  test("404 page: static field + no such state + home link", async ({ page }) => {
    await page.goto("/404.html");
    await expect(page.locator("h1")).toContainText("No such state");
    await expect(page.locator("a[href='./']")).toBeVisible();
  });
});
