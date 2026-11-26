import {createRequire} from 'node:module';
import {resolve,join} from 'node:path';
import {pathToFileURL,fileURLToPath} from 'node:url';
import {writeFileSync,mkdirSync} from 'node:fs';
const repo=resolve(process.argv[2]||fileURLToPath(new URL('..',import.meta.url))),require=createRequire(join(repo,'package.json'));
const {chromium}=require('@playwright/test'),{default:AxeBuilder}=await import(pathToFileURL(require.resolve('@axe-core/playwright')));
const {resolvePlan}=await import(pathToFileURL(join(repo,'js/field/appearance.js')));
const cases=new Map();for(let i=0;i<10000&&cases.size<26;i++){const r=resolvePlan(null,null,String(i)).recipes.columns;if(!cases.has(r.scheme))cases.set(r.scheme,String(i));}
if(cases.size!==26)throw Error('Palette fixture did not cover catalog');
const browser=await chromium.launch({channel:'chrome',headless:true}),context=await browser.newContext({reducedMotion:'reduce',viewport:{width:1440,height:900}}),page=await context.newPage(),rows=[];
try{for(const [scheme,seed] of [...cases].filter(([scheme])=>!process.argv[3]||scheme===process.argv[3])){
 await page.goto('http://127.0.0.1:8080/?force=static&seed='+seed+'#view-columns');await page.waitForSelector('body[data-appearance-scheme="'+scheme+'"]');
 await page.waitForFunction(()=>{const view=document.querySelector('#view-columns');return view.classList.contains('on')&&getComputedStyle(view).opacity==='1';});
 const content=await new AxeBuilder({page}).withRules(['color-contrast']).analyze();
 await page.getByRole('button',{name:'Index',exact:true}).click();
 await page.waitForFunction(()=>getComputedStyle(document.getElementById('indexOverlay')).opacity==='1');
 const index=await new AxeBuilder({page}).withRules(['color-contrast']).analyze();
 const violations=[...content.violations,...index.violations].map(v=>({id:v.id,impact:v.impact,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))}));
 const background=await page.locator('main').evaluate(el=>({inert:el.inert,hidden:el.getAttribute('aria-hidden'),opacity:getComputedStyle(el).opacity}));
 rows.push({scheme,seed,contentViolations:content.violations,indexViolations:index.violations,background,violations});console.log((violations.length?'FAIL ':'PASS ')+scheme+' contrast'+(violations.length?' '+JSON.stringify(violations.map(v=>v.nodes.map(n=>n.target))):''));
}}finally{await browser.close();}
mkdirSync(join(repo,'test-results/appearance-release'),{recursive:true});writeFileSync(join(repo,'test-results/appearance-release/palettes.json'),JSON.stringify(rows,null,2)+'\n');console.log(JSON.stringify({palettes:rows.length,failed:rows.filter(r=>r.violations.length).length}));process.exitCode=rows.every(r=>!r.violations.length)?0:1;
