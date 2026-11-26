import {createRequire} from 'node:module';import {fileURLToPath} from 'node:url';import {resolve,join} from 'node:path';import {writeFileSync,mkdirSync} from 'node:fs';import assert from 'node:assert/strict';
const repo=resolve(process.argv[2]||fileURLToPath(new URL('..',import.meta.url))),{chromium}=createRequire(join(repo,'package.json'))('@playwright/test'),browser=await chromium.launch({channel:'chrome',headless:true,args:['--enable-gpu','--ignore-gpu-blocklist','--enable-unsafe-webgpu','--use-angle=d3d11']}),rows=[];
async function run(name,fn){try{rows.push({name,pass:true,details:await fn()});console.log('PASS '+name);}catch(e){rows.push({name,pass:false,error:e.message});console.log('FAIL '+name+': '+e.message);}}
await run('Index opened during GPU startup also isolates the late-created pitch control',async()=>{
 const ctx=await browser.newContext({viewport:{width:1440,height:900}}),page=await ctx.newPage();try{
 await page.addInitScript(()=>{const request=navigator.gpu.requestAdapter.bind(navigator.gpu);navigator.gpu.requestAdapter=async(...args)=>{await new Promise(r=>setTimeout(r,900));return request(...args);};});
 await page.goto('http://127.0.0.1:8080/?timing=1',{waitUntil:'domcontentloaded'});await page.getByRole('button',{name:'Index',exact:true}).click();await page.waitForSelector('body[data-engine="resonance"]',{timeout:16000});
 const state=await page.locator('#sand-dial').evaluate(e=>({inert:e.inert,hidden:e.getAttribute('aria-hidden')}));assert.equal(state.inert,true,'late pitch control escaped Index isolation');await page.keyboard.press('Escape');assert.equal(await page.locator('#sand-dial').evaluate(e=>e.inert),false);return state;
 }finally{await ctx.close();}
});
await run('GPU device resolving after timeout is destroyed and never activates',async()=>{
 const ctx=await browser.newContext({viewport:{width:390,height:844}}),page=await ctx.newPage();try{
 await page.addInitScript(()=>{const request=navigator.gpu.requestAdapter.bind(navigator.gpu);navigator.gpu.requestAdapter=async(...args)=>{const adapter=await request(...args);return new Proxy(adapter,{get(target,key){if(key==='requestDevice')return async(...args)=>{await new Promise(r=>setTimeout(r,5500));const device=await target.requestDevice(...args),destroy=device.destroy.bind(device);device.destroy=()=>{document.body.dataset.testLateDeviceDestroyed='1';destroy();};return device;};const v=target[key];return typeof v==='function'?v.bind(target):v;}});};});
 await page.goto('http://127.0.0.1:8080/');await page.waitForSelector('body[data-test-late-device-destroyed="1"]',{timeout:12000});const state=await page.locator('body').evaluate(b=>({...b.dataset}));assert.equal(state.renderer,'static');assert.equal(state.appearancePattern,'sunflower');assert.equal(state.engine,undefined);assert.match(state.fieldError,/timed out/);assert.equal(await page.locator('#sand').count(),0);return {renderer:state.renderer,error:state.fieldError,destroyed:state.testLateDeviceDestroyed};
 }finally{await ctx.close();}
});
await run('startup watchdog makes fallback final when the renderer module arrives late',async()=>{
 const ctx=await browser.newContext({viewport:{width:390,height:844}}),page=await ctx.newPage();try{
 await page.route('**/js/field/resonance.js',async route=>{await new Promise(r=>setTimeout(r,6600));await route.continue();});
 await page.goto('http://127.0.0.1:8080/',{waitUntil:'domcontentloaded'});await page.waitForSelector('html[data-field-startup="fallback"]',{timeout:9000});await page.waitForTimeout(2200);
 const state=await page.locator('body').evaluate(b=>({...b.dataset}));assert.equal(state.renderer,'static');assert.equal(state.engine,undefined);assert.equal(await page.locator('#sand').count(),0);assert.equal(await page.locator('html').evaluate(e=>e.classList.contains('sand')),false);assert.equal(await page.locator('#appearance-static').evaluate(e=>+getComputedStyle(e).opacity),.65);return {renderer:state.renderer,error:state.fieldError,canvasCount:0};
 }finally{await ctx.close();}
});
await browser.close();mkdirSync(join(repo,'test-results/appearance-release'),{recursive:true});writeFileSync(join(repo,'test-results/appearance-release/edge.json'),JSON.stringify(rows,null,2)+'\n');process.exitCode=rows.every(r=>r.pass)?0:1;
