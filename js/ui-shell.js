/* SUPERPOSITION 2.0 UI shell: Index/Contact/System overlays and renderer previews.
   This module owns presentation state only; route state remains in router.js. */
export function createUIShell(doc,{getEngine}={}){
  const body=doc.body;
  const index=doc.getElementById('indexOverlay');
  const contact=doc.getElementById('contactPanel');
  const system=doc.getElementById('systemPanel');
  const indexBtn=doc.querySelector('[data-ui="index"]');
  const contactBtn=doc.querySelector('[data-ui="contact"]');
  const systemBtn=doc.querySelector('[data-ui="system"]');
  const closeIndex=doc.querySelector('[data-ui-close="index"]');
  const closeContact=doc.querySelector('[data-ui-close="contact"]');
  const closeSystem=doc.querySelector('[data-ui-close="system"]');

  function setPanel(panel,btn,open){if(!panel)return;panel.setAttribute('aria-hidden',String(!open));panel.inert=!open;btn?.setAttribute('aria-expanded',String(open))}
  function closeAll({clearPreview=true}={}){setPanel(index,indexBtn,false);setPanel(contact,contactBtn,false);setPanel(system,systemBtn,false);delete body.dataset.index;if(clearPreview)getEngine?.()?.clearPreview?.()}
  function toggle(panel,btn,name){const open=panel?.getAttribute('aria-hidden')!=='false';closeAll();setPanel(panel,btn,open);if(name==='index'&&open)body.dataset.index='open';if(open)panel?.querySelector('a,button')?.focus?.()}
  setPanel(index,indexBtn,false);setPanel(contact,contactBtn,false);setPanel(system,systemBtn,false);
  indexBtn?.addEventListener('click',()=>toggle(index,indexBtn,'index'));
  contactBtn?.addEventListener('click',()=>toggle(contact,contactBtn,'contact'));
  systemBtn?.addEventListener('click',()=>toggle(system,systemBtn,'system'));
  closeIndex?.addEventListener('click',()=>closeAll());
  closeContact?.addEventListener('click',()=>closeAll());
  closeSystem?.addEventListener('click',()=>closeAll());

  for(const a of doc.querySelectorAll('.domain-strip a')){
    a.addEventListener('focus',()=>a.setAttribute('data-focus-ring',''));
    a.addEventListener('blur',()=>a.removeAttribute('data-focus-ring'));
  }

  for(const a of doc.querySelectorAll('.index-list a[data-preview]')){
    const preview=()=>getEngine?.()?.previewState?.(a.dataset.preview);
    const clear=()=>getEngine?.()?.clearPreview?.();
    a.addEventListener('pointerenter',preview,{passive:true});
    a.addEventListener('focus',preview);
    a.addEventListener('pointerleave',clear,{passive:true});
    a.addEventListener('blur',clear);
    a.addEventListener('click',()=>closeAll({clearPreview:false}));
  }

  doc.addEventListener('keydown',e=>{
    if(e.key!=='Escape')return;
    if(index?.getAttribute('aria-hidden')==='false'||contact?.getAttribute('aria-hidden')==='false'||system?.getAttribute('aria-hidden')==='false'){
      e.preventDefault();e.stopImmediatePropagation();closeAll();indexBtn?.focus();
    }
  },true);
  addEventListener('hashchange',()=>closeAll());

  const ids={law:'sysLaw',seed:'sysSeed',recipe:'sysRecipe',topology:'sysTopology',layers:'sysLayers',cost:'sysCost',chromatic:'sysColor',primitives:'sysPrims',fps:'sysFps',renderer:'sysRenderer'};
  function updateSystem(){
    const e=getEngine?.(),d=e?.getDebugState?.()||{};
    const values={...d,fps:body.dataset.fps||'—',renderer:body.dataset.renderer||'static'};
    for(const [k,id] of Object.entries(ids)){const el=doc.getElementById(id);if(el)el.textContent=values[k]??'—'}
  }
  const onRecipe=()=>updateSystem();addEventListener('superposition:recipe',onRecipe);
  const timer=setInterval(updateSystem,800);updateSystem();
  doc.querySelector('[data-system-action="next"]')?.addEventListener('click',()=>{getEngine?.()?.nextRecipe?.();updateSystem()});
  doc.querySelector('[data-system-action="pause"]')?.addEventListener('click',()=>{getEngine?.()?.togglePause?.();updateSystem()});

  return {closeAll,updateSystem,dispose(){clearInterval(timer);removeEventListener('superposition:recipe',onRecipe)}};
}
