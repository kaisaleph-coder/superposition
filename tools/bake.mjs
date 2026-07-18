#!/usr/bin/env node
/* SUPERPOSITION bake (ADR-004) — regenerate index.html's static content sections
   from content/resume.data.js using the SAME templates the browser uses
   (js/render-dom.js). Dev tooling, not a site build step: the site runs without it;
   this only keeps the no-JS/ATS layer in sync after a data edit.
   Usage: node tools/bake.mjs */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join, dirname } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const { homeHTML, facetHTML, recordHTML, footerHTML, FACET_ORDER } = await import(
  new URL("../js/render-dom.js", import.meta.url)
);

// content/resume.data.js is a classic script assigning window.__RESUME__
const w = {};
new Function("window", readFileSync(join(ROOT, "content/resume.data.js"), "utf8"))(w);
const data = w.__RESUME__;
if (!data) throw new Error("content/resume.data.js did not set window.__RESUME__");

const sections = {
  "view-home": homeHTML(data.identity),
  "view-record": recordHTML(data.record),
  footer: footerHTML(data.identity),
};
for (const f of data.facets) sections[`view-${f.id}`] = facetHTML(f);

// rail: fixed facet list + checked-in mark SVGs (assets/marks are the source)
sections.rail = data.facets
  .map((f, i) => {
    const svg = readFileSync(join(ROOT, `assets/marks/${f.id}.svg`), "utf8").trim();
    return `<a href="#/${f.id}" data-facet="${f.id}" aria-label="${f.name}" data-key="${i + 1}">${svg}<span class="lbl">${f.name}</span></a>`;
  })
  .join("\n  ");

const htmlPath = join(ROOT, "index.html");
let html = readFileSync(htmlPath, "utf8");
let missing = [];
for (const [id, content] of Object.entries(sections)) {
  const re = new RegExp(`(<!--BAKE:${id} BEGIN-->)[\\s\\S]*?(<!--BAKE:${id} END-->)`);
  if (!re.test(html)) { missing.push(id); continue; }
  html = html.replace(re, `$1\n${content}\n    $2`);
}

// §6: inline critical CSS from css/main.css (comment markers inside <style>);
// urls are relative to css/ — rebase them to the document root
const css = readFileSync(join(ROOT, "css/main.css"), "utf8").trim().replace(/url\("\.\.\//g, 'url("');
const cssRe = /(\/\*BAKE:css BEGIN\*\/)[\s\S]*?(\/\*BAKE:css END\*\/)/;
if (!cssRe.test(html)) missing.push("css");
else html = html.replace(cssRe, `$1\n${css}\n$2`);
if (missing.length) throw new Error(`markers not found: ${missing.join(", ")}`);
writeFileSync(htmlPath, html);
console.log(`baked ${Object.keys(sections).length} sections into index.html (facets: ${FACET_ORDER.join(", ")})`);
