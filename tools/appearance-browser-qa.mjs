import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
const repo=fileURLToPath(new URL('..',import.meta.url)),origin=process.argv[2]||'http://127.0.0.1:8080',out=join(repo,'test-results/appearance-release');mkdirSync(out,{recursive:true});
import {chromium,devices} from '@playwright/test';
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--enable-gpu','--ignore-gpu-blocklist','--enable-unsafe-webgpu','--use-angle=d3d11']});
const rows=[];
async function run(name,fn){try{const details=await fn();rows.push({name,pass:true,details});console.log('PASS '+name);}catch(error){rows.push({name,pass:false,error:error.message});console.log('FAIL '+name+': '+error.message);}}
const sample=page=>page.evaluate(()=>({engine:document.body.dataset.engine,renderer:document.body.dataset.renderer,mode:document.body.dataset.appearanceMode,pattern:document.body.dataset.appearancePattern,scheme:document.body.dataset.appearanceScheme,density:document.body.dataset.appearanceDensity,framing:document.body.dataset.appearanceFraming,page:document.body.dataset.appearancePage,fps:document.body.dataset.fps,error:document.body.dataset.fieldError||document.body.dataset.resonanceError,compiled:document.documentElement.dataset.fieldCompiledModes,submitted:document.documentElement.dataset.fieldSubmittedModes,views:[...document.querySelectorAll('.view.on')].map(e=>e.id),overflow:document.documentElement.scrollWidth>innerWidth}));
const gpuReady=page=>page.waitForSelector('body[data-engine="resonance"]',{timeout:16000});
const settled=page=>page.waitForFunction(()=>{const b=document.body.dataset,r=document.documentElement.dataset;return !b.patternLoading&&r.fieldSubmittedModes?.split(',').includes(b.appearanceMode);},null,{timeout:10000});
let desktop;
await run('desktop startup, eight pages, session reload and bottom hover stability',async()=>{
 desktop=await browser.newContext({viewport:{width:1440,height:900}});const page=await desktop.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.goto(origin+'/?timing=1');await gpuReady(page);await settled(page);assert.equal((await sample(page)).pattern,'sunflower');
 await page.waitForSelector('html[data-field-ready]');await page.screenshot({path:join(out,'home-desktop.png')});
 const records={};for(const id of ['columns','tables','frame','surface','vector','lattice','clusters','orbit']){
  await page.evaluate(id=>location.hash='view-'+id,id);await page.waitForFunction(id=>document.body.dataset.appearancePage===id&&document.getElementById('view-'+id)?.classList.contains('on'),id);await settled(page);const row=await sample(page);assert.equal(row.engine,'resonance');assert.equal(row.overflow,false);assert.equal(row.views.length,1);records[id]=row;
 }
 const before=records.orbit;await page.reload();await gpuReady(page);await settled(page);const after=await sample(page);for(const key of ['pattern','scheme','density','framing'])assert.equal(after[key],before[key],key+' changed on reload');
 await page.evaluate(()=>location.hash='view-home');await page.waitForFunction(()=>document.body.dataset.appearancePage==='home');await settled(page);
 const beforeHover=await sample(page),link=page.locator('.domain-strip [data-facet="columns"]');await link.hover();await page.waitForTimeout(180);const afterHover=await sample(page);for(const key of ['page','pattern','scheme','density','framing'])assert.equal(afterHover[key],beforeHover[key],'Bottom hover changed '+key);assert.deepEqual(afterHover.views,['view-home']);await page.locator('h1').hover();assert.equal((await sample(page)).pattern,'sunflower');
 await page.evaluate(()=>{location.hash='view-columns';setTimeout(()=>location.hash='view-frame',20);setTimeout(()=>location.hash='view-orbit',40);});await page.waitForFunction(()=>document.body.dataset.appearancePage==='orbit');await settled(page);await page.waitForTimeout(400);assert.deepEqual((await sample(page)).views,['view-orbit']);
 assert.deepEqual(errors,[]);return {records,afterReload:after};
});
await run('mobile startup, copy clearance, gestures and resize preserve assignment',async()=>{
 const context=await browser.newContext({...devices['Pixel 7'],viewport:{width:390,height:844}}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(origin+'/?timing=1');await gpuReady(page);await settled(page);await page.waitForSelector('html[data-field-ready]');
 const initial=await sample(page);assert.equal(initial.pattern,'sunflower');assert.equal(initial.overflow,false);await page.screenshot({path:join(out,'home-mobile.png')});
 const geometry=await page.evaluate(()=>{const h=document.querySelector('.view.on h1').getBoundingClientRect(),header=document.querySelector('.site-head').getBoundingClientRect();return {h:{x:h.x,y:h.y,right:h.right,bottom:h.bottom},headerBottom:header.bottom,width:innerWidth};});assert.ok(geometry.h.x>=0&&geometry.h.right<=geometry.width+.5);assert.ok(geometry.h.y>geometry.headerBottom);
 const swipe=async(events)=>page.evaluate(events=>{const target=document.querySelector('main');for(const [type,x,y,id=1,primary=true] of events)target.dispatchEvent(new PointerEvent(type,{bubbles:true,pointerType:'touch',pointerId:id,isPrimary:primary,clientX:x,clientY:y}));},events);
 await swipe([['pointerdown',300,650],['pointerup',120,653],['pointerdown',300,650],['pointerup',120,653]]);await page.waitForFunction(()=>document.body.dataset.appearancePage==='columns');await settled(page);
 const before=await sample(page);assert.equal(before.page,'columns');
 await page.waitForTimeout(750);await swipe([['pointerdown',180,650],['pointerup',182,350]]);assert.equal((await sample(page)).page,'columns');
 await swipe([['pointerdown',300,650],['pointerdown',280,620,2,false],['pointerup',100,650],['pointerup',100,620,2,false]]);assert.equal((await sample(page)).page,'columns');
 await page.setViewportSize({width:844,height:390});await settled(page);const after=await sample(page);assert.equal(after.pattern,before.pattern);assert.equal(after.scheme,before.scheme);assert.equal(after.page,before.page);assert.equal(after.overflow,false);
 assert.deepEqual(errors,[]);await context.close();return {initial,before,after,geometry};
});
await run('reduced motion and blocked storage use selected static scene',async()=>{
 const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'}),page=await context.newPage();
 await page.addInitScript(()=>{Storage.prototype.setItem=function(){throw new DOMException('blocked','SecurityError');};Storage.prototype.getItem=function(){throw new DOMException('blocked','SecurityError');};});
 await page.goto(origin+'/');await page.waitForSelector('body[data-appearance-pattern="sunflower"]');await page.waitForTimeout(300);const state=await sample(page);assert.equal(state.renderer,'static');assert.equal(state.pattern,'sunflower');assert.equal(state.overflow,false);assert.equal(await page.locator('#sand').count(),0);assert.equal(await page.locator('h1').first().isVisible(),true);await page.screenshot({path:join(out,'home-static.png')});await context.close();return state;
});
for(const failure of ['adapter-null','adapter-throws','adapter-hangs','device-rejects','pipeline-rejects','device-loss'])await run('GPU failure: '+failure,async()=>{
 const context=await browser.newContext({viewport:{width:390,height:844}}),page=await context.newPage();
 await page.addInitScript(failure=>{
  if(failure==='adapter-null')navigator.gpu.requestAdapter=async()=>null;
  if(failure==='adapter-throws')navigator.gpu.requestAdapter=async()=>{throw Error('injected adapter failure');};
  if(failure==='adapter-hangs')navigator.gpu.requestAdapter=()=>new Promise(()=>{});
  if(['device-rejects','pipeline-rejects','device-loss'].includes(failure)){
   const request=navigator.gpu.requestAdapter.bind(navigator.gpu);navigator.gpu.requestAdapter=async(...args)=>{const adapter=await request(...args);return new Proxy(adapter,{get(target,key){if(key==='requestDevice')return async(...args)=>{if(failure==='device-rejects')throw Error('injected device failure');const device=await target.requestDevice(...args);if(failure==='pipeline-rejects')device.createComputePipelineAsync=async()=>{throw Error('injected pipeline failure');};if(failure==='device-loss')setTimeout(()=>device.destroy(),2000);return device;};const v=target[key];return typeof v==='function'?v.bind(target):v;}});};
  }
 },failure);
 await page.goto(origin+'/');await page.waitForFunction(()=>document.body.dataset.renderer==='static'&&!!(document.body.dataset.fieldError||document.body.dataset.resonanceError),null,{timeout:15000});
 const state=await sample(page);assert.equal(state.pattern,'sunflower');assert.equal(await page.locator('#sand').count(),0);assert.equal(await page.locator('h1').first().isVisible(),true);assert.equal(await page.locator('#appearance-static').isVisible(),true);await context.close();return state;
});
await run('fresh sessions get different plans; no laboratory controls or globals ship',async()=>{
 const schemes=[];for(let i=0;i<3;i++){const context=await browser.newContext({reducedMotion:'reduce'}),page=await context.newPage();await page.goto(origin+'/#view-columns');await page.waitForSelector('body[data-appearance-page="columns"]');const state=await sample(page);schemes.push(state.pattern+':'+state.scheme+':'+state.framing);assert.equal(await page.locator('#sand-lab').count(),0);await context.close();}assert.ok(new Set(schemes).size>1);return schemes;
});
if(desktop)await desktop.close();await browser.close();writeFileSync(join(out,'browser-results.json'),JSON.stringify(rows,null,2)+'\n');console.log(JSON.stringify({passed:rows.filter(r=>r.pass).length,failed:rows.filter(r=>!r.pass).length}));process.exitCode=rows.every(r=>r.pass)?0:1;
