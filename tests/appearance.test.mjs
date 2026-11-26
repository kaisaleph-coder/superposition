import test from 'node:test';
import assert from 'node:assert/strict';
import {createPlan,resolvePlan,adaptRecipe,paletteFor,contrast,compatible,PAGES} from '../js/field/appearance.js';
import {PATTERNS,SCHEMES} from '../js/field/appearance-catalog.js';
test('curated catalog has 26 patterns and 26 complete schemes; excluded IDs absent',()=>{
 assert.equal(PATTERNS.length,26);assert.equal(Object.keys(SCHEMES).length,26);
 for(const id of [12,17,28,36])assert.ok(!PATTERNS.some(p=>p[2]===id));
 for(const name of ['ocean','cyanotype'])assert.ok(!Object.hasOwn(SCHEMES,name));
});
test('home remains fixed while eight domains receive distinct compatible assignments',()=>{
 const coverage=new Set();let dramatic=0,total=0;
 for(let seed=0;seed<2000;seed++){
  const plan=createPlan(seed),recipes=PAGES.map(id=>plan.recipes[id]);
  assert.deepEqual(plan.recipes.home,{pattern:'sunflower',mode:13,scheme:'signal',profile:'fixed',density:1,x:0,y:0,rotation:0});
  assert.equal(new Set(recipes.map(r=>r.mode)).size,8);assert.ok(recipes.every(r=>r.mode!==13));
  for(const r of recipes){assert.ok(compatible(r.pattern,r.scheme));assert.ok(r.density>=.78&&r.density<=1.6);coverage.add(r.pattern);dramatic+=r.profile==='dramatic';total++;}
  assert.deepEqual(createPlan(seed),plan);
 }
 assert.equal(coverage.size,25);assert.ok(dramatic/total>.27&&dramatic/total<.33);
});
test('reload reuses the session seed; separate fresh seeds change domain appearances',()=>{
 const values=new Map(),storage={getItem:k=>values.get(k),setItem:(k,v)=>values.set(k,v)};
 let next=1;const crypto={getRandomValues:a=>{a[0]=next++;return a;}};
 const first=resolvePlan(storage,crypto),reload=resolvePlan(storage,crypto);assert.deepEqual(reload,first);assert.equal(next,2);
 values.clear();assert.notDeepEqual(resolvePlan(storage,crypto).recipes.columns,first.recipes.columns);
});
test('corrupt/blocked storage and explicit QA seed recover without an exception or write',()=>{
 const crypto={getRandomValues:a=>{a[0]=17;return a;}},storage={getItem:()=>'{broken',setItem:()=>{throw Error('blocked');}};
 assert.equal(resolvePlan(storage,crypto).seed,17);
 assert.doesNotThrow(()=>resolvePlan({getItem:()=>{throw Error('blocked');},setItem:()=>{}},crypto));
 const blocked={getItem:()=>{throw Error('QA must not read');},setItem:()=>{throw Error('QA must not write');}};
 assert.deepEqual(resolvePlan(blocked,crypto,'123'),resolvePlan(blocked,crypto,'123'));
});
test('phone adaptation bounds detail/crop and preserves the stored assignment',()=>{
 for(let seed=0;seed<300;seed++)for(const recipe of Object.values(createPlan(seed).recipes)){
  const copy={...recipe},phone=adaptRecipe(recipe,true);assert.deepEqual(recipe,copy);assert.equal(phone.pattern,recipe.pattern);assert.equal(phone.scheme,recipe.scheme);
  assert.ok(phone.density>=.85&&phone.density<=1.15);assert.ok(Math.abs(phone.x)<=.0871);assert.ok(Math.abs(phone.y)<=.0871);assert.ok(Math.abs(phone.rotation)<=.0876);
 }
});
test('all palette text tokens maintain opaque contrast against their surfaces',()=>{
 for(const scheme of Object.keys(SCHEMES)){
  const p=paletteFor({scheme,pattern:'maze'},5);
  assert.ok(contrast(p.ink,p.ground)>=4.5,scheme+' ink');assert.ok(contrast(p.muted,p.ground)>=4.5,scheme+' muted');assert.ok(contrast(p.muted,p.ground2)>=4.5,scheme+' panel muted');assert.ok(contrast(p.accentText,p.ground)>=4.5,scheme+' accent');
 }
});
