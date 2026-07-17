# ADR-004 — Content layer: baked static HTML + runtime re-render from data

**Status:** accepted · 2026-07-17 · P1

## Problem
Three PLAN requirements are in tension with "no build step" (§5.1):
- §10.3 / §2.1 `static`: JS-disabled visitors get **full content**.
- §6 loading order: "content HTML renders complete (no JS required)".
- §13 / handoff: owner content swap is **data-only** (`content/resume.data.js`), zero code changes.
Full content without JS requires the content to exist in `index.html`; a data-only swap
requires `resume.data.js` to be the source of truth. With no build step, both can't be
satisfied by one artifact alone.

## Decision
1. `index.html` ships with the **complete semantic content baked in** (home, all 7 facets,
   record) — real DOM text, ATS/Ctrl-F/screen-reader/no-JS complete. Sections stack in
   document order when JS is absent (`html.js` gates view hiding, set by an inline script).
2. At runtime `js/render-dom.js` **re-renders every view from `window.__RESUME__`** before
   first paint (synchronous in load order per §6). For JS visitors (~everyone), the data file
   is the single source of truth — a data-only swap fully updates the experienced site.
3. `tools/bake.mjs` (dev tooling, same class as budget.mjs) regenerates the baked sections
   from `resume.data.js` so the no-JS layer cannot drift. It is a content-sync helper, not a
   site build step: the site runs identically without ever running it.
4. QA asserts no drift: rendered text content (JS on) ≡ baked text content (JS off) per view.

## Consequences
- Owner swap procedure (README): edit `resume.data.js` → optionally `node tools/bake.mjs`
  (keeps the no-JS mirror fresh) → push. Skipping bake affects only no-JS visitors.
- render-dom and bake share one template shape; bake imports the same rendering rules
  (ported to Node) — divergence is caught by the QA equality test, not by review.
