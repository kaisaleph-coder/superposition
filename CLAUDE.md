# CLAUDE.md — SUPERPOSITION

Personal resume site: one GPU particle field, seven attractor states. Static, free-hosted, no build step. Codename SUPERPOSITION; the public site is simply the owner's name.

## Authority chain
1. **PLAN.md** — the design & implementation packet. It is law; on any conflict, PLAN.md wins.
2. **EXECUTE.md** — process: single-agent phase/gate procedure.
3. **GATES.md** — live execution state. Update at every gate.
4. **reference/superposition-preview.html** — the owner-approved prototype. Match its behavior and feel; exceed its fidelity per PLAN §5.

## Hard rules (binding, no exceptions)
- **ONE agent.** Do not spawn subagents, parallel tasks, or delegated workers. Sequential phases P0→P5.
- **ZERO interaction.** Never ask the user anything, never pause for approval, never wait. Resolve every decision via EXECUTE.md's Autonomy Protocol (priority stack + Ladders A–D) and record it as an ADR in `docs/receipts/`.
- **No build step** for the site. No frameworks. Hand-authored ES modules. npm is dev-tooling only (Playwright, budget script) — gitignored, never a runtime dependency.
- **Zero third-party runtime requests.** three.js vendored & pinned in `/vendor`. Fonts self-hosted & subset. No CDNs, no analytics.
- **DOM-state contract** (PLAN §5.6): all app state mirrored to `<body data-*>` attributes. Playwright asserts DOM ONLY — never `window` or module internals.
- **Placeholder policy:** all placeholder content uses visible `[BRACKETS]`. No real personal data and no external personal links anywhere — including commits, receipts, and metadata — until the owner supplies them.
- **Budget caps** (PLAN §6): total ≤ 900 KB gzip, hard fail 1.2 MB. `node tools/budget.mjs` before every gate.
- **Design anti-default clause** (PLAN §3) is binding through polish.
- **Skills content rule** (PLAN §4.2): no bars, percentages, clouds, or radar — three-tier typeset index + CLUSTERS field only.
- **A11y floor:** fully keyboard operable, `prefers-reduced-motion` honored, canvas `aria-hidden`, axe zero-critical.

## Environment (adapted to this machine — ADR-002)
- Windows. Repo root: `C:\ai_projects_v1\resume-website` (anchor-root project; handoff's `E:\superposition` does not exist here — never hardcode drive letters).
- Local server: `python -m http.server 8080` from repo root (local machine: Python 3.12 under `%LOCALAPPDATA%\Programs\Python\Python312`).
- Node: any ≥ 20 for `tools/budget.mjs` and Playwright (dev-tooling only, gitignored).
- Tests: `npx playwright test` (chromium desktop + mobile emulation; `?seed=` fixes determinism, `?force=webgl` forces fallback).

## Commands
- serve → python http.server (above)
- test  → `npx playwright test`
- budget → `node tools/budget.mjs`

## Git discipline
- Work happens on orphan branch `main` with repo-local placeholder author identity (privacy rule: no real personal data in public commits — ADR-002). `master` (scaffold, real author) is never pushed.
- Commit at every gate: `gate(PX): <summary>` with receipts in `docs/receipts/`.
- Push only under EXECUTE.md Ladder D: at P5, iff `gh auth status` is authenticated — create PUBLIC repo `superposition`, push `main`, enable Pages, verify live URL, record it. Otherwise never push; write DEPLOY.md instead.

## Docs
- Continuity: `docs/WORKLOG.md` — read first on any resume; GATES.md is gate state.
