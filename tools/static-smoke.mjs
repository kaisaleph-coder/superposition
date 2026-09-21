import { chromium } from "@playwright/test";
const browser=await chromium.launch({headless:true,args:["--enable-unsafe-webgpu","--enable-features=Vulkan,UseSkiaRenderer","--use-angle=d3d11"]});
const page=await browser.newPage({viewport:{width:1440,height:900}});
const errors=[];const logs=[];
page.on("pageerror",e=>errors.push(String(e)));
page.on("console",m=>{if(["error","warning"].includes(m.type()))logs.push(m.type()+": "+m.text())});
await page.goto("http://localhost:8080/?force=static&seed=1",{waitUntil:"load"});
await page.waitForTimeout(500);
const state=await page.evaluate(()=>({
  htmlClass:document.documentElement.className,
  body:{...document.body.dataset},
  on:[...document.querySelectorAll(".view.on")].map(x=>x.id),
  mainTextLen:(document.querySelector("main")?.innerText||"").length,
}));
const probes={};
for(const [name,sel] of Object.entries({
  index:'[data-ui="index"]',system:'[data-ui="system"]',vector:'.domain-strip a[data-facet="vector"]'
})){
 const loc=page.locator(sel);
 const box=await loc.boundingBox();
 probes[name]=await loc.evaluate(el=>{
   const r=el.getBoundingClientRect(),hit=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);
   return {pointer:getComputedStyle(el).pointerEvents,display:getComputedStyle(el).display,hit:hit?hit.tagName+"."+hit.className:"none"};
 });
}
await page.locator('[data-ui="index"]').click({timeout:3000});
await page.locator('[data-ui-close="index"]').click({timeout:3000});
await page.locator('.domain-strip a[data-facet="columns"]').click({timeout:3000});
await page.waitForTimeout(250);
await page.locator('#view-columns .dossier > button').first().click({timeout:3000});
await page.locator('[data-ui="system"]').click({timeout:3000});
const final=await page.evaluate(()=>({body:{...document.body.dataset},index:document.querySelector('#indexOverlay')?.getAttribute('aria-hidden'),system:document.querySelector('#systemPanel')?.getAttribute('aria-hidden')}));
console.log(JSON.stringify({state,probes,final,errors,logs},null,2));
await browser.close();
if(errors.length||state.on.length!==1||state.mainTextLen<20)process.exit(1);
