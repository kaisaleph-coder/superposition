import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const repo=resolve(process.argv[2]||fileURLToPath(new URL('..',import.meta.url))),root=join(repo,'test-results/appearance-release/plan-mutants'),source=readFileSync(join(repo,'js/field/appearance.js'),'utf8'),catalog=readFileSync(join(repo,'js/field/appearance-catalog.js'),'utf8'),test=readFileSync(join(repo,'tests/appearance.test.mjs'),'utf8').replaceAll('../js/field/','./');
const variants=[
 ['control',null,null,null],
 ['home-changed',"profile:'fixed',density:1,x:0","profile:'fixed',density:1.9,x:0",'home remains fixed'],
 ['repeated-pattern',"const [pattern,,mode]=order[i]","const [pattern,,mode]=order[0]",'home remains fixed'],
 ['ignored-session',"Number.isInteger(saved?.seed)","false && Number.isInteger(saved?.seed)",'reload reuses the session seed'],
 ['unbounded-phone',"recipe.x*(mobile?.15:1)","recipe.x*(mobile?1:1)",'phone adaptation bounds'],
 ['unsafe-text',"function readable(color,ground,ink){","function readable(color,ground,ink){return color;",'all palette text tokens']
];const rows=[];
for(const [name,before,after,expected] of variants){const dir=join(root,name);mkdirSync(dir,{recursive:true});let subject=source;if(before){if(subject.split(before).length!==2)throw Error('Mutant anchor not unique '+name);subject=subject.replace(before,after);}writeFileSync(join(dir,'appearance.js'),subject);writeFileSync(join(dir,'appearance-catalog.js'),catalog);writeFileSync(join(dir,'appearance.test.mjs'),test);let output,code=0;try{output=execFileSync('node',['--test',join(dir,'appearance.test.mjs')],{encoding:'utf8',stdio:['ignore','pipe','pipe']});}catch(error){code=error.status;output=String(error.stdout)+String(error.stderr);}const killed=name==='control'?code===0:code===1&&output.includes('ERR_ASSERTION')&&output.includes(expected);rows.push({name,code,killed,expected,output});console.log((killed?'PASS ':'FAIL ')+name+(name==='control'?' green':' rejected for intended assertion'));}
writeFileSync(join(repo,'test-results/appearance-release/plan-mutation-results.json'),JSON.stringify(rows,null,2)+'\n');if(rows.some(r=>!r.killed))process.exitCode=1;
