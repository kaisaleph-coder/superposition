/* SUPERPOSITION content renderer (PLAN §4.2, ADR-004).
   Pure string templates — no DOM APIs — so tools/bake.mjs (Node) and the browser
   share one implementation and the baked no-JS layer cannot drift from runtime.
   Skills rule (§4.2, binding): three-tier typeset prose + count chips only —
   no bars, no percentages, no clouds, no radar. */

export const FACET_ORDER = ["columns", "frame", "lattice", "surface", "clusters", "vector", "orbit"];

const esc = (s) =>
  String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const chips = (metrics) =>
  metrics && metrics.length
    ? `<div class="chips">${metrics.map((m) => `<span class="chip">${esc(m.k)} <b>${esc(m.v)}</b></span>`).join("")}</div>`
    : "";

const linksHTML = (links) =>
  links && links.length
    ? `<p class="dlinks">${links.map((l) => `<a href="${esc(l.href)}">${esc(l.label)}</a>`).join(" · ")}</p>`
    : "";

export function homeHTML(identity) {
  return `<p class="eyebrow">Superposition — all states resident</p>
<h1>${esc(identity.name)}</h1>
<p class="positioning">${esc(identity.positioning)}</p>
<p class="hint">Choose a mark to <b>collapse the field</b> into one state. Keys <b>1–7</b> · <b>Esc</b> returns · <b>r</b> full record.</p>`;
}

function dossierHTML(facetId, d, i) {
  const bid = `db-${facetId}-${i}`, rid = `d-${facetId}-${i}`;
  return `<div class="dossier">
<button aria-expanded="false" aria-controls="${rid}" id="${bid}">
<span class="t">${esc(d.title)}</span><span class="m">${esc(d.org)}${d.org && d.span ? " · " : ""}${esc(d.span)}</span>
</button>
<div class="body" id="${rid}" role="region" aria-labelledby="${bid}"><div class="body-in">
${(d.lines || []).map((p) => `<p>${esc(p)}</p>`).join("\n")}
${linksHTML(d.links)}${chips(d.metrics)}
</div></div>
</div>`;
}

function domainDossierHTML(facetId, d, i) {
  const bid = `db-${facetId}-${i}`, rid = `d-${facetId}-${i}`;
  const t = d.tiers || {};
  const count = (t.core || []).length + (t.working || []).length + (t.familiar || []).length;
  const run = [
    ...(t.core || []).map((s) => `<span class="s1">${esc(s)}</span>`),
    ...(t.working || []).map((s) => `<span class="s2">${esc(s)}</span>`),
    ...(t.familiar || []).map((s) => `<span class="s3">${esc(s)}</span>`),
  ].join(", ");
  const rel = d.related && d.related.length ? [{ k: "related", v: d.related.join(" · ") }] : [];
  return `<div class="dossier" data-domain="${i}">
<button aria-expanded="false" aria-controls="${rid}" id="${bid}">
<span class="t">${esc(d.domain)}</span><span class="m">${count} skills</span>
</button>
<div class="body" id="${rid}" role="region" aria-labelledby="${bid}"><div class="body-in">
<p class="skillrun">${run}</p>
${chips(rel)}
</div></div>
</div>`;
}

export function facetHTML(facet) {
  const isClusters = facet.id === "clusters";
  const items = isClusters
    ? (facet.domains || []).map((d, i) => domainDossierHTML(facet.id, d, i))
    : (facet.dossiers || []).map((d, i) => dossierHTML(facet.id, d, i));
  const legend = isClusters
    ? `\n<li class="legend">Type weight encodes tier — <b>core</b>, working, familiar. Open a domain to collapse its cluster in the field.</li>`
    : "";
  return `<div class="eyebrow"><a class="back" href="#/">◂ superposition</a> <h2>${esc(facet.name)}</h2></div>
<ul class="manifest">
${(facet.manifest || []).map((l) => `<li>${esc(l)}</li>`).join("\n")}${legend}
</ul>
<div class="dossiers">
${items.join("\n")}
</div>`;
}

export function recordHTML(record) {
  return `<div class="eyebrow"><a class="back" href="#/">◂ superposition</a> <h2>Full record</h2></div>
<ol class="record">
${(record.entries || []).map((e) => `<li><span class="span">${esc(e.span)}</span><span class="line">${esc(e.line)}</span></li>`).join("\n")}
</ol>`;
}

export function footerHTML(identity) {
  const links = (identity.links || [])
    .map((l) => `<a href="${esc(l.href)}">${esc(l.label)}</a>`)
    .join("");
  return `${links}<span>${esc(identity.location)}</span><a href="#/record" data-record-link>Full record</a>`;
}

/* Browser entry: re-render every view from data (source of truth for JS visitors). */
export function renderAll(data, doc) {
  doc.getElementById("view-home").innerHTML = homeHTML(data.identity);
  for (const f of data.facets) {
    const el = doc.getElementById(`view-${f.id}`);
    if (el) el.innerHTML = facetHTML(f);
  }
  doc.getElementById("view-record").innerHTML = recordHTML(data.record);
  doc.querySelector("footer .row").innerHTML = footerHTML(data.identity);
}
