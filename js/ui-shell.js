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

  const background=new Map();
  function isolateBackground(open){
    if(open){for(const node of doc.querySelectorAll('main,.site-head,.domain-strip,.site-foot,.state-axis,#sand-dial')){
      if(!background.has(node))background.set(node,{inert:node.inert,hidden:node.getAttribute('aria-hidden')});node.inert=true;node.setAttribute('aria-hidden','true');
    }}else{for(const [node,previous] of background){node.inert=previous.inert;if(previous.hidden===null)node.removeAttribute('aria-hidden');else node.setAttribute('aria-hidden',previous.hidden);}background.clear();}
  }
  const backgroundObserver=new MutationObserver(()=>{if(body.dataset.index==='open')isolateBackground(true);});backgroundObserver.observe(body,{childList:true});
  let returnFocus=null;
  function setPanel(panel,btn,open){if(!panel)return;panel.setAttribute('aria-hidden',String(!open));panel.inert=!open;btn?.setAttribute('aria-expanded',String(open))}
  function closeAll({clearPreview=true,restoreFocus=false}={}){
    const target=restoreFocus?returnFocus:null;
    isolateBackground(false);delete body.dataset.index;
    if(target)target.focus?.();
    else if([index,contact,system].some(panel=>panel?.contains(doc.activeElement)))doc.querySelector('main')?.focus?.({preventScroll:true});
    setPanel(index,indexBtn,false);setPanel(contact,contactBtn,false);setPanel(system,systemBtn,false);
    delete body.dataset.index;
    if(clearPreview)getEngine?.()?.clearPreview?.();
    returnFocus=null;
    target?.focus?.();
  }
  function toggle(panel,btn,name){
    const open=panel?.getAttribute('aria-hidden')!=='false';
    if(!open){closeAll({restoreFocus:true});return}
    closeAll();returnFocus=btn;setPanel(panel,btn,true);
    if(name==='index')body.dataset.index='open';
    panel?.querySelector('a,button')?.focus?.();
    if(name==='index')isolateBackground(true);
  }
  setPanel(index,indexBtn,false);setPanel(contact,contactBtn,false);setPanel(system,systemBtn,false);
  indexBtn?.addEventListener('click',()=>toggle(index,indexBtn,'index'));
  contactBtn?.addEventListener('click',()=>toggle(contact,contactBtn,'contact'));
  systemBtn?.addEventListener('click',()=>toggle(system,systemBtn,'system'));
  closeIndex?.addEventListener('click',()=>closeAll({restoreFocus:true}));
  closeContact?.addEventListener('click',()=>closeAll({restoreFocus:true}));
  closeSystem?.addEventListener('click',()=>closeAll({restoreFocus:true}));

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
    if(e.key==='Tab'&&body.dataset.index==='open'){
      const controls=[...index.querySelectorAll('a[href],button,[tabindex]')].filter(el=>!el.disabled&&el.tabIndex>=0&&el.getClientRects().length);
      const first=controls[0],last=controls.at(-1),active=doc.activeElement;
      if(!index.contains(active)||(e.shiftKey&&active===first)||(!e.shiftKey&&active===last)){e.preventDefault();(e.shiftKey?last:first)?.focus();}return;
    }
    if(e.key!=='Escape')return;
    if(index?.getAttribute('aria-hidden')==='false'||contact?.getAttribute('aria-hidden')==='false'||system?.getAttribute('aria-hidden')==='false'){
      e.preventDefault();e.stopImmediatePropagation();closeAll({restoreFocus:true});
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

  return {closeAll,updateSystem,dispose(){closeAll();backgroundObserver.disconnect();clearInterval(timer);removeEventListener('superposition:recipe',onRecipe)}};
}
