# SUPERPOSITION

One GPU particle field is the whole visual identity: ~131K particles that never leave the
screen, reorganizing into eight attractor states — one per professional domain. At rest
the field is the blend of all eight at low amplitude; navigation collapses it into one.
Each particle is permanently tinted by its home domain (pale hues — the text always wins);
collapsed views cast the field toward that domain's color.

**All content in this build is `[PLACEHOLDER]`.** Real content is a data-only swap (below).

## Stack
Static site, no framework, no build step. Hand-authored ES modules; three.js r185
(WebGPURenderer + TSL compute, automatic WebGL2 fallback) vendored in `/vendor` — zero
third-party requests at runtime, no analytics. All text is real DOM text: ATS parsers,
screen readers, and Ctrl-F are first-class.

## Run locally
```
python -m http.server 8080     # from repo root (any static server works)
```
Open http://localhost:8080. Useful flags: `?seed=1` deterministic test mode (freezes at
sim-frame 240; add `&run=1` to keep running) · `?force=webgl` forces the WebGL2 backend.

Keys: `1–8` domains · `←/→` cycle · `Esc` home · `r` full résumé · `p` print · `.` pause.
Also: horizontal swipe (touch) and wheel-past-content-edge (desktop) page between domains;
subtle mouse/gyro parallax (gyro is tap-to-enable on iOS).

## Content update (owner)
1. Edit `content/resume.data.js` — the single source of truth (schema §4.2 in PLAN.md).
2. `node tools/bake.mjs` — re-syncs the static no-JS/ATS layer inside `index.html`.
3. Push. Nothing else changes; the print view and every facet render from the same data.

## Dev tooling (optional, gitignored)
Node ≥ 20. `npm install`, then:
- `node tools/budget.mjs` — gzip budget gate (≤ 900 KB total; caps per category)
- `npx playwright test --config tests/playwright.config.js` — full QA matrix
  (`npx playwright install chromium` once)
- `node tools/soak.mjs 5` — 5-minute memory/fps soak against a running local server
- `node tools/og.mjs` — regenerate the OG card from the live engine
- `node tools/gen-static.mjs` — regenerate the T0 static-field SVG

## Licenses
- three.js — MIT (`vendor/THREE-LICENSE.md`, pinned r185)
- Archivo & Fragment Mono — SIL OFL 1.1, self-hosted subsets in `assets/fonts/`

## Accessibility & fallbacks
Canvas is `aria-hidden`; the DOM is the complete experience. No JS / reduced motion /
init failure → static prerendered field (SVG) with full content and navigation. Fully
keyboard operable; print (`p`) collapses to a one-page typeset resume.
