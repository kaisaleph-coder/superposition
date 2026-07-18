# P2 receipt — field engine

> **Superseded note (P3):** the P3 legibility gate exposed silent WebGL-backend compute
> failures invisible to the checks below; the sim was re-architected (ADR-005) and every
> WebGL number re-taken — see P3-choreography.md. This receipt stands as the historical
> record of what P2 verified and how the gap slipped through (structure was never
> asserted, only motion/fps/pixels).

**Date:** 2026-07-17 · phase P2 · branch per ADR-001 (single TSL codebase, both backends).

## Built (§5.3 file spec)
- `js/field/engine.js` — FieldEngine public surface: init(canvas, opts) → setState,
  setWeights (real weighted-blend kernel), setPointer, setScroll, step (deterministic
  manual frames), pause/resume/togglePause, dispose, state/tier/renderer. DOM contract
  attrs: data-renderer/tier/paused/fps/settled/field-boot-ms/scroll (§5.6).
- `js/field/attractors.js` — 7 pure generators ported from the approved preview;
  citizenship ∝ facet content mass (§2.3); CLUSTERS data-driven with per-particle
  domain ids (§2.4). Packed 7·N target buffer.
- `js/field/sim.tsl.js` — kernels: init (seeded noise cloud), retarget (snapshot lerp),
  update (spring + analytic curl of the preview's sin potential [divergence-free, same
  look] + pointer repulsor; semi-implicit Euler, dt-normalized damping), blendWeights.
  MODES table ported verbatim from the preview.
- `js/field/render.tsl.js` — instanced sprites; size ∝ clamp(speed); color
  mix(ink, klein-live, charge); clusters sub-collapse charge; dark-scheme pale ink.
- `js/field/pointer.js` — pointer→world unprojection onto the origin plane; touch drag.
- Courtesies (§2.5): pause on document.hidden (incl. load-while-hidden), pause when
  canvas exits viewport (IntersectionObserver), `.` key, dossier slow ×0.5, record freeze.
- Boot: uniform noise → superposition over 2.0 s; skipped on reduced-motion and repeat
  visits (sessionStorage). Deterministic test mode: `?seed` → fixed dt 1/60, sim-frame
  clock, auto-freeze at frame 240 (`data-settled`), `&run=1` keeps running.

## Gate checks (PLAN §11 P2)
- **fps per tier (60/30 targets):**
  - T1 webgpu 131,072 (browser pane, real WebGPU, step-API): 240 frames in 109 ms ≈ 0.45 ms/frame — vsync-equivalent ≫ 60 fps; pixel-proof 14.7% canvas coverage after step.
  - T3 webgl 65,536 (headless chromium, rAF-locked): **60 fps**, boot 692–805 ms (< 2.5 s cap §6).
  - Mobile emulation (Pixel 7 project): perf smoke median ≥ 30 fps → PASS (suite).
  - rAF/vsync note: pane is permanently hidden (ADR-001 methodology) — rAF numbers come
    from headless chromium; pane numbers are throughput.
- **Fallback + T0 verified:** `?force=webgl` → data-renderer="webgl", tier 3/4 (spec);
  reduced-motion → data-tier="0" static, engine never loads (spec); no-JS → full content
  (P1 spec); engine init failure path → caught → T0 (exercised at P1 when engine.js
  didn't exist yet — Lighthouse run recorded the catch path working).
- **Memory stable, 5-min soak:** `tools/soak.mjs 5` — 30 samples: heap flat 17.4 MB,
  first-third → last-third **×1.000** (limit 1.15), median fps **60** (limit ≥50).
  Verbatim tail: `heap first-third 17.4MB → last-third 17.4MB (×1.000); median fps 60 · SOAK PASS`.
- **Tests:** field.spec.js 10/10 green (boot, force-webgl, reduced-motion, perf smoke
  desktop+mobile, pause toggle) after adding GPU launch args to the Playwright config
  (headless needs --enable-unsafe-webgpu/--use-angle=d3d11; probe-verified).
- **Budget:** re-run below at commit time — app JS grew by the field modules only.

## Deviations
- WebGPU-tier fps measured as GPU throughput (hidden-pane rAF limitation) — 10×+ margin
  makes the vsync question moot; T3 rAF-locked 60 fps stands as the vsync receipt.
- Downshift proof deferred to P3 gate (choreography.spec.js CDP-throttle test written).
- Scroll integration (§2.5, P3 scope) landed during the soak idle window — phase-order
  note; it is gated at P3, not here.
