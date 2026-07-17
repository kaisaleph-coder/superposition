# P0 receipt — foundations & budget

**Date:** 2026-07-17 · phase P0 · `node tools/budget.mjs` verbatim output below.

## Vendor decision inputs (measured, gzip level 9)
| candidate file (three r185) | raw KB | gzip KB |
|---|---|---|
| three.webgpu.min.js | 652.2 | 180.9 |
| three.core.min.js (imported relatively by both builds) | 376.4 | 99.1 |
| three.tsl.min.js | 23.1 | 6.5 |
| three.module.min.js (classic branch, not taken) | 357.0 | 84.9 |

**Vendored set (WebGPU/TSL branch per ADR-001): 286.5 KB gzip ≤ 340 KB cap.**
(The 287.3 KB "vendor" line below additionally counts THREE-LICENSE.md + PINNED.md, which ship in /vendor.)

## budget.mjs output (P0 state)
```
file                                                raw       gzip
vendor/three.webgpu.min.js                     652.2 KB   180.9 KB
vendor/three.core.min.js                       376.4 KB    99.1 KB
vendor/three.tsl.min.js                         23.1 KB     6.5 KB
content/resume.data.js                           4.3 KB     1.4 KB
vendor/THREE-LICENSE.md                          1.1 KB     0.7 KB
js/field/tier.js                                 1.1 KB     0.6 KB
index.html                                       0.6 KB     0.4 KB
vendor/PINNED.md                                 0.2 KB     0.2 KB
------------------------------------------------------------------
TOTAL (gzip, cold load)          289.7 KB  cap 900 KB  ok
vendor three.js                  287.3 KB  cap 340 KB  ok
fonts                              0.0 KB  cap 105 KB  ok
HTML + CSS + app JS                1.0 KB  cap 60 KB  ok
```
Exit code 0. Headroom for P1–P4 (fonts + app + assets): ~610 KB gzip.

## P0 gate checklist (PLAN §11)
- [x] Page serves — python http.server 8080; `/` (stub) and `/tools/spike.html` load; spike ran end-to-end in-browser.
- [x] Budget report runs — output above, exit 0.
- [x] ADR-001 decided with measured numbers — see ADR-001 (single TSL codebase, both backends).
- [x] Vendor gzip size recorded — 286.5 KB (set) / 287.3 KB (with license+pin docs).
- [x] Tier detection written — js/field/tier.js (§5.4 map + downshift).
- [x] Placeholder data present — content/resume.data.js (seed, links empty).

## Environment receipts
- Node v24.18.0 portable (dev-only, scratchpad; not committed). npm 11.16.0. three pinned 0.185.1.
- Browser pane: Chromium with working WebGPU (`navigator.gpu` present; backend `webgpu` confirmed) and WebGL2.
- Privacy sweep at seed: case-insensitive `git grep` for the owner name-fragment over HEAD → no matches (sweep folded into ADR-002/seed amend; the fragment itself is deliberately not written down here).
