import { chromium } from "@playwright/test";
import { createRequire } from "node:module";
import os from "node:os";
import fs from "node:fs";
import path from "node:path";
const require=createRequire(import.meta.url);
const pwVersion=require("@playwright/test/package.json").version;
const outDir="gpu-qa";fs.mkdirSync(outDir,{recursive:true});
const origin="http://127.0.0.1:8080";
const report={timestamp:new Date().toISOString(),os:{platform:os.platform(),release:os.release(),arch:os.arch()},playwright:pwVersion,executablePath:chromium.executablePath(),origin,launches:[]};

async function caps(page){
  return await page.evaluate(async()=>{
    const c=document.createElement("canvas");
    let gl=null,gl2=null;
    try{gl=c.getContext("webgl")}catch{}
    try{gl2=c.getContext("webgl2")}catch{}
    const info=(g)=>g?{
      version:g.getParameter(g.VERSION),renderer:g.getParameter(g.RENDERER),
      vendor:g.getParameter(g.VENDOR),
      unmaskedRenderer:(()=>{const e=g.getExtension("WEBGL_debug_renderer_info");return e?g.getParameter(e.UNMASKED_RENDERER_WEBGL):null})()
    }:null;
    let webgpuAdapter=false,webgpuInfo=null;
    if(navigator.gpu){try{const a=await navigator.gpu.requestAdapter();webgpuAdapter=!!a;webgpuInfo=a?.info?{vendor:a.info.vendor,architecture:a.info.architecture,device:a.info.device,description:a.info.description}:null}catch{}}
    return {webgpu:!!navigator.gpu,webgpuAdapter,webgpuInfo,webgl:info(gl),webgl2:info(gl2)};
  });
}
async function launchProbe(name,args=[]){
  const entry={name,args,plain:name==="plain-default",errors:[],console:[],states:[]};
  let browser;
  try{
    browser=await chromium.launch({headless:true,args});
    entry.browserVersion=browser.version();
    const page=await browser.newPage({viewport:{width:1440,height:900}});
    page.on("pageerror",e=>entry.errors.push(String(e)));
    page.on("console",m=>{if(["error","warning"].includes(m.type()))entry.console.push(m.type()+": "+m.text())});
    await page.goto(origin+"/?force=static&seed=271828",{waitUntil:"load"});
    entry.capabilities=await caps(page);
    await page.close();
  }catch(e){entry.launchError=String(e)}finally{await browser?.close().catch(()=>{})}
  report.launches.push(entry);return entry;
}
await launchProbe("plain-default",[]);

const sets=[
  ["swiftshader-webgl",["--enable-unsafe-swiftshader","--use-gl=angle","--use-angle=swiftshader"]],
  ["vulkan-dawn",["--enable-unsafe-webgpu","--enable-features=Vulkan,UseSkiaRenderer","--use-angle=vulkan","--disable-vulkan-surface","--enable-dawn-features=allow_unsafe_apis"]],
  ["swiftshader-dawn",["--enable-unsafe-webgpu","--enable-unsafe-swiftshader","--use-gl=angle","--use-angle=swiftshader","--enable-dawn-features=allow_unsafe_apis"]]
];
for(const [name,args] of sets)await launchProbe(name,args);

// Explicit forced-WebGL is a production path and should be attempted even when a
// direct canvas WebGL2 probe under-reports capability. FieldEngine/Three is the authority.
const bestWebgl=report.launches.find(x=>x.capabilities?.webgl2||x.capabilities?.webgl)||report.launches[0];
const bestWebgpu=report.launches.find(x=>x.capabilities?.webgpuAdapter);
const routes=[["home",""],["finance","#/columns"],["restaurant","#/tables"],["construction","#/frame"],["investor","#/surface"],["entrepreneur","#/vector"],["ai","#/lattice"],["skills","#/clusters"],["hobbies","#/orbit"]];

async function rendererRun(kind,launch){
  if(!launch)return {kind,available:false};
  const run={kind,available:true,launch:launch.name,states:[],errors:[],console:[]};
  let browser;
  try{
    browser=await chromium.launch({headless:true,args:launch.args});
    const page=await browser.newPage({viewport:{width:1440,height:900}});
    page.on("pageerror",e=>run.errors.push(String(e)));
    page.on("console",m=>{if(["error","warning"].includes(m.type()))run.console.push(m.type()+": "+m.text())});
    for(const [domain,hash] of routes){
      const query=kind==="webgl"?"?force=webgl&seed=271828&run=1":"?seed=271828&run=1";
      await page.goto(origin+"/"+query+hash,{waitUntil:"load"});
      await page.waitForFunction((expected)=>document.body.dataset.renderDomain===expected||document.body.dataset.renderer==="static",domain,{timeout:12000}).catch(()=>{});
      await page.waitForTimeout(1000);
      const state=await page.evaluate(()=>({renderer:document.body.dataset.renderer,tier:document.body.dataset.tier,domain:document.body.dataset.renderDomain,recipe:document.body.dataset.recipe,topology:document.body.dataset.topology,layers:document.body.dataset.layers,surfaceLayers:document.body.dataset.surfaceLayers,cost:document.body.dataset.cost,chromatic:document.body.dataset.chromatic,fps:document.body.dataset.fps||null}));
      const file=path.join(outDir,`${kind}-${domain}.png`);
      await page.screenshot({path:file,fullPage:false});
      run.states.push({domain,...state,screenshot:file});
    }
  }catch(e){run.runError=String(e)}finally{await browser?.close().catch(()=>{})}
  return run;
}
report.webgl=await rendererRun("webgl",bestWebgl);
report.webgpu=await rendererRun("webgpu",bestWebgpu);
report.verdict={
  plainLaunch:!report.launches[0].launchError,
  webglExecuted:report.webgl.available&&report.webgl.states.some(s=>s.renderer==="webgl"&&Number(s.surfaceLayers)>0),
  webgpuExecuted:report.webgpu.available&&report.webgpu.states.some(s=>s.renderer==="webgpu"&&Number(s.surfaceLayers)>0),
  webgpuAdapterAvailable:!!bestWebgpu
};
fs.writeFileSync(path.join(outDir,"report.json"),JSON.stringify(report,null,2));
console.log(JSON.stringify(report,null,2));
