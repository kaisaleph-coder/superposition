import {DOMAIN_GRAMMARS,SURFACE_COST,HOME_MASTER_SEEDS} from './domain-grammars.js';
import {compileChromaticState} from './color-engine.js';
export function hash32(x){x|=0;x=Math.imul(x^(x>>>16),0x21f0aaad);x=Math.imul(x^(x>>>15),0x735a2d97);return(x^(x>>>15))>>>0}
export function makeRng(seed){let a=hash32(seed||1);return()=>{a+=0x6D2B79F5;let t=a;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296}}
const pick=(r,a)=>a[Math.floor(r()*a.length)%a.length],range=(r,a,b)=>a+(b-a)*r();
export function compileRecipe(domain,index,seedBase=271828){
  const g=DOMAIN_GRAMMARS[domain];
  const seed=index===0&&domain==='home'?(HOME_MASTER_SEEDS.includes(seedBase)?seedBase:HOME_MASTER_SEEDS[hash32(seedBase)%HOME_MASTER_SEEDS.length]):hash32(seedBase+index*7919+domain.length*131+(index===0?997:0));
  const r=makeRng(seed),chromatic=compileChromaticState(g,seed);
  const count=Math.floor(range(r,g.layers[0],g.layers[1]+.999)),chosen=[...g.required];
  while(chosen.length<count){const f=pick(r,g.allow);if(!chosen.includes(f)||r()<.24)chosen.push(f)}
  const topology=pick(r,g.topologies),symmetry=pick(r,['bilateral','radial','broken','axial','none']),deformation=pick(r,['laminar','folded','torsion','shear','pulse','caustic']);
  const layers=chosen.map((type,i)=>{
    const color=chromatic.colors[(i+Math.floor(r()*4))%chromatic.colors.length],color2=chromatic.colors[(i+3+Math.floor(r()*3))%chromatic.colors.length];
    return {type,seed:hash32(seed+i*9973),color:color.hex,color2:color2.hex,rgb:color.rgb,alpha:range(r,.17,.48),weight:range(r,.5,1.5),phase:range(r,0,Math.PI*2),density:range(r,.68,1.42),twist:range(r,-1.85,1.85),scale:range(r,.68,1.28),frequency:range(r,.72,1.65),direction:r()<.5?-1:1,mirror:r()<.34,blend:pick(r,['normal','screen','normal','normal']),cost:SURFACE_COST[type]?.cost||3};
  });
  const cost=layers.reduce((a,b)=>a+b.cost,0);
  const signature=hash32(seed^hash32(topology.length*31337)^hash32(chosen.join('').length*911)).toString(16).padStart(8,'0');
  return {domain,index,seed,signature,law:g.law,topology,symmetry,deformation,layers,cost,chromatic};
}
