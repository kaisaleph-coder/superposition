import vm from 'node:vm';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {pathToFileURL,fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
const repo=resolve(process.argv[2]||fileURLToPath(new URL('..',import.meta.url))),candidate=resolve(process.argv[3]||repo),base=join(repo,'test-results/appearance-release'),sha=b=>createHash('sha256').update(b).digest('hex');
mkdirSync(base,{recursive:true});
const paths={engine:join(candidate,'js/field/resonance.js'),appearance:join(candidate,'js/field/appearance.js'),catalog:join(candidate,'js/field/appearance-catalog.js'),css:join(candidate,'css/sand.css')};
const bytes=Object.fromEntries(Object.entries(paths).map(([k,p])=>[k,readFileSync(p)])),source=bytes.engine.toString('utf8').replaceAll('\r\n','\n').replace(/^import[^\n]*\n/gm,'');
const report={startedAt:new Date().toISOString(),sourceHashes:Object.fromEntries(Object.entries(bytes).map(([k,b])=>[k,sha(b)])),queueCases:[],contrast:[],errors:[],complete:false};let browser;
function one(s,t){const a=s.indexOf(t);if(a<0||s.indexOf(t,a+t.length)>=0)throw Error('Expected one anchor '+t);return a;}
const between=(s,a,b)=>s.slice(one(s,a),one(s,b));const turn=()=>new Promise(r=>setImmediate(r));
try{
 const {createAppearanceController}=await import(pathToFileURL(paths.appearance));const {SCHEMES}=await import(pathToFileURL(paths.catalog));
 function fixture(text){
  const prefix=text.slice(0,one(text,'export const Resonance')),queue=between(text,'    const BASE_MODES =','    const openingMode ='),targets=between(text,'    let pendingProgram =','    const toPlate ='),bind=between(text,'    function simulationGroup(','    function makeMaskTextures('),methods=between(text,'      setState(id,','      nextRecipe()');
  const jobs=[],failures=[];let sequence=0;const pipe=modes=>({id:++sequence,modes,getBindGroupLayout(){return {pipe:this.id};}}),first=pipe(new Set([0,1,2,3,4,5,6,7,8,13]));
  const doc={body:{dataset:{}},documentElement:{dataset:{},style:{setProperty(){}},toggleAttribute(){}},defaultView:{innerWidth:1440,matchMedia:()=>({matches:false}),addEventListener(){},sessionStorage:{getItem:()=>null,setItem(){}},crypto:{getRandomValues(a){a[0]=12345;return a;}}}};
  const appearance=createAppearanceController(doc,{seed:'assigned-queue-review'}),context={performance:{now:()=>0},appearance,body:doc.body,root:doc.documentElement,first,failures,fieldTiming:false,device:{createComputePipelineAsync(descriptor){return new Promise(done=>jobs.push({done,modes:new Set([0,...[...descriptor.compute.module.code.matchAll(/case (\d+) \{/g)].map(m=>+m[1])])}));},createBindGroup(d){return {pipe:d.layout.pipe};}}};
  vm.createContext(context);vm.runInContext(prefix+`
   const sampledSIM=SIM,simEntry='sim',mod=code=>({code});${queue}
   const openingMode=13;let simPipe=first,simBG={pipe:first.id},activeSimModes=first.modes;pipelineCache.set([...activeSimModes].join(','),{pipeline:first,modes:first.modes});
   const maskTex={createView:()=>({})},markTex=maskTex,uBuf={},pBuf={},sampler={};${bind}
   let stateId='home',idA=13,idB=13,mixV=1,mixT=1,shakeT=0,shakeAmp=1,hovering=false,previewing=false,dead=false,pitch=1,pitchS=1;
   const REST=.5,setDial=()=>{},queueMask=()=>{},theme={setState(){},previewState(){},clearPreview(){}};function fail(message){failures.push(message);dead=true;}
   ${targets} const api={${methods}};globalThis.h={api,state(){return {stateId,idA,idB,mixT,compiled:[...activeSimModes],pipe:simPipe.id,group:simBG.pipe,failures:[...failures],recipes:appearance.plan.recipes};}};
  `,context);
  return {h:context.h,finish(){const job=jobs.shift();if(!job)throw Error('No pending mocked compiler');job.done(pipe(job.modes));},check(){const s=context.h.state();if(!s.compiled.includes(s.idA)||!s.compiled.includes(s.idB)||s.pipe!==s.group||s.failures.length)throw Error('Dispatch ownership '+JSON.stringify(s));return s;}};
 }
 for(const kind of ['hover-cancel','join-click','latest-click','hover-complete-click']){
  const t=fixture(source);t.h.api.previewState('columns');if(kind!=='hover-complete-click')t.h.api.previewState('tables');if(kind==='hover-cancel')t.h.api.clearPreview();if(kind==='join-click')t.h.api.setState('columns');if(kind==='latest-click')t.h.api.setState('tables');await turn();t.check();t.finish();await turn();if(kind==='latest-click'){if(t.check().idB!==13)throw Error('Superseded mode activated');t.finish();await turn();}if(kind==='hover-complete-click')t.h.api.setState('columns');const s=t.check(),expected=kind==='hover-cancel'?13:s.recipes[s.stateId].mode;if(s.idB!==expected||s.mixT!==1)throw Error('Wrong assigned target '+kind);report.queueCases.push({kind,idB:s.idB,expected});
 }
 const staleA='if (dead || pendingProgram !== request || request.version !== programVersion) return;',staleB='if (wantedMode !== id || !program.modes.has(idA) || !program.modes.has(idB))';one(source,staleA);one(source,staleB);
 const bad=fixture(source.replace(staleA,'if(dead)return;').replace(staleB,'if (!program.modes.has(idA) || !program.modes.has(idB))'));bad.h.api.previewState('columns');bad.h.api.previewState('tables');await turn();bad.finish();await turn();if(bad.check().idB===13)throw Error('Stale activation control survived');report.staleControl={caught:true,wrongMode:bad.check().idB};
 const {chromium}=createRequire(join(repo,'package.json'))('@playwright/test');browser=await chromium.launch({channel:'chrome',headless:true});
 const luminance=rgb=>rgb.map(v=>{const c=v/255;return c<=.04045?c/12.92:((c+.055)/1.055)**2.4;}).reduce((n,c,i)=>n+c*[.2126,.7152,.0722][i],0);
 for(const [arm,path] of [['legacy',join(repo,'tests/fixtures/appearance-legacy-sand.css')],['current',paths.css]]){
  const css=readFileSync(path,'utf8'),page=await browser.newPage(),cases=[];await page.setContent('<html class="sand"><head></head><body><div id="sample" class="positioning">Appearance sample</div></body></html>');await page.addStyleTag({content:css+'\n#sample{color:var(--ink);background-color:var(--ground);font-size:16px}'});
  for(const [from,to] of [['signal','paper'],['paper','signal']]){
   const rows=await page.evaluate(async({from,to})=>{const root=document.documentElement,sample=document.getElementById('sample');root.style.transition='none';root.style.setProperty('--ground',from.ground);root.style.setProperty('--ink',from.ink);getComputedStyle(sample).color;await new Promise(requestAnimationFrame);await new Promise(requestAnimationFrame);root.style.removeProperty('transition');getComputedStyle(root).transition;const canvas=document.createElement('canvas');canvas.width=canvas.height=1;const ctx=canvas.getContext('2d',{willReadFrequently:true}),rgb=color=>{ctx.clearRect(0,0,1,1);ctx.fillStyle=color;ctx.fillRect(0,0,1,1);return [...ctx.getImageData(0,0,1,1).data].slice(0,3);},rows=[],capture=stage=>{const s=getComputedStyle(sample);rows.push({stage,foreground:rgb(s.color),ground:rgb(s.backgroundColor)});};root.style.setProperty('--ground',to.ground);root.style.setProperty('--ink',to.ink);capture('immediate');await new Promise(requestAnimationFrame);capture('next-frame');await new Promise(r=>setTimeout(r,350));capture('350ms');await new Promise(r=>setTimeout(r,450));capture('800ms');return rows;},{from:SCHEMES[from],to:SCHEMES[to]});
   for(const row of rows){const a=luminance(row.foreground),b=luminance(row.ground);row.contrast=(Math.max(a,b)+.05)/(Math.min(a,b)+.05);}cases.push({from,to,minContrast:Math.min(...rows.map(r=>r.contrast)),rows});
  }
  await page.close();report.contrast.push({arm,sha256:sha(css),cases});if(arm==='legacy'&&!cases.every(c=>c.minContrast<4.5))throw Error('Old CSS failure not observed');if(arm==='current'&&!cases.every(c=>c.minContrast>=4.5))throw Error('Current CSS polarity contrast failed');console.log((arm==='legacy'?'RED':'GREEN')+' '+arm+' '+JSON.stringify(cases.map(c=>c.minContrast)));
 }
 report.complete=true;
}catch(error){report.errors.push(error.stack||String(error));}finally{if(browser)await browser.close();report.currentHashes=Object.fromEntries(Object.entries(paths).map(([k,p])=>[k,sha(readFileSync(p))]));if(Object.keys(paths).some(k=>report.currentHashes[k]!==report.sourceHashes[k])){report.complete=false;report.errors.push('Source changed during run');}report.finishedAt=new Date().toISOString();writeFileSync(join(base,'verify-production-transitions.json'),JSON.stringify(report,null,2)+'\n');}
console.log('TRANSITIONS_RECEIPT '+JSON.stringify({complete:report.complete,queueCases:report.queueCases.length,staleControl:report.staleControl,errors:report.errors}));if(!report.complete||report.errors.length)process.exitCode=1;
