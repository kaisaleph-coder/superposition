import { chromium } from "@playwright/test";
const browser=await chromium.launch({headless:true,args:["--enable-unsafe-webgpu","--enable-features=Vulkan,UseSkiaRenderer","--use-angle=d3d11"]});
const errors=[];const logs=[];
const page=await browser.newPage({viewport:{width:1440,height:900}});
page.on("pageerror",e=>errors.push(String(e)));
page.on("console",m=>{if(["error","warning"].includes(m.type()))logs.push(m.type()+": "+m.text())});
await page.goto("http://localhost:8080/?force=static&seed=1",{waitUntil:"load"});
await page.waitForTimeout(700);
const state=await page.evaluate(()=>({
  htmlClass:document.documentElement.className,
  body:{...document.body.dataset},
  on:[...document.querySelectorAll(".view.on")].map(x=>x.id),
  mainTextLen:(document.querySelector("main")?.innerText||"").length,
  indexVisible:!!document.querySelector('[data-ui="index"]')?.offsetParent
}));

const nojs=await browser.newContext({javaScriptEnabled:false,viewport:{width:1440,height:900}});
const np=await nojs.newPage();await np.goto("http://localhost:8080/",{waitUntil:"load"});
const nojsState=await np.evaluate(()=>{
  const v=document.querySelector("#view-columns"),li=v?.querySelector(".manifest li");
  const sv=v?getComputedStyle(v):null,sl=li?getComputedStyle(li):null;
  return {htmlClass:document.documentElement.className,noscript:document.querySelectorAll("noscript").length,
    view:{hidden:v?.hasAttribute("hidden"),display:sv?.display,visibility:sv?.visibility,opacity:sv?.opacity,height:v?.getBoundingClientRect().height},
    li:{display:sl?.display,visibility:sl?.visibility,opacity:sl?.opacity,height:li?.getBoundingClientRect().height},
    mainTextLen:(document.querySelector("main")?.innerText||"").length};
});

await page.emulateMedia({media:"print"});
const printState=await page.evaluate(()=>{
  const v=document.querySelector("#view-record"),li=v?.querySelector(".record-list li"),main=document.querySelector("main");
  const sv=v?getComputedStyle(v):null,sl=li?getComputedStyle(li):null,sm=main?getComputedStyle(main):null;
  return {view:{hidden:v?.hasAttribute("hidden"),display:sv?.display,visibility:sv?.visibility,opacity:sv?.opacity,height:v?.getBoundingClientRect().height},
    li:{display:sl?.display,visibility:sl?.visibility,opacity:sl?.opacity,height:li?.getBoundingClientRect().height},
    main:{display:sm?.display,visibility:sm?.visibility,opacity:sm?.opacity}};
});

const mobile=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true});
const mp=await mobile.newPage();await mp.goto("http://localhost:8080/?force=static",{waitUntil:"load"});
const focusState=await mp.evaluate(()=>{
 const a=document.querySelector('.domain-strip a[data-facet="columns"]');a?.focus();
 return {focused:document.activeElement===a,transform:a?getComputedStyle(a,'::before').transform:null,color:a?getComputedStyle(a).color:null};
});
console.log(JSON.stringify({state,nojsState,printState,focusState,errors,logs},null,2));
await nojs.close();await mobile.close();await browser.close();
if(errors.length||state.on.length!==1||state.mainTextLen<20)process.exit(1);
