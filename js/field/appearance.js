import { PATTERNS, SCHEMES } from './appearance-catalog.js';
export const PAGES = Object.freeze(['columns','tables','frame','surface','vector','lattice','clusters','orbit']);
export const CATALOG_VERSION = 1;
const KEY = 'sp-appearance-v1';
const busy = new Set(['cells','maze','contours','sierpinski','mandelbrot','julia','kaleido','rain']);
const multicolor = new Set(['aurora','patina','neon','thermal','spectrum']);
export const compatible = (pattern,scheme) => !busy.has(pattern) || !multicolor.has(scheme);
function hash(value) { let h=2166136261;for(const c of String(value)){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0; }
function random(seed) {let s=seed>>>0;return()=>{s=(s+0x6d2b79f5)>>>0;let t=s;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};}
const stream=(seed,key)=>random(hash(seed+':'+key));
const between=(rng,a,b)=>a+(b-a)*rng();
export function createPlan(seed) {
  const order=PATTERNS.filter(p=>p[0]!=='sunflower'),rng=stream(seed,'patterns');
  for(let i=order.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[order[i],order[j]]=[order[j],order[i]];}
  const recipes={home:{pattern:'sunflower',mode:13,scheme:'signal',profile:'fixed',density:1,x:0,y:0,rotation:0}};
  for(const [i,page] of PAGES.entries()){
    const [pattern,,mode]=order[i],colors=Object.keys(SCHEMES).filter(s=>compatible(pattern,s));
    const color=stream(seed,page+':color'),compose=stream(seed,page+':composition');
    const dramatic=compose()>=.7,range=dramatic?.58:.18;
    recipes[page]={pattern,mode,scheme:colors[Math.floor(color()*colors.length)],profile:dramatic?'dramatic':'subtle',density:between(compose,dramatic?.78:.92,dramatic?1.6:1.14),x:between(compose,-range,range),y:between(compose,-range,range),rotation:between(compose,dramatic?-.35:-.08,dramatic?.35:.08)};
  }
  recipes.record={...recipes.home};return {version:CATALOG_VERSION,seed:seed>>>0,recipes};
}
const luminance=hex=>{const n=parseInt(hex.slice(1),16);return [n>>16&255,n>>8&255,n&255].map(v=>{const c=v/255;return c<=.04045?c/12.92:((c+.055)/1.055)**2.4;}).reduce((a,c,i)=>a+c*[.2126,.7152,.0722][i],0);};
export const contrast=(a,b)=>{const x=luminance(a),y=luminance(b);return(Math.max(x,y)+.05)/(Math.min(x,y)+.05);};
function readable(color,ground,ink){if(contrast(color,ground)>=4.5)return color;return ink;}
export function paletteFor(recipe,seed=0){
  const sc={...SCHEMES[recipe.scheme],sand:[...SCHEMES[recipe.scheme].sand]};
  if(sc.pageAccent){const pool=Object.values(SCHEMES).filter(s=>!s.pageAccent);const accent=pool[hash(seed+':'+recipe.pattern)%pool.length].accent;sc.accent=accent;sc.accent2=accent;sc.sand[4]=accent;}
  sc.muted=readable(sc.muted,sc.ground2,sc.ink);sc.accentText=readable(sc.accent,sc.ground,sc.ink);
  return sc;
}
const fine = new Set(['quasi','cells','maze','chladni','quasi7','seigaiha','cubes','rose','cardioid','superformula','hexagons','pentagram','sierpinski','mandelbrot','julia','cassini','lissajous','flower']);
export function adaptRecipe(recipe,mobile){const narrow=fine.has(recipe.pattern);return {...recipe,density:mobile?Math.min(narrow?1.08:1.15,Math.max(narrow?.92:.85,recipe.density)):recipe.density,x:recipe.x*(mobile?.15:1),y:recipe.y*(mobile?.15:1),rotation:recipe.rotation*(mobile?.25:1)};}
export function resolvePlan(storage,crypto,forcedSeed=null){
  if(forcedSeed!==null)return createPlan(hash(forcedSeed));
  let saved;try{saved=JSON.parse(storage.getItem(KEY));}catch{}
  const seed=Number.isInteger(saved?.seed)&&saved.seed>=0&&saved.seed<=0xffffffff?saved.seed:crypto.getRandomValues(new Uint32Array(1))[0];
  // Re-derive a canonical plan: corrupt/tampered assignments and removed choices never survive.
  const plan=createPlan(seed);try{storage.setItem(KEY,JSON.stringify(plan));}catch{}return plan;
}
export function createAppearanceController(doc,{seed=null}={}){
  const win=doc.defaultView,body=doc.body,root=doc.documentElement;
  let storage;try{storage=win.sessionStorage;}catch{storage={getItem:()=>null,setItem:()=>{}};}
  const plan=resolvePlan(storage,win.crypto,seed),mobile=()=>win.matchMedia('(pointer:coarse)').matches||win.innerWidth<=720;
  let committed='home',preview=null;
  const forState=id=>adaptRecipe(plan.recipes[id]||plan.recipes.home,mobile());
  function apply(){
    const recipe=forState(preview||committed),sc=paletteFor(recipe,plan.seed),style=root.style;
    for(const name of ['ground','ground2','ink','muted','rule','accent','accent2'])style.setProperty('--'+name,sc[name]);
    style.setProperty('--accent-text',sc.accentText);style.setProperty('--panel',sc.ground);
    style.setProperty('--appearance-image',`url("${new URL('../../assets/patterns/'+recipe.pattern+'.svg',import.meta.url).href}")`);
    style.setProperty('--appearance-sand',`linear-gradient(120deg,${sc.sand.join(',')})`);
    style.setProperty('--appearance-transform',`translate(${recipe.x*20}%,${recipe.y*20}%) rotate(${recipe.rotation}rad) scale(${1/recipe.density})`);
    root.toggleAttribute('data-light-appearance',!!sc.light);
    body.dataset.appearancePattern=recipe.pattern;body.dataset.appearanceMode=String(recipe.mode);body.dataset.appearanceScheme=recipe.scheme;
    body.dataset.appearanceProfile=recipe.profile;body.dataset.appearanceDensity=String(recipe.density);body.dataset.appearanceFraming=[recipe.x,recipe.y,recipe.rotation].join(',');body.dataset.appearanceVersion=String(plan.version);
    body.dataset.appearancePage=preview||committed;
    return {...recipe,...sc};
  }
  let current=apply();
  const refresh=()=>{current=apply();};
  win.addEventListener('superposition:recipe',refresh);win.addEventListener('resize',refresh);
  return {forState,get current(){return current;},get plan(){return plan;},setState(id){committed=id||'home';preview=null;refresh();},previewState(id){preview=id;refresh();},clearPreview(){preview=null;refresh();},refresh};
}
