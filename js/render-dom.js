/* SUPERPOSITION 2.0 content renderer.
   Pure string templates: browser runtime and tools/bake.mjs consume the same functions.
   The graphics system remains progressive enhancement; every factual string stays DOM text. */

export const FACET_ORDER = ['columns','tables','frame','surface','vector','lattice','clusters','orbit'];

export const FACET_META = Object.freeze({
  columns:{no:'01',short:'Finance',label:'Financial executive',domain:'finance',law:'allocation',law3:'ALLOCATION / CONSTRAINT / EQUILIBRIUM'},
  tables:{no:'02',short:'Restaurant',label:'Restaurant executive',domain:'restaurant',law:'flow',law3:'CAPACITY / FLOW / RHYTHM'},
  frame:{no:'03',short:'Construction',label:'Construction executive',domain:'construction',law:'structure',law3:'ASSEMBLY / LOAD / TOPOLOGY'},
  surface:{no:'04',short:'Investor',label:'Investor & trader',domain:'investor',law:'uncertainty',law3:'UNCERTAINTY / HORIZON / OPTIONALITY'},
  vector:{no:'05',short:'Entrepreneur',label:'Entrepreneur',domain:'entrepreneur',law:'emergence',law3:'BRANCH / RECOMBINE / EMERGE'},
  lattice:{no:'06',short:'AI / Engineering',label:'AI & computer engineering',domain:'ai',law:'signal',law3:'SIGNAL / RECURSION / COMPUTATION'},
  clusters:{no:'07',short:'Skills',label:'Skills',domain:'skills',law:'vector',law3:'CLUSTER / VECTOR / BRIDGE'},
  orbit:{no:'08',short:'Hobbies',label:'Hobbies',domain:'hobbies',law:'terrain',law3:'EXPLORE / ORBIT / TERRAIN'},
});

const esc=(s)=>String(s??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const byId=(data,id)=>data.facets.find(f=>f.id===id);

const metricsHTML=(metrics)=>metrics?.length?`<div class="metrics">${metrics.map(m=>`<span>${esc(m.k)} <b>${esc(m.v)}</b></span>`).join('')}</div>`:'';
const linksHTML=(links)=>links?.length?`<p class="dlinks">${links.map(l=>`<a href="${esc(l.href)}">${esc(l.label)}</a>`).join(' · ')}</p>`:'';

function dossierHTML(facetId,d,i){
  const bid=`db-${facetId}-${i}`,rid=`d-${facetId}-${i}`;
  const company=d.org?`, <em>${esc(d.org)}</em>`:'';
  const duration=d.span?`, <span class="dossier-duration">${esc(d.span)}</span>`:'';
  return `<article class="dossier">
<button class="role-row" type="button" aria-expanded="false" aria-controls="${rid}" id="${bid}"><span class="dossier-line"><b>${esc(d.title)}</b>${company}${duration}</span><i aria-hidden="true">+</i></button>
<div class="dossier-body" id="${rid}" role="region" aria-labelledby="${bid}">${(d.lines||[]).map(x=>`<p>${esc(x)}</p>`).join('')}${linksHTML(d.links)}${metricsHTML(d.metrics)}</div>
</article>`;
}
function skillDossierHTML(facetId,d,i){
  const bid=`db-${facetId}-${i}`,rid=`d-${facetId}-${i}`,t=d.tiers||{};
  const count=(t.core||[]).length+(t.working||[]).length+(t.familiar||[]).length;
  const run=[...(t.core||[]).map(s=>`<b>${esc(s)}</b>`),...(t.working||[]).map(s=>esc(s)),...(t.familiar||[]).map(s=>`<em>${esc(s)}</em>`)].join(', ');
  return `<article class="dossier" data-domain="${i}">
<button type="button" aria-expanded="false" aria-controls="${rid}" id="${bid}"><span>${esc(d.domain)}</span><small>${count} skills</small><i aria-hidden="true">+</i></button>
<div class="dossier-body" id="${rid}" role="region" aria-labelledby="${bid}"><p class="skillrun">${run}</p>${metricsHTML(d.related?.length?[{k:'related',v:d.related.join(' · ')}]:[])}</div>
</article>`;
}

export function homeHTML(identity){return `<h1>${esc(identity.name)}</h1>
<p class="positioning">${esc(identity.positioning)}</p>`}

export function headerHTML(identity){return `<a class="brand" href="/" aria-label="Home"><span class="brand-name">${esc(identity.name)}</span></a>
<nav class="utilities" aria-label="Utilities"><button type="button" data-ui="index" aria-expanded="false" aria-controls="indexOverlay">Index</button><a href="/resume/">Résumé</a><button type="button" data-ui="system" aria-expanded="false" aria-controls="systemPanel">System</button></nav>`}

export function facetHTML(facet){
  const meta=FACET_META[facet.id]||{no:'--',label:facet.name};
  const items=facet.id==='clusters'?(facet.domains||[]).map((d,i)=>skillDossierHTML(facet.id,d,i)):(facet.dossiers||[]).map((d,i)=>dossierHTML(facet.id,d,i));
  return `<div class="facet-kicker">${meta.no} / ${esc(meta.label).toUpperCase()}</div>
<h2>${esc(meta.label)}</h2>
<ol class="manifest">${(facet.manifest||[]).map(x=>`<li>${esc(x)}</li>`).join('')}</ol>
<div class="dossiers">${items.join('')}</div>`;
}

export function recordHTML(record){const intro=record?.intro?`<p class="record-intro">${esc(record.intro)}</p>`:'';return `<div class="facet-kicker">SELECTED CAREER RECORD / PRINTABLE</div><h2>Résumé</h2>${intro}<ol class="record-list">${(record.entries||[]).map(e=>`<li><time>${esc(e.span)}</time><div><b>${esc(e.line)}</b></div></li>`).join('')}</ol>`}

export function domainStripHTML(data){return FACET_ORDER.map(id=>{const f=byId(data,id),m=FACET_META[id];return `<a href="#view-${id}" data-facet="${id}"><span>${m.no}</span><b>${esc(m.short||f?.name||id)}</b></a>`}).join('')}
export function indexHTML(data){return FACET_ORDER.map(id=>{const f=byId(data,id),m=FACET_META[id];return `<a href="#view-${id}" data-facet="${id}" data-preview="${id}"><span>${m.no}</span><b>${esc(m.label||f?.name||id)}</b><i>${esc(m.law3)}</i></a>`}).join('')}
export function footerHTML(){return ``}

export function renderAll(data,doc){
  doc.getElementById('view-home').innerHTML=homeHTML(data.identity);
  for(const id of FACET_ORDER){const f=byId(data,id),el=doc.getElementById(`view-${id}`);if(f&&el)el.innerHTML=facetHTML(f)}
  doc.getElementById('view-record').innerHTML=recordHTML(data.record);
  doc.querySelector('header.site-head').innerHTML=headerHTML(data.identity);
  doc.querySelector('.domain-strip').innerHTML=domainStripHTML(data);
  doc.querySelector('.index-list').innerHTML=indexHTML(data);
  doc.querySelector('footer.site-foot').innerHTML=footerHTML();
}
