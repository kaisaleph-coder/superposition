import { test, expect } from '@playwright/test';
const pages=['columns','tables','frame','surface','vector','lattice','clusters','orbit'];
const appearance=page=>page.locator('body').evaluate(b=>({page:b.dataset.appearancePage,pattern:b.dataset.appearancePattern,scheme:b.dataset.appearanceScheme,density:b.dataset.appearanceDensity,framing:b.dataset.appearanceFraming}));
test('Index isolates its covered background, traps focus and restores access on close',async({page})=>{
 await page.goto('/?force=static#view-columns');const trigger=page.getByRole('button',{name:'Index',exact:true});await trigger.click();await expect(page.getByRole('dialog',{name:'Index',exact:true})).toBeVisible();await expect(page.locator('main')).toHaveAttribute('inert','');await expect(page.locator('main')).toHaveAttribute('aria-hidden','true');
 const close=page.locator('[data-ui-close="index"]');await expect(close).toBeFocused();await page.keyboard.press('Shift+Tab');await expect(page.locator('.index-list a').last()).toBeFocused();await page.keyboard.press('Tab');await expect(close).toBeFocused();await page.keyboard.press('ArrowRight');await expect(page.locator('body')).toHaveAttribute('data-appearance-page','columns');
 await page.locator('body').evaluate(body=>{const late=document.createElement('div');late.id='sand-dial';late.tabIndex=0;body.append(late);});await expect(page.locator('#sand-dial')).toHaveAttribute('inert','');
 await page.keyboard.press('Escape');await expect(trigger).toBeFocused();await expect(page.locator('main')).not.toHaveAttribute('inert','');await expect(page.locator('main')).not.toHaveAttribute('aria-hidden','true');await expect(page.locator('#sand-dial')).not.toHaveAttribute('inert','');
});
test('bottom navigation hover and focus preserve the page until explicit activation',async({page})=>{
 await page.goto('/?force=static');const before=await appearance(page);
 for(const id of pages){const a=page.locator('.domain-strip [data-facet="'+id+'"]');await a.hover();await a.focus();expect(await appearance(page)).toEqual(before);expect(new URL(page.url()).hash).toBe('');await expect(page.locator('.view.on')).toHaveAttribute('id','view-home');}
 await page.keyboard.press('Enter');await expect(page.locator('body')).toHaveAttribute('data-appearance-page','orbit');await expect(page.locator('.view.on')).toHaveAttribute('id','view-orbit');
});

test('fixed home and distinct domain recipes survive reload and back navigation',async({page})=>{
 await page.goto('/?force=static');await expect(page.locator('body')).toHaveAttribute('data-appearance-pattern','sunflower');await expect(page.locator('body')).toHaveAttribute('data-appearance-scheme','signal');
 const modes=[];for(const id of pages){await page.goto('/?force=static#view-'+id);await expect(page.locator('body')).toHaveAttribute('data-appearance-page',id);modes.push((await appearance(page)).pattern);}
 expect(new Set(modes).size).toBe(8);expect(modes).not.toContain('sunflower');
 const previous=await appearance(page);await page.reload();await expect.poll(()=>appearance(page)).toEqual(previous);
 await page.goto('/?force=static');await expect(page.locator('body')).toHaveAttribute('data-appearance-framing','0,0,0');await expect(page.locator('body')).toHaveAttribute('data-appearance-density','1');
});
test('explicit test seeds are deterministic without session storage writes',async({page})=>{
 await page.goto('/?force=static&seed=123#view-columns');await expect(page.locator('body')).toHaveAttribute('data-appearance-page','columns');const before=await appearance(page);await page.reload();await expect.poll(()=>appearance(page)).toEqual(before);
 const response=await page.request.get('/js/field/appearance.js');expect(response.ok()).toBeTruthy();expect(await response.text()).not.toContain('localStorage');
});
test('phone composition has bounded detail and no horizontal overflow',async({page})=>{
 await page.setViewportSize({width:390,height:844});for(const id of pages){await page.goto('/?force=static&seed=456#view-'+id);await expect(page.locator('body')).toHaveAttribute('data-appearance-page',id);const r=await appearance(page);expect(+r.density).toBeGreaterThanOrEqual(.85);expect(+r.density).toBeLessThanOrEqual(1.15);expect(await page.locator('html').evaluate(e=>e.scrollWidth>innerWidth)).toBeFalsy();}
});
test('static selected appearance and ordinary content survive blocked storage',async({page})=>{
 await page.addInitScript(()=>{Storage.prototype.getItem=()=>{throw new DOMException('blocked','SecurityError');};Storage.prototype.setItem=()=>{throw new DOMException('blocked','SecurityError');};});await page.goto('/?force=static');await expect(page.locator('body')).toHaveAttribute('data-appearance-pattern','sunflower');await expect(page.locator('#appearance-static')).toBeVisible();await expect(page.locator('#view-home h1')).toBeVisible();
});
test('curated runtime has no review controls and fallback assets are real SVG',async({page})=>{
 await page.goto('/?force=static');await expect(page.locator('#sand-lab')).toHaveCount(0);const response=await page.request.get('/assets/patterns/sunflower.svg');expect(response.status()).toBe(200);expect(await response.text()).toContain('<path');await expect(page.locator('#view-home h1')).toBeVisible();
});
