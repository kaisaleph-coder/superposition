#!/usr/bin/env node
/* SUPERPOSITION 2.0 bake — one pure-template implementation consumed by browser + Node. */
import {readFileSync,writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {join,dirname} from 'node:path';
const ROOT=join(dirname(fileURLToPath(import.meta.url)),'..');
const {homeHTML,facetHTML,recordHTML,footerHTML,headerHTML,domainStripHTML,indexHTML,FACET_ORDER}=await import(new URL('../js/render-dom.js',import.meta.url));
const w={};new Function('window',readFileSync(join(ROOT,'content/resume.data.js'),'utf8'))(w);const data=w.__RESUME__;if(!data)throw new Error('resume data missing');
const byId=(id)=>data.facets.find(f=>f.id===id);
const sections={
  'view-home':homeHTML(data.identity),'view-record':recordHTML(data.record),header:headerHTML(data.identity),
  'domain-strip':domainStripHTML(data),index:indexHTML(data),footer:footerHTML(data.identity),
};
for(const id of FACET_ORDER){const f=byId(id);if(!f)throw new Error(`missing facet ${id}`);sections[`view-${id}`]=facetHTML(f)}
const htmlPath=join(ROOT,'index.html');let html=readFileSync(htmlPath,'utf8'),missing=[];
for(const [id,content] of Object.entries(sections)){const re=new RegExp(`(<!--BAKE:${id} BEGIN-->)[\\s\\S]*?(<!--BAKE:${id} END-->)`);if(!re.test(html)){missing.push(id);continue}html=html.replace(re,`$1\n${content}\n$2`)}
const css=readFileSync(join(ROOT,'css/main.css'),'utf8').trim().replace(/url\("\.\.\//g,'url("');const cssRe=/(\/\*BAKE:css BEGIN\*\/)[\s\S]*?(\/\*BAKE:css END\*\/)/;if(!cssRe.test(html))missing.push('css');else html=html.replace(cssRe,`$1\n${css}\n$2`);
if(missing.length)throw new Error(`markers not found: ${missing.join(', ')}`);writeFileSync(htmlPath,html);console.log(`baked ${Object.keys(sections).length} surfaces; owner order: ${FACET_ORDER.join(', ')}`);
