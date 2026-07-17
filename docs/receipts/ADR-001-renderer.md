# ADR-001 — Renderer/compute strategy (P0 spike)

**Question (PLAN §5.2):** does the TSL compute graph translate through WebGPURenderer's
WebGL2 backend at target particle counts (PLAN §5.4 tiers)?

## Measurements (fill before deciding)
- [ ] vendored three WebGPU build size — raw: ______ KB · gzip: ______ KB (cap: 340 KB gzip)
- [ ] WebGPU path, N=131,072 — fps: ______ (target 60)
- [ ] WebGL2-backend path, N=65,536 — compute works? ______ · fps: ______
- [ ] If fail: classic FBO ping-pong estimate (build size, effort)

## Decision
( ) single TSL codebase, both backends
( ) TSL for WebGPU + classic FBO ping-pong behind FieldEngine interface
( ) classic WebGL build only (budget branch)

**Ladder (EXECUTE.md Ladder A, pre-authorized):** pick the highest passing branch; if all
rendering branches fail perf, reduce particle tiers until targets pass. Never wait, never ask.

**Rationale:**
**Date / commit:**
