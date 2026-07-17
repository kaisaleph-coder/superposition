# WORKLOG — SUPERPOSITION one-shot run

## 2026-07-17 — one-shot execution session (Claude Fable 5, single agent)

**Intent contract** — goal: execute PLAN.md v1.3 P0→P5 in one session, zero user involvement, all content `[PLACEHOLDER]`. Done-when: all gates green with receipts on disk, `docs/receipts/RUN-REPORT.md` written, deploy per Ladder D (gh IS authenticated → auto-deploy pre-authorized). Not-doing: real content, subagents, questions to user. Tier: heavy.

### Session decisions (details in docs/receipts/ADR-*)
- ADR-002: repo root is `C:\ai_projects_v1\resume-website` (not handoff's `E:\superposition`); orphan branch `main` with placeholder git author for public history; portable Node v24.18.0 in scratchpad (no system install); python 3.12 (not 3.14) serves.

### Position
- P0 PASSED. ADR-001: single TSL codebase, both backends (spike numbers in ADR). Vendored three r185. Budget 289.7/900 KB gz.
- Next: P1 content layer (semantic HTML/CSS from schema, print.css, static SVG, router, 404, fonts Ladder B).
- Bite: browser pane is always `document.hidden` → rAF throttled; perf must be measured by awaited-loop throughput or Playwright headed mode. renderAsync deprecated in r185.
