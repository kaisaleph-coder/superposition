import { chromium } from "@playwright/test";
const browser=await chromium.launch({headless:true,args:["--enable-unsafe-webgpu","--enable-features=Vulkan,UseSkiaRenderer","--use-angle=d3d11"]});
const page=await browser.newPage({viewport:{width:1440,height:900}});
const errors=[];const logs=[];
page.on("pageerror",e=>errors.push(String(e)));
page.on("console",m=>{if(["error","warning"].includes(m.type()))logs.push(m.type()+": "+m.text())});
await page.goto("http://localhost:8080/?force=static&seed=1",{waitUntil:"load"});
await page.waitForTimeout(1200);
const state=await page.evaluate(()=>({
  htmlClass:document.documentElement.className,
  body:{...document.body.dataset},
  on:[...document.querySelectorAll(".view.on")].map(x=>x.id),
  mainText:(document.querySelector("main")?.innerText||"").slice(0,400),
  mainTextLen:(document.querySelector("main")?.innerText||"").length,
  indexVisible:!!document.querySelector('[data-ui="index"]')?.offsetParent,
  scripts:[...document.scripts].map(s=>({type:s.type,src:s.src,text:s.src?"":s.textContent.slice(0,100)}))
}));
console.log(JSON.stringify({state,errors,logs},null,2));
await browser.close();
if(errors.length||state.on.length!==1||state.mainTextLen<20)process.exit(1);
