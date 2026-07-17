# ADR-001 — Renderer/compute strategy (P0 spike)

**Question (PLAN §5.2):** does the TSL compute graph translate through WebGPURenderer's
WebGL2 backend at target particle counts (PLAN §5.4 tiers)?

## Measurements (spike: tools/spike.html · three r185 / npm 0.185.1 · 2026-07-17)
- [x] vendored three WebGPU build size — raw: 1051.7 KB (webgpu.min 652.2 + core.min 376.4 + tsl.min 23.1) · gzip: **286.5 KB** (cap: 340 KB gzip) → PASS
- [x] WebGPU path, N=131,072 — throughput fps: **613.9** (median frame 0.8 ms, p95 1.4 ms) (target 60) → PASS
- [x] WebGL2-backend path, N=65,536 — compute works? **YES** (`forceWebGL`, backend confirmed `webgl`, storage-buffer readback returned) · throughput fps: **856.9** (median 0.5 ms, p95 1.2 ms) → PASS
- [x] If fail: — not needed; FBO ping-pong fallback plan deleted per §5.2.

**Methodology deviation (recorded):** the session's browser pane reports `document.hidden = true`,
so rAF/vsync-locked FPS cannot be sampled. Measured instead: wall-clock throughput over 300
frames between two forced GPU syncs (`getArrayBufferAsync` storage-buffer readback), after a
30-frame warmup. Throughput ≥ 10× the 60 fps target on both backends; headroom makes the
vsync question moot. P2 re-verifies with the in-app rAF sampler (`?seed` test mode).

Note: r185 deprecates `renderAsync()` — the engine uses `render()` after `await renderer.init()`.

## Decision
(X) **single TSL codebase, both backends**
( ) TSL for WebGPU + classic FBO ping-pong behind FieldEngine interface
( ) classic WebGL build only (budget branch)

**Ladder (EXECUTE.md Ladder A, pre-authorized):** top branch passed — no descent needed.

**Rationale:** the compute graph (spring + noise + semi-implicit Euler on instancedArray
storage buffers — the exact §5.3 force model) initializes and runs on both backends with
identical code; vendor set fits the 340 KB gzip cap; both tiers exceed perf targets by an
order of magnitude on reference hardware.
**Date / commit:** 2026-07-17 · gate(P0) commit (hash in GATES.md)
