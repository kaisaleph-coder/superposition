/* Sprint 1 SEO hard-gate contract: source HTML, canonical URLs, discovery files and staging safeguards. */
import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
const ROOT=join(dirname(fileURLToPath(import.meta.url)),"..");

test.describe("SEO P0",()=>{
  test("homepage is meaningful in source HTML and self-canonical",async({page})=>{
    const response=await page.request.get("/");
    expect(response.status()).toBe(200);
    const source=await response.text();
    expect(source).toContain("KAIS ABU-HUSSEIN");
    expect(source).toContain("Financial executive");
    expect(source).toContain("Goodman Group McDonald&#39;s");
    await page.goto("/?force=static");
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href","https://kaisabuhussein.com/");
    expect(await page.locator("body").innerText()).not.toMatch(/\[[^\]\n]{3,}\]/);
  });

  test("standalone resume is static, meaningful and self-canonical",async({page})=>{
    const response=await page.goto("/resume/");
    expect(response.status()).toBe(200);
    await expect(page.locator("h1")).toHaveText("Kais Abu-Hussein");
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href","https://kaisabuhussein.com/resume/");
    expect(await page.locator(".roles li").count()).toBeGreaterThan(5);
  });

  test("homepage navigation uses same-document fragments and a real resume URL",async({page})=>{
    await page.goto("/?force=static");
    const hrefs=await page.locator(".domain-strip a").evaluateAll(xs=>xs.map(x=>x.getAttribute("href")));
    expect(hrefs.every(x=>x.startsWith("#view-"))).toBeTruthy();
    await expect(page.locator('.utilities a[href="/resume/"]')).toBeVisible();
    await expect(page.locator('a[href="#/record"]')).toHaveCount(0);
  });

  test("robots and sitemap expose only canonical indexable URLs",async({page})=>{
    const rr=await page.request.get("/robots.txt");
    expect(rr.status()).toBe(200);
    const rt=await rr.text();
    expect(rt).toContain("Allow: /");
    expect(rt).toContain("https://kaisabuhussein.com/sitemap.xml");

    const sr=await page.request.get("/sitemap.xml");
    expect(sr.status()).toBe(200);
    const st=await sr.text();
    expect(st).toContain("<loc>https://kaisabuhussein.com/</loc>");
    expect(st).toContain("<loc>https://kaisabuhussein.com/resume/</loc>");
    expect(st).not.toContain("workers.dev");
  });

  test("Cloudflare config enforces 404 behavior, URL normalization and preview noindex",async()=>{
    const cfg=JSON.parse(readFileSync(join(ROOT,"wrangler.jsonc"),"utf8"));
    expect(cfg.assets.not_found_handling).toBe("404-page");
    expect(cfg.assets.html_handling).toBe("auto-trailing-slash");
    const headers=readFileSync(join(ROOT,"_headers"),"utf8");
    expect(headers).toContain("workers.dev/*");
    expect(headers).toContain("X-Robots-Tag: noindex");
  });
});
