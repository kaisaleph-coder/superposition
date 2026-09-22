/* SUPERPOSITION 2.0 production-integration contract. */
import { test, expect } from "@playwright/test";

const ORDER=["columns","tables","frame","surface","vector","lattice","clusters","orbit"];

test.describe("S4 integration",()=>{
  test("T0 explicit fallback is a supported deterministic renderer tier",async({page})=>{
    await page.goto("/?force=static&seed=271828");
    await expect(page.locator("body")).toHaveAttribute("data-tier","0");
    await expect(page.locator("body")).toHaveAttribute("data-renderer","static");
    await expect(page.locator("#field")).toBeHidden();
  });

  test("owner-facing navigation order is consistent in strip and index",async({page})=>{
    await page.goto("/?force=static");
    const strip=await page.locator(".domain-strip a").evaluateAll(xs=>xs.map(x=>x.dataset.facet));
    const index=await page.locator(".index-list a").evaluateAll(xs=>xs.map(x=>x.dataset.facet));
    expect(strip).toEqual(ORDER);expect(index).toEqual(ORDER);
  });

  test("all S2/S3 observability attributes have declared slots",async({page})=>{
    await page.goto("/?force=static");
    const body=page.locator("body");
    await expect(body).toHaveAttribute("data-state","superposition");
    await expect(body).toHaveAttribute("data-view","home");
    await expect(body).toHaveAttribute("data-renderer","static");
    await expect(body).toHaveAttribute("data-tier","0");
  });

  test("CSP-ready bootstrap has no executable inline script or import map",async({page})=>{
    const response=await page.request.get("/");
    const source=await response.text();
    expect(source).toContain('<script src="/js/head.js"></script>');
    expect(source).not.toContain('type="importmap"');
    expect(source).not.toContain('document.documentElement.classList.add("js")');
    const executableInline=[...source.matchAll(/<script(?![^>]*\bsrc=)([^>]*)>([\s\S]*?)<\/script>/gi)]
      .filter(m=>!m[1].includes('application/ld+json'));
    expect(executableInline).toEqual([]);
  });

  test("no third-party runtime URL is present in markup",async({page})=>{
    await page.goto("/?force=static");
    const urls=await page.evaluate(()=>[...document.querySelectorAll('script[src],link[href]:not([rel="canonical"]),img[src]')].map(x=>x.src||x.href).filter(Boolean));
    const origin=new URL(page.url()).origin;
    expect(urls.every(u=>new URL(u).origin===origin)).toBeTruthy();
  });
});
