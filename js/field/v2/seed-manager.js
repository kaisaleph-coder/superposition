import { HOME_MASTER_SEEDS } from './domain-grammars.js';
import { hash32 } from './recipe-compiler.js';

const KEY='sp-v2-session-seed';
function randomSeed(){
  try{const a=new Uint32Array(1);crypto.getRandomValues(a);return a[0]||271828}catch{return (Date.now()^Math.floor(performance.now()*1000))>>>0}
}
export function resolveSessionSeed(explicit){
  if(explicit!==null&&explicit!==undefined&&explicit!==''){
    const n=Number(explicit); return Number.isFinite(n)?(n>>>0):hash32(String(explicit).split('').reduce((a,c)=>a+c.charCodeAt(0),0));
  }
  try{
    const old=sessionStorage.getItem(KEY);if(old!==null)return Number(old)>>>0;
    const n=randomSeed();sessionStorage.setItem(KEY,String(n));return n;
  }catch{return randomSeed()}
}
export function homeMasterSeed(sessionSeed){return HOME_MASTER_SEEDS[hash32(sessionSeed)%HOME_MASTER_SEEDS.length]}
export function routeSeed(sessionSeed,domain,index=0){
  let x=sessionSeed>>>0;for(const c of domain)x=hash32(x+c.charCodeAt(0));return hash32(x+index*7919)
}
