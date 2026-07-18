# RUN-REPORT — SUPERPOSITION one-shot execution (v1.3)

**Session:** 2026-07-17 · Claude Fable 5, single agent, zero user involvement (per EXECUTE.md).
**Outcome:** ALL GATES PASSED · DEPLOYED LIVE · placeholder content throughout (pre-authorized).

**Live URL: https://kaisaleph-coder.github.io/superposition/**
Repo: https://github.com/kaisaleph-coder/superposition (public, Pages from `main` root, tag `v1.0.0`)

## Gates
| Gate | Result | Commit |
|---|---|---|
| seed | privacy-swept handoff | d5c3b97 |
| P0 Foundations | PASS — ADR-001 decided with measured numbers | 137bca5 + 8f4bda0 |
| P1 Content layer | PASS — LH 96/100/96/100, 25 tests, no-JS complete | 6a4d9df |
| P2 Field engine | PASS at the time; WebGL evidence later invalidated & re-taken at P3 (see receipt note) | bdb98ab |
| P3 Choreography | PASS — engine re-architected after 5 silent WebGL backend bugs (ADR-005); 7 silhouettes verified | 7dff7df |
| P4 Polish | PASS — matrix 75/75, FCP 784 ms lab, anti-default signoff | c55be5b |
| P5 Ship | PASS — Ladder D auto-deploy executed, live URL verified | bbc0745 + final |

## Measurements vs caps (§6)
| Metric | Cap | Measured | Verdict |
|---|---|---|---|
| Total transfer, cold (gzip) | ≤ 900 KB (hard 1200) | **709.0 KB** (incl. 276 KB og.png fetched only by scrapers; css double-counted) | PASS |
| vendor three.js | ≤ 340 KB gz | **287.3 KB** (r185 webgpu+core+tsl, pinned) | PASS |
| Fonts | ≤ 105 KB | **92.8 KB** (Archivo VF wght×wdth 88.0 + Fragment Mono ASCII subset 4.7) | PASS |
| HTML+CSS+app JS | ≤ 60 KB | **27.2 KB** | PASS |
| FCP (Fast-3G-class lab: 1.6 Mbps/150 ms RTT/4× CPU) | < 1.0 s | **784 ms** (was 1524 ms before critical-CSS inlining) · CLS 0 | PASS |
| Field boot → first frame (desktop, local) | < 2.5 s | **558–977 ms** across runs (live cold-cache probe incl. network fetch: 4.6 s — first visit only) | PASS |
| Frame rate | 60 desktop / ≥30 mobile | **60 fps** rAF-locked webgl T3; webgpu T1 0.28–0.45 ms/frame throughput; mobile emulation median ≥ 30 (suite) | PASS |
| Lighthouse ≥ 95 ×4 | ≥ 95 | **96/100/96/100** at P1 (field-disabled); P4 CLI spawn-blocked in sandbox → **Ladder C substitute** (axe 0-critical+0-serious, perf smoke, long tasks 0, budget, throttled paint metrics) | PASS (substituted, logged) |
| Long tasks after boot | 0 > 50 ms | **0** (PerformanceObserver, 5 s post-boot) | PASS |
| Memory soak | stable 5 min | heap ×1.000 flat (18.4 MB), median 60 fps | PASS |
| axe | zero critical | **zero critical AND zero serious**, 5 routes × 2 projects | PASS |

Full QA matrix: **75 passed / 0 failed / 25 by-design skips** (chromium desktop + Pixel 7
emulation), twice consecutively — fixed-seed visual set pixel-identical across runs.
Live-site verification: engine boots on the Pages origin (settled, 60 fps, 0 console
errors, dense render), og.png/fonts/vendor 200 (gzip confirmed), 404.html served on
unknown paths, deep links and print verified locally against the same tree.

## ADR index
- **ADR-001** — renderer: single TSL codebase, both backends. Spike measured: vendor
  286.5 KB gz; webgpu 613.9 fps @131k; webgl 856.9 fps @65k; both backends verified by
  convergence + pixel proof. Ladder A top branch (held through the P3 re-architecture).
- **ADR-002** — environment: repo root is the anchor-root project (not `E:\superposition`);
  orphan `main` with placeholder git author (privacy rule); portable Node; Python 3.12.
- **ADR-004** — content: baked static HTML + runtime re-render from `resume.data.js`;
  `tools/bake.mjs` keeps the no-JS/ATS layer in sync; drift gated by test.
- **ADR-005** — five silent WebGL-backend compute failure modes (buffer count, dynamic
  indexing, re-upload, typed uniforms, cross-kernel writes) → final architecture: 8 static
  state buffers + 8 per-state update kernels; retarget = CPU kernel switch; morphs =
  spring flight. THE find of the run; caught by the P3 legibility gate.
- (ADR-003 was folded into ADR-002/seed amendment — privacy sweep.)

## Deviations & substitutions (each logged where it occurred)
1. Repo root & toolchain adaptations (ADR-002).
2. Hidden-pane rAF throttling → GPU-throughput methodology for pane measurements;
   rAF-locked numbers from headless chromium (ADR-001 note).
3. Public history rebuilt once pre-P2 to purge an owner name-fragment from two receipt
   blobs (trees verified identical; full-history sweep clean across all commits).
4. P2's WebGL greens were structurally blind (motion/fps only) — invalidated and
   re-taken at P3 with convergence + silhouette evidence (P2 receipt superseded note).
5. Morph mechanism: spring flight instead of from/to target lerp (ADR-005; timing caps met).
6. `setWeights` on WebGL approximates with dominant-weight state (unused by the site).
7. Lighthouse CLI unusable at P4 (`spawn UNKNOWN` sandbox) → Ladder C substitute receipts.
8. SR walkthrough: no NVDA/VoiceOver available → accessibility-tree review + axe
   (0 critical/serious); `<header>` landmark consciously omitted (identity block lives in main).
9. Placeholder policy inverted by design: `[` placeholders EXPECTED and verified present
   (waivers pre-authorized); at real-content swap the QA check flips to zero-`[`.
10. Scroll integration (P3 scope) and some P4 CSS landed during prior-phase idle windows —
    each gated at its own phase; noted in worklog.

## Deploy state (Ladder D — executed)
`gh` was authenticated (account kaisaleph-coder) → pre-authorized path taken:
public repo created, `main` pushed, Pages enabled (main/root, HTTPS enforced),
live URL polled to 200 in ~20 s and content-verified. Tag `v1.0.0` on the final commit.
CI receipts: `.github/workflows/qa.yml` runs budget + content/state/print/a11y QA on push.

## Owner next steps (when ready — no code changes)
1. Edit `content/resume.data.js` with real content (schema §4.2; links only when approved).
2. `node tools/bake.mjs` (syncs the no-JS/ATS layer + inline CSS), commit, push.
3. Flip the placeholder QA check to assert zero `[` in rendered DOM.

## Suggested v-next
1. **Real-content swap** (above) — includes real skills inventory: CLUSTERS becomes
   8-ish domains with true counts and declared relatedness (filaments already data-driven).
2. Type-to-filter across skill domains (§4.2 "production adds" — collapses the field
   toward matching domains while typing).
3. Custom domain (10-minute CNAME per §9) if wanted.
4. Revisit three.js releases for WebGL-backend fixes (ADR-005 findings may resolve
   upstream; the per-state-kernel design remains valid either way).
5. Optional: sr-only persistent h1 / header landmark; webkit project in the QA matrix.
6. OG image refresh after real content (`node tools/og.mjs`).
