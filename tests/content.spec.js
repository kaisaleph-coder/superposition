/* S4 content integrity + ADR-004 no-drift. DOM-only assertions. */
import { test, expect } from "@playwright/test";

const FACETS = ["columns","tables","frame","surface","vector","lattice","clusters","orbit"];

test.describe("content integrity", () => {
  test("every schema surface renders (JS on)", async ({ page }) => {
    await page.goto("/?seed=1&force=static");
    await expect(page.locator("h1")).toContainText("[NAME]");
    await expect(page.locator("#view-home .positioning")).toContainText("[One-line positioning");
    for (const f of FACETS) {
      const v = page.locator(`#view-${f}`);
      expect(await v.locator(".manifest li").count()).toBeGreaterThan(1);
      expect(await v.locator(".dossier").count()).toBeGreaterThan(0);
    }
    expect(await page.locator("#view-record .record-list li").count()).toBeGreaterThan(0);
    await expect(page.locator("header.site-head .brand-name")).toContainText("[NAME]");
    await expect(page.locator('header.site-head .utilities a[href="#/record"]')).toBeVisible();
    expect(await page.locator(".domain-strip a").count()).toBe(8);
    expect(await page.locator(".index-list a").count()).toBe(8);
  });

  test("placeholder policy remains explicit until P6 real-content swap", async ({ page }) => {
    await page.goto("/?seed=1&force=static");
    const text = await page.locator("main").innerText();
    expect(text).toContain("[");
  });

  test("no-JS: full content, all views stacked, static ground", async ({ browser }) => {
    const ctx = await browser.newContext({ javaScriptEnabled: false });
    const page = await ctx.newPage();
    await page.goto("/");
    await expect(page.locator("h1")).toContainText("[NAME]");
    for (const f of FACETS) await expect(page.locator(`#view-${f} .manifest li`).first()).toBeVisible();
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
