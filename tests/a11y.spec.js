/* S4 accessibility floor: semantic content and new shell remain first-class. */
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
const scan=(page)=>new AxeBuilder({page}).analyze();
const critical=(r)=>r.violations.filter(v=>v.impact==="critical");
const serious=(r)=>r.violations.filter(v=>v.impact==="serious");

test.describe("a11y",()=>{
  for(const route of ["/?seed=1&force=static","/?seed=1&force=static#/columns","/?seed=1&force=static#/clusters","/?seed=1&force=static#/record"]){
    test(`axe: zero critical on ${route}`,async({page})=>{await page.goto(route);await expect(page.locator('.view.on').first()).toBeVisible();const r=await scan(page);expect(critical(r).map(v=>v.id)).toEqual([]);if(serious(r).length)console.log('serious:',serious(r).map(v=>v.id).join(','));});
  }
  test("axe: zero critical with dossier and Index",async({page})=>{
    await page.goto("/?seed=1&force=static#/columns");await page.locator('#view-columns .dossier > button').first().click();let r=await scan(page);expect(critical(r).map(v=>v.id)).toEqual([]);
    await page.keyboard.press('Escape');await page.locator('[data-ui="index"]').click();r=await scan(page);expect(critical(r).map(v=>v.id)).toEqual([]);
  });
  test("keyboard reaches skip, brand and utility navigation",async({page},testInfo)=>{
    test.skip(testInfo.project.name==='mobile','hardware-keyboard flow');await page.goto("/?force=static#/columns");
    await page.keyboard.press('Tab');await expect(page.locator('.skip')).toBeFocused();
    await page.keyboard.press('Tab');await expect(page.locator('.brand')).toBeFocused();
    await page.keyboard.press('Tab');await expect(page.locator('[data-ui="index"]')).toBeFocused();
    await page.keyboard.press('Tab');await expect(page.locator('.utilities a[href="#/record"]')).toBeFocused();
    await page.keyboard.press('Tab');await expect(page.locator('[data-ui="contact"]')).toBeFocused();
    await page.keyboard.press('Tab');await expect(page.locator('[data-ui="system"]')).toBeFocused();
  });
  test("domain strip links have visible keyboard focus style",async({page})=>{
    await page.goto("/?force=static");const link=page.locator('.domain-strip a[data-facet="columns"]');await link.focus();
    const state=await link.evaluate(el=>({color:getComputedStyle(el).color,before:getComputedStyle(el,'::before').transform}));
    expect(state.before).not.toBe('matrix(0, 0, 0, 1, 0, 0)');
  });
  test("dossier aria-controls resolves",async({page})=>{await page.goto("/?force=static#/lattice");const btn=page.locator('#view-lattice .dossier > button').first();const controls=await btn.getAttribute('aria-controls');const region=page.locator(`#${controls}`);await expect(region).toHaveAttribute('role','region');await expect(region).toHaveAttribute('aria-labelledby',await btn.getAttribute('id'));});
});
