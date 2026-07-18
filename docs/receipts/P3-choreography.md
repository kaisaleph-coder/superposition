# P3 receipt — choreography

**Date:** 2026-07-17 · phase P3 · skills-counts placeholder waiver PRE-AUTHORIZED (owner).

## The gate that earned its keep
The silhouette legibility check (risk register: "attractors read as blobs, not glyphs")
caught that the entire field was broken on the WebGL backend — five distinct silent
failure modes in three r185's WebGL compute path (full bisection log + final architecture
in ADR-005). The engine was redesigned mid-P3: eight static per-state target buffers +
eight per-state update kernels; retarget = CPU kernel switch; morphs = spring flight
paced by CPU-eased mode params. All prior WebGL receipts re-taken. This receipt's
numbers are from the final design.

## Gate checks (PLAN §11 P3)
- **All transitions < 1.3 s and readable:** state switch flips the DOM contract
  immediately (spec assertion < 1300 ms); the field morph is a spring flight whose mode
  easing runs BLEND_MS = 1150 ms < 1.3 s; convergence to silhouette measured at
  ≈1.1 s (k = 5 equilibrium; convergence data in ADR-005 verification).
- **State-machine spec green:** state.spec.js — keys 1–7/←→/Esc/r, deep links, history
  back/forward, dossier aria/data-state, rail aria-current, unknown-hash fallback
  (6 scenarios × desktop+mobile).
- **Downshift logic proven:** choreography.spec.js — CDP CPU throttle 40× → sampled
  fps < 45 for 3 consecutive seconds → data-tier drops exactly one §5.4 step (3→4 in
  headless webgl); recovers with no further drops after unthrottle.
- **Scroll integration (§2.5):** scroll progress reaches the engine (data-scroll test
  hook in seed mode); camera yaw ±8° and spring tighten ×(1+0.35p) applied in-engine.
- **Deep links:** field.spec.js + state.spec.js (also P1).
- **Silhouette legibility (risk register):** all seven attractors screenshotted settled
  at 1440×900 (seed 1, frame 420) and reviewed: COLUMNS staggered skyline ✓, FRAME
  post-and-beam with unfinished top ✓, LATTICE node-edge graph with edge streams ✓,
  SURFACE volatility sheet ✓, CLUSTERS domain spheres + inter-domain filament (2
  placeholder domains) ✓, VECTOR scattered-origins→rising-spiral ✓, ORBIT interleaved
  Lissajous rings ✓. Home = citizenship cloud, "structure without resolution" (§2.3),
  matching the approved preview's field behavior.
- **Convergence receipts:** WebGL facet error 0.026–0.029 · WebGPU 0.028 (vs analytic
  generators, 1000-particle sample, frame 420).
- **Deterministic test mode:** SETTLE_FRAME raised 240 → 420 (7 sim-seconds) so
  fixed-seed screenshots capture settled structure, not flight blur (mid-flight error
  was 0.151 at frame 240). Visual suite re-baselined; two consecutive full runs
  pixel-identical.

- **Soak re-certified on the final engine:** `tools/soak.mjs 5` — heap first-third
  18.4 MB → last-third 18.4 MB (**×1.000**, limit 1.15), median fps **60** — SOAK PASS.
- **Budget at gate:** 431.2 KB gz total / 900 · vendor 287.3/340 · fonts 92.8/105 ·
  HTML+CSS+app JS 24.2/60 — exit 0.

## Deviations
- Morph mechanism: spring flight (no from/to target lerp) — behavioral fidelity
  argument + backend constraints in ADR-005. Transition timing unchanged.
- setWeights on WebGL approximates with dominant-weight state (ADR-005; unused by the
  site's state machine, which is strictly one-hot).
- window.__engineDebug exposed ONLY under ?seed (dev/QA tooling, e.g. tools/page-debug.mjs);
  Playwright specs still assert exclusively on the DOM contract (§5.6).
