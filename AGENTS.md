# SUPERPOSITION — resume website

Personal résumé site: one GPU particle field, eight attractor states. Static, free-hosted, no build step. Codename SUPERPOSITION; the public site is simply the owner's name.

## Authority chain
1. **PLAN.md** — the design & implementation packet. It is law; on any conflict, PLAN.md wins.
2. **EXECUTE.md** — the single-agent phase/gate procedure. **Spent** — see "Spent rules" below.
3. **GATES.md** — gate state. P0–P5 all PASSED 2026-07-17/18; v1.0.0 is live.
4. **reference/superposition-preview.html** — the owner-approved prototype. Match its behavior and feel; exceed its fidelity per PLAN §5.

## Commands
- serve: `python -m http.server 8080` from repo root (Python 3.12 under `%LOCALAPPDATA%\Programs\Python\Python312`)
- test: `npx playwright test` (chromium desktop + mobile emulation; `?seed=` fixes determinism, `?force=webgl` forces the fallback path)
- budget: `node tools/budget.mjs` (Node ≥ 20; dev-tooling only, gitignored)

## Things that will bite you
- Never hardcode a drive letter. This repo has moved twice already — the handoff's `E:\superposition`, then `C:\ai_projects_v1\resume-website`, now `E:\ai_project_v1\resume`. <!-- earned: ADR-002; moved into the portfolio anchor 2026-08-08 -->
- An off-screen browser pane is `document.hidden`, so rAF is throttled: the field never sizes, nothing paints, and screenshots time out. Prove rendering in a visible browser or through Playwright — never conclude "broken" from a headless blank. <!-- earned: 2026-07-17 run; recurred 2026-08-08 verifying the live deploy -->
- Never string-edit UTF-8 files with PS 5.1 `Get-Content`/`-replace` — it mojibakes them. <!-- earned: 2026-07-17 run -->

## Constraints (always true)
- **No real personal data**, and no external personal links, anywhere — content, commits, receipts, metadata — until the owner swaps `content/resume.data.js`. Placeholders stay visible `[BRACKETS]`. Git identity is pinned repo-locally to `SUPERPOSITION <owner@superposition.invalid>`; never commit here under a real identity. <!-- earned: ADR-002; identity pinned in git config 2026-08-08 -->
- **No build step, no frameworks.** Hand-authored ES modules; npm is dev-tooling only, never a runtime dependency.
- **Zero third-party runtime requests.** three.js vendored & pinned in `/vendor`, fonts self-hosted & subset. No CDNs, no analytics.
- **DOM-state contract** (PLAN §5.6): all app state mirrors to `<body data-*>`. Playwright asserts DOM ONLY — never `window` or module internals.
- **Budget caps** (PLAN §6): ≤ 900 KB gzip, hard fail 1.2 MB. Run `node tools/budget.mjs` before shipping.
- **Design anti-default clause** (PLAN §3) binds through polish.
- **Skills content rule** (PLAN §4.2): no bars, percentages, clouds or radar — three-tier typeset index + CLUSTERS field only.
- **A11y floor:** fully keyboard operable, `prefers-reduced-motion` honored, canvas `aria-hidden`, axe zero-critical.
- Secrets live in `.env` / `secrets\` — the floor guard blocks access.

## Spent rules — governed the one-shot P0→P5 run, NOT current work
Binding only for the autonomous build that completed 2026-07-18. EXECUTE.md still
describes them as live; it is describing a finished run.
- ONE agent, no subagents, sequential P0→P5.
- ZERO interaction — never ask the owner anything. **Current work is owner-directed: ask.**
- Commit at every gate as `gate(PX):`; push only under EXECUTE.md Ladder D at P5. Already done — the repo is public, Pages serves `main` at root, and `master` (the real-author scaffold branch) was never pushed and no longer exists anywhere.

## Docs (pointers only — read on demand, never duplicated here)
- Continuity: `docs\WORKLOG.md` — read first on any resume
- Task ledger: `docs\TASKS.md` · Gate state: `GATES.md` · Receipts: `docs\receipts\`
