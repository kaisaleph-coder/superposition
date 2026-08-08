# WORKLOG — SUPERPOSITION one-shot run

## 2026-07-17 — one-shot execution session (Claude Fable 5, single agent)

**Intent contract** — goal: execute PLAN.md v1.3 P0→P5 in one session, zero user involvement, all content `[PLACEHOLDER]`. Done-when: all gates green with receipts on disk, `docs/receipts/RUN-REPORT.md` written, deploy per Ladder D (gh IS authenticated → auto-deploy pre-authorized). Not-doing: real content, subagents, questions to user. Tier: heavy.

### Session decisions (details in docs/receipts/ADR-*)
- ADR-002: repo root is `C:\ai_projects_v1\resume-website` (not handoff's `E:\superposition`); orphan branch `main` with placeholder git author for public history; portable Node v24.18.0 in scratchpad (no system install); python 3.12 (not 3.14) serves.

## 2026-07-18 — v1.1 owner iterations (I1–I5)
- Owner-approved changes shipped: chrome/identity rework (header + Full résumé button, superposition/location/footer-record removed, domain titles monumental), 8th domain "Restaurant executive" (TABLES dining-floor attractor), swipe + wheel-at-edge domain paging, per-domain pale particle palette with collapsed-view cast, per-domain idle motion + mouse/gyro parallax, field never fully dims/freezes. Suite 82/82 after re-baseline; budget 713.2 KB. Receipt: docs/receipts/I1-I5-iterations.md.

### RUN COMPLETE (2026-07-17)
- ALL GATES PASSED. Deployed live: https://kaisaleph-coder.github.io/superposition/ (public repo, Pages main/root, v1.0.0). RUN-REPORT.md is the authoritative summary. Owner's next move: real-content swap (README §Content update / RUN-REPORT §Owner next steps).

## 2026-08-08 — adopted into the portfolio anchor (`E:\ai_project_v1\resume`)

- Cloned from GitHub into `E:\ai_project_v1\resume`. No local copy existed on any of the five drives; the unpushed `master` scaffold branch (real author) is gone — ADR-002's privacy design working as intended, not a loss to recover.
- Owner decisions: (1) the repo's 10-commit history wins over a throwaway anchor scaffold, which was discarded; (2) git identity stays the SUPERPOSITION placeholder, now pinned **repo-locally** so anchor commits cannot leak a real identity into public history; (3) `docs/TASKS.md` added as the Build lane's input — deliberately no second `PLAN.md`, the root one stays law.
- `manifest.json` was INVALID (`owner: "[OWNER]"` is not in the schema enum), so this project had never registered in the Portfolio Console. Fixed, plus `id` resume-website→resume, `state` planned→building, and phases restated to the real ladder (P0–P5 done 07-17/07-18, P6 pending for real content).
- Baseline artifacts refreshed verbatim from `_meta\project-template` (all three had drifted); `settings.json` now guards `mcp__.*` tool calls too. Unadapted `example-zone.md` removed.
- Verified: HEAD 11129ff preserved across the move, `git fsck` clean, 107 files, clean tree, housekeeping-scan clean on all three step-8 gates. 1 commit ahead of origin, deliberately NOT pushed.
- Open flag: instruction budget. After the merge below it reads `project=20 total=52` against a ~40 cap — but global alone is 32, and 12 of 23 anchor projects are over, so this is portfolio-wide, not resume-specific. Prune with `instruction-probe`, never freehand.
- **Instruction-file inversion fixed (same day).** Content moved into `AGENTS.md`; `CLAUDE.md` is now the canonical `@AGENTS.md` stub (OPERATING_LAWS §Instruction-file authorship) so Codex and Claude read one source. Verified: 0 of 33 rule-phrases dropped, housekeeping "instruction-file load gap" clean, project rules cut 28→20 by de-duplication.
  - Three stale facts corrected in the move: "seven attractor states" → **eight** (v1.1 added TABLES; live `__RESUME__` reports 8 facets); the asserted repo root `C:\ai_projects_v1\resume-website` → `E:\ai_project_v1\resume`, kept only as drive-letter history; `master` recorded as gone rather than merely unpushed.
  - The one-shot run's rules (ONE agent · ZERO interaction · gate commits · Ladder-D push) are now under a **"Spent rules"** heading, not deleted — EXECUTE.md still narrates them as live, and "never ask the owner anything" would be actively wrong for owner-directed content work.

### Position
- P0 PASSED (8e7b486+95d5dfd). ADR-001: single TSL codebase both backends. three r185 vendored.
- P1 PASSED. Content layer complete: baked+runtime render (ADR-004), router/DOM contract, print, 404, static SVG, fonts 92.8 KB. LH 96/100/96/100. 25 tests green.
- P2 engine built & verified: webgpu T1 131k (pane, step API, pixel-proof 14.7%), webgl T3 60fps rAF-locked (headless), boot 692–805 ms, deterministic ?seed (fixed dt + frame-240 settle). 5-min soak in flight. Scroll integration (§2.5, a P3 item) landed during the soak idle window — noted as minor phase-order deviation.
- History note: main was rebuilt once (cherry-pick) to purge an owner name-fragment from two receipt blobs; trees verified identical; full-history sweep clean.
- P4 PASSED: inline critical CSS (FCP 1524→784 ms Fast-3G lab), dark text accents ≥7:1, print forced to ink, OG card, long-task zero, matrix 75/75 ×2, Lighthouse Ladder-C substitute (CLI spawn-blocked in sandbox).
- P3: legibility gate caught the WebGL compute path silently broken — 5 failure modes bisected (ADR-005); engine redesigned to 8 static target buffers + 8 per-state update kernels, retarget = CPU kernel switch. All 7 silhouettes verified legible. Convergence 0.026–0.029 both backends.
- Bite: browser pane is always `document.hidden` → rAF throttled; perf via awaited-loop throughput or Playwright. renderAsync deprecated in r185. WebGPU pads vec3 storage to stride 4 on readback; WebGL keeps stride 3. Lighthouse CLI exits 1 on Windows tmp cleanup AFTER writing reports. Never string-edit UTF-8 files with PS 5.1 Get-Content/-replace (mojibake). three r185 WebGL backend: ≤4 buffers/kernel, instanceIndex-only reads, no re-uploads, float uniforms only, no cross-kernel storage flow (ADR-005). Uniform-valued test buffers can't catch indexing bugs — use per-block sentinels.
