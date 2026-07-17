# SUPERPOSITION (resume-website)

Authority chain and all rules live in **CLAUDE.md** → PLAN.md (law) → EXECUTE.md (process) → GATES.md (state). Read those; this file is a pointer only.

## Commands
- serve: `python -m http.server 8080` (repo root; any Python 3.8+)
- test: `npx playwright test`
- budget: `node tools/budget.mjs`

## Constraints (always true)
- Secrets live in `.env` / `secrets\` — the floor guard blocks access; route config through environment variables or config files instead.
- No real personal data and no external personal links anywhere (content, commits, receipts, metadata) — placeholder `[BRACKETS]` only, until the owner swaps `content/resume.data.js`.

## Docs (pointers only)
- Continuity: `docs\WORKLOG.md` (read first on any resume)
- Gate state: `GATES.md` · Receipts: `docs\receipts\`
