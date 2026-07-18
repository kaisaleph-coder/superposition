# ADR-005 — WebGL-backend compute constraints & final engine architecture (P3)

**Status:** accepted · 2026-07-17 · found during the P3 silhouette legibility gate

## How it surfaced
The P3 legibility screenshot showed the field as a single dot / structureless blob on the
WebGL backend while WebGPU was perfect. The P0 spike had passed on WebGL because its
kernels are trivial (2 buffers, no cross-kernel flow) — the failure class only appears in
multi-kernel pipelines, precisely where a spike wouldn't look. Every prior WebGL "green"
(P2 60 fps headless, early field specs) was re-taken after the fix.

## Findings (three r185 WebGL2 backend, all empirically bisected in-browser, all silent)
1. **≥5 distinct storage buffers in one compute kernel → the kernel no-ops.** 4 works
   (every mix tried); 5 fails (every mix tried). No exception, no console output.
2. **Compute-stage storage reads are attribute-backed** — only `buffer[instanceIndex]`
   is real. Any computed index silently reads other elements (bisected with per-block
   sentinel data; uniform-valued test buffers mask this, which fooled two earlier repros).
3. **`needsUpdate` re-upload is ignored for storage buffers** — contents are effectively
   immutable after creation (initial-data upload works; WebGPU honors re-upload).
4. **`uint`/`int`-typed uniforms are unreliable in compute** (float uniforms are solid).
5. **Buffers TF-written by one kernel and read by another interleave stale ping-pong
   halves** — readback showed alternating fresh/stale elements; same-task rewrite order
   also matters. Cross-kernel GPU data flow is not dependable.

## Decision — final engine architecture (Ladder A, still single TSL codebase)
Everything the GPU will ever target is **baked at boot** into eight static vec4 buffers
(7 attractors + citizenship home §2.3; CLUSTERS domain id in w), and the sim compiles
**eight per-state update kernels**, each hard-bound to its state's static buffer
(static read + pos/vel read-modify-write = 3 buffers — the one pattern proven solid on
both backends). Retargeting is a CPU-side kernel switch: zero GPU dispatches, zero
inter-kernel data flow. Morphs are the spring flight itself, paced by the CPU-eased
per-state mode parameters (k/noise/damp/pitch) — "flight, not tween" (§5.3), replacing
the preview's explicit from/to target lerp (visually equivalent; ADR fidelity note).
`setWeights` keeps true Σ w·T blending via a dedicated kernel on WebGPU; on WebGL it
approximates with the dominant-weight state (documented API deviation — the site's state
machine only ever uses one-hot states, so nothing user-visible differs).

## Verification (final design)
- WebGL T3 65,536: facet convergence mean pos error 0.026–0.029 vs analytic attractors;
  all seven silhouettes legible in screenshots (P3 receipt set).
- WebGPU T1 131,072: lattice err 0.028; clusters sub-collapse + weighted blend exercised;
  0.28 ms/frame stepped.
- Kernel-count cost: 8 update kernels + init (+1 WebGPU blend) — lazy compile, ~ms each.

## Rules recorded for future kernels
≤4 buffers per kernel · instanceIndex reads only · no re-uploads · float uniforms only ·
no kernel-to-kernel storage dependencies (single-kernel RMW of its own buffers is fine).
