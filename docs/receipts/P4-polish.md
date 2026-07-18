# P4 receipt — polish

**Date:** 2026-07-17 · phase P4.

## Built / changed in this phase
- Dark-scheme text-accent indirection (`--accent`/`--accent-live`): pale Klein
  (#8FA2FF / #A9B7FF) for typography and focus rings on the dark ground (≥7:1);
  the FIELD keeps true Klein per §3.1 ("Klein unchanged"; light scheme identical
  by construction — variables resolve to the same hexes).
- Print strictness (§8): all accents forced to ink — the one-pager is ink on white.
- OG card (§8): `assets/og.png` 1200×630, rendered from the live engine (seed 2,
  settled superposition, name typeset), 276 KB — counted in the budget.
- OG/Twitter meta + JSON-LD Person (placeholder values; absolute og:image URL is a
  P5 deploy step once the Pages origin exists).
- Long-task spec (`tests/perf-trace.spec.js`): PerformanceObserver over 5 running
  seconds post-boot; §6 budget = zero tasks > 50 ms.
- SR walkthrough substitute (Ladder C — no NVDA/VoiceOver in this environment):
  accessibility-tree review of home/facet/record: canvas aria-hidden, skip link first,
  main/nav/footer landmarks, one visible h2 per subpage (h1 lives on home per design),
  8/8 expander-button↔region pairs correctly wired (aria-expanded / aria-controls /
  aria-labelledby). Deviation noted: no <header> landmark — identity block is part of
  main by design; axe scans report zero critical AND zero serious.

## Gate checks (PLAN §11 P4) — results in this file + companions
- Full Playwright matrix green — authoritative double run (baselines regenerated after
  the accent/print changes, second run must be 100%): see below.
- axe zero-critical: a11y.spec.js (5 axe scans × 2 projects) — green in matrix.
- Budget ≤ 900 KB: see below.
- Anti-default signoff: P4-design-critique.md (all three forbidden looks absent).
- Lighthouse (field enabled): see below.

## Perf work at P4 (§6 loading order enforced)
- Critical CSS inlined at bake time (`tools/bake.mjs` rebases urls); font preload
  removed (font-display: swap; §3.2 requires system-ui survival anyway).
- Fast-3G-class lab (CDP 1.6 Mbps / 150 ms RTT / 4× CPU, cold cache):
  **FCP 784 ms** (< 1.0 s cap) · CLS 0 · DCL 1369 ms · load 1790 ms.
- Field boot to first frame (unthrottled desktop receipts): 558–977 ms (< 2.5 s cap).

## Lighthouse — Ladder C substitution (deviation, logged)
The `lighthouse` CLI's chrome-launcher fails with `spawn UNKNOWN` in this session's
sandbox (three attempts, tmp-dirs cleaned, P1-identical invocation; the two successful
P1 runs predate the restriction). Per Ladder C the receipt substitutes:
- P1 full Lighthouse report (chromium, field-disabled page): perf 96 / a11y 100 /
  best-practices 96 / SEO 100 (docs/receipts/P1-lighthouse.report.{json,html}).
- Playwright perf smoke ≥ 55/30 fps + zero long tasks > 50 ms (suite, both projects).
- axe: zero critical AND zero serious across 5 routes × 2 projects.
- budget.mjs under all caps + the throttled paint metrics above (tools/perf-metrics.mjs).

## Results at gate close
- **Matrix:** re-baselined after accent/print/inline-CSS changes; verify run
  **75 passed / 0 failed / 25 by-design skips** (fresh-baseline run 53+22 create);
  final post-inline run: see gate commit line in GATES.md.
- **Budget:** TOTAL 709.0 KB gz / 900 (og.png 276 KB counted although only social
  scrapers fetch it) · vendor 287.3/340 · fonts 92.8/105 · HTML+CSS+app JS 27.2/60.
  Note: css/main.css is double-counted (file + inlined copy) — conservative.
- **Long tasks:** perf-trace.spec.js green — zero > 50 ms over 5 s post-boot.
