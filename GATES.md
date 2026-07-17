# GATES — live execution state

| Gate | Status | Receipts | Commit |
|---|---|---|---|
| P0 Foundations | ☑ PASSED 2026-07-17 — ADR-001: single TSL codebase both backends (webgpu 613.9 fps @131k, webgl 856.9 fps @65k); vendor 286.5 KB gz ≤ 340; budget exit 0 | docs/receipts/P0-budget.md, ADR-001, ADR-002 | 8e7b486 + 95d5dfd |
| P1 Content layer | ☑ PASSED 2026-07-17 — LH 96/100/96/100; tests 25 pass; no-JS full content; fonts 92.8 KB (Ladder B top); budget 419.4 KB | docs/receipts/P1-content.md, P1-lighthouse.report.{json,html}, ADR-004 | gate(P1) (hash backfilled at P2) |
| P2 Field engine | ☐ pending | docs/receipts/P2-* | — |
| P3 Choreography | ☐ pending · skills-counts waiver PRE-AUTH | docs/receipts/P3-* | — |
| P4 Polish | ☐ pending | docs/receipts/P4-* | — |
| P5 Ship | ☐ pending · auto-push iff `gh` authenticated (Ladder D), else deploy-ready + DEPLOY.md · ends with RUN-REPORT.md | docs/receipts/P5-* | — |

**Resume-from-cold:** read CLAUDE.md → PLAN.md → this file → latest receipts in docs/receipts/. The repo alone must be sufficient.
