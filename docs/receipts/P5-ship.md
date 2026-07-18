# P5 receipt — ship (Ladder D executed)

**Date:** 2026-07-17 · phase P5.

## Pre-ship VERIFIER sweeps
- Full-history owner-name sweep: CLEAN across all commits (case-insensitive git grep
  over every rev on `main`).
- Tracked-file audit: no .env/secrets/keys/launch.json/node_modules in the index.
- Authorship: single placeholder identity `SUPERPOSITION <owner@superposition.invalid>`
  across the entire public history (ADR-002).
- Placeholders verified PRESENT (4× `[NAME]` in index.html alone) — ships as designed.

## Deploy (pre-authorized: `gh auth status` authenticated)
1. `gh repo create superposition --public --source=. --push` → repo + `main` pushed.
2. Pages enabled via API: build from `main` / root, HTTPS enforced.
3. Live in ~20 s: **https://kaisaleph-coder.github.io/superposition/** → HTTP 200,
   correct document served.
4. Live verification: headless probe against the production origin — engine settled,
   60 fps, zero console errors, dense field render (227 KB center-crop PNG vs 1.4 KB
   when empty); og.png 200 (282,514 B); vendor gzip-served (≈183 KB transfer);
   fonts 200; unknown path → 404 status with 404.html.
5. `assets/og.png` og:image set to the absolute Pages URL (required by scrapers).
6. Tag `v1.0.0` pushed with the final commit (includes RUN-REPORT.md).

## Artifacts
- RUN-REPORT.md (this run's termination document) — gates, measurements, ADRs,
  deviations, deploy state, v-next.
- CI: `.github/workflows/qa.yml` (budget + content/state/print/a11y on push).
- README.md runbook: serve/test/budget commands, content-update procedure, licenses.
