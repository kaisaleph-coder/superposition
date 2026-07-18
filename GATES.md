# GATES — live execution state

| Gate | Status | Receipts | Commit |
|---|---|---|---|
| P0 Foundations | ☑ PASSED 2026-07-17 — ADR-001: single TSL codebase both backends (webgpu 613.9 fps @131k, webgl 856.9 fps @65k); vendor 286.5 KB gz ≤ 340; budget exit 0 | docs/receipts/P0-budget.md, ADR-001, ADR-002 | 137bca5 + 8f4bda0 (history rebuilt once for privacy sweep — trees verified identical) |
| P1 Content layer | ☑ PASSED 2026-07-17 — LH 96/100/96/100; tests 25 pass; no-JS full content; fonts 92.8 KB (Ladder B top); budget 419.4 KB | docs/receipts/P1-content.md, P1-lighthouse.report.{json,html}, ADR-004 | 6a4d9df |
| P2 Field engine | ☑ PASSED 2026-07-17 (WebGL numbers later invalidated & re-taken at P3 — see superseded note in receipt + ADR-005) | docs/receipts/P2-engine.md | bdb98ab |
| P3 Choreography | ☑ PASSED 2026-07-17 — legibility gate caught 5 silent WebGL compute bugs → engine re-architected (ADR-005); all 7 silhouettes verified; convergence 0.026–0.029 both backends; downshift CDP-proven; suite 74/74; soak re-run (result in receipt); budget 431.2 KB | docs/receipts/P3-choreography.md, ADR-005, 7 facet screenshots reviewed | gate(P3) (hash backfilled at P4) |
| P4 Polish | ☐ pending | docs/receipts/P4-* | — |
| P5 Ship | ☐ pending · auto-push iff `gh` authenticated (Ladder D), else deploy-ready + DEPLOY.md · ends with RUN-REPORT.md | docs/receipts/P5-* | — |

**Resume-from-cold:** read CLAUDE.md → PLAN.md → this file → latest receipts in docs/receipts/. The repo alone must be sufficient.
