# WORKLOG — SUPERPOSITION one-shot run

## 2026-07-17 — one-shot execution session (Claude Fable 5, single agent)

**Intent contract** — goal: execute PLAN.md v1.3 P0→P5 in one session, zero user involvement, all content `[PLACEHOLDER]`. Done-when: all gates green with receipts on disk, `docs/receipts/RUN-REPORT.md` written, deploy per Ladder D (gh IS authenticated → auto-deploy pre-authorized). Not-doing: real content, subagents, questions to user. Tier: heavy.

### Session decisions (details in docs/receipts/ADR-*)
- ADR-002: repo root is `C:\ai_projects_v1\resume-website` (not handoff's `E:\superposition`); orphan branch `main` with placeholder git author for public history; portable Node v24.18.0 in scratchpad (no system install); python 3.12 (not 3.14) serves.

### Position
- P0 PASSED (8e7b486+95d5dfd). ADR-001: single TSL codebase both backends. three r185 vendored.
- P1 PASSED. Content layer complete: baked+runtime render (ADR-004), router/DOM contract, print, 404, static SVG, fonts 92.8 KB. LH 96/100/96/100. 25 tests green.
- P2 engine built & verified: webgpu T1 131k (pane, step API, pixel-proof 14.7%), webgl T3 60fps rAF-locked (headless), boot 692–805 ms, deterministic ?seed (fixed dt + frame-240 settle). 5-min soak in flight. Scroll integration (§2.5, a P3 item) landed during the soak idle window — noted as minor phase-order deviation.
- History note: main was rebuilt once (cherry-pick) to purge an owner name-fragment from two receipt blobs; trees verified identical; full-history sweep clean.
- P4 PASSED: inline critical CSS (FCP 1524→784 ms Fast-3G lab), dark text accents ≥7:1, print forced to ink, OG card, long-task zero, matrix 75/75 ×2, Lighthouse Ladder-C substitute (CLI spawn-blocked in sandbox).
- P3: legibility gate caught the WebGL compute path silently broken — 5 failure modes bisected (ADR-005); engine redesigned to 8 static target buffers + 8 per-state update kernels, retarget = CPU kernel switch. All 7 silhouettes verified legible. Convergence 0.026–0.029 both backends.
- Bite: browser pane is always `document.hidden` → rAF throttled; perf via awaited-loop throughput or Playwright. renderAsync deprecated in r185. WebGPU pads vec3 storage to stride 4 on readback; WebGL keeps stride 3. Lighthouse CLI exits 1 on Windows tmp cleanup AFTER writing reports. Never string-edit UTF-8 files with PS 5.1 Get-Content/-replace (mojibake). three r185 WebGL backend: ≤4 buffers/kernel, instanceIndex-only reads, no re-uploads, float uniforms only, no cross-kernel storage flow (ADR-005). Uniform-valued test buffers can't catch indexing bugs — use per-block sentinels.
