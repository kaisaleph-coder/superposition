# P1 receipt — content layer

**Date:** 2026-07-17 · phase P1 · placeholder-ship waiver PRE-AUTHORIZED (owner, v1.2).

## Built
- Full semantic HTML from schema — baked static content for all 9 views (home, 7 facets,
  record) + runtime re-render from `content/resume.data.js` (ADR-004; `tools/bake.mjs` syncs).
- `css/main.css` — §3 design system: iron-gall palette, Archivo VF (wght 100–900 × wdth
  62–125, verified axes) + Fragment Mono ASCII subset, galley layout, rail, mobile bar,
  reduced-motion, dark-scheme base. `css/print.css` — §8 one-pager.
- Router/state machine (`js/router.js`) — §5.6 DOM contract, hash deep links, keys 1–7/←→/
  Esc/r/p/`.`, dossier expanders with aria-expanded + data-state="dossier".
- Static ground `assets/field-static.svg` (generated, deterministic — tools/gen-static.mjs,
  2,595 dots sampled from all 7 attractor generators), marks ×7, favicon (seven-dot, one
  Klein — updated from PLAN's v1.0 "five-dot" note to match the v1.1 seven-state model),
  404.html, JSON-LD Person (placeholder).
- Fonts (Ladder B, top branch): Archivo VF 88.0 KB + Fragment Mono subset 4.7 KB
  (pyftsubset U+0020-007E + · ± – — Δ → ©, tnum kept) = **92.7 KB ≤ 105 KB cap**.

## Gate checks (PLAN §11 P1)
- **Lighthouse ≥ 95 with field disabled:** performance **96**, accessibility **100**,
  best-practices **96**, SEO **100** (`docs/receipts/P1-lighthouse.report.{json,html}`,
  chromium headless, default mobile throttling). FCP 1.6 s · LCP 2.6 s · TBT 0 ms · CLS 0.
  Note: `errors-in-console` audit flags the expected 404 of `js/field/engine.js` (P2
  deliverable; dynamic import fails → caught → T0 static path, by design at P1).
- **Print snapshot approved:** `tests/print.spec.js-snapshots/print-one-pager-desktop.png`
  baseline; print media hides field/rail, opens all dossiers, record renders. VERIFIER
  reviewed the print DOM assertions; visual baseline committed.
- **No-JS walkthrough:** Playwright `javaScriptEnabled:false` — full content visible for all
  9 views, `data-tier="0"` / `data-renderer="static"` baked defaults, static SVG ground.
- **Tests:** 25 passed, 1 skipped (print snapshot on mobile — desktop artifact), 0 failed.
  Suites: content integrity, ADR-004 drift gate (baked ≡ runtime, textContent-normalized),
  state machine (keys/arrows/deep-links/back-forward/dossier/rail/unknown-hash), print.
- **Budget:** TOTAL 419.4 KB gz / 900 · vendor 287.3 / 340 · fonts 92.8 / 105 ·
  HTML+CSS+app JS 12.5 / 60 — exit 0.

## Deviations
- Lighthouse CLI exits 1 on Windows tmp-dir cleanup (`rmSync` file lock) AFTER writing full
  reports — treated as tooling noise, reports are the receipt (Ladder C not needed at P1).
- Drift test uses textContent equality (rendering-independent) rather than innerText.
