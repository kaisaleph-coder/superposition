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
- **instruction-probe run 2026-08-08 — verdict: this file is not the problem.** Tiers probed: 3× opus + 3× haiku, fresh context, frame + blanked outline pasted as text, `tool_uses: 0` on all six. Delta 1024 → 1016 tokens (cl100k); **rule count unchanged at 20**, so `total=52` is unmoved. Only two bodies were recovered by every tier (no-build-step, no-CDN) and both were seeded by the frame line itself; their non-inferable halves (npm IS used for dev tooling; three.js IS vendored in `/vendor`) were kept and the inferable halves compressed. 4 lines carry earned tags → mechanically vetoed. The rest scored zero recovery across all six probes.
  - Probe findings worth keeping: (a) all six inferred the **inverse** of the personal-data rule — they predicted "never alter Kais's real résumé facts" when the actual rule is that no real data may appear at all; cutting it would invert behaviour. (b) Three probes asserted **"no test runner exists"** — the repo has Playwright, 82 tests and CI. (c) Probes hallucinated the *global* memory's newsprint/cream/vermilion taste onto this dark site. (d) All six filled "Authority chain" with the global source-of-truth ladder, not PLAN→EXECUTE→GATES — the heading name collides with a global concept.
  - Ablation (step 4) not run: no prune candidate survived far enough for the outline-inferable vs context-inferable distinction to change its verdict.
  - **Arithmetic:** the cap is ~40 combined and global alone is 32, so every project is allotted 8. resume has 20, of which 4 are earned-vetoed and ~14 scored zero probe recovery. The project-level lever cannot reach 8 without deleting load-bearing rules. The real lever is global (32 rules) or the cap's calibration — 12 of 23 anchor projects are over for the same structural reason.
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

## 2026-11-24 - RESONANCE: a new field engine (branch resonance-20261124, NOT pushed)

Owner-directed, from a worktree at E:/ai_project_v1/_worktrees/resume-resonance, branched from 10dee90 (the repair commit, which is live). Built inside a one-hour cap; the engine took 21 minutes to a frozen build.

### Why
- 10dee90 (one-line repair of the dead field) was pushed to origin/cloudflare-staging-anchor at 21:50 UTC on the owner's order and is live. cloudflare-staging-anchor is the branch Cloudflare Workers Builds deploys to production; every other branch only gets a preview version.
- A first motion layer on the legacy field (local branch anim-overhaul-20261124, commits 53c7fef and f3d42a9) was rejected the same evening: "not an overhaul", "at best a minor improvement of the original". Kept from it: the speed. Rejected: the confluence of several shapes at home, the halo around the cursor.
- The owner then lifted the earlier limits: the 2026-08-09 rulings "field subordinate to the text" and "slow motion only", and the same day's "legible, with bursts". The animation may lead the page. Name and record must stay real, readable text.

### What
- js/field/resonance.js: raw WebGPU, no three.js. Up to 1.4 million grains on a resonating plate settle on the nodal lines of one vibration mode per domain. Home is two modes superposed into one figure. A mask rendered from the live DOM makes the sand fill the heading's glyphs and leave the copy clear. Full notes: docs/RESONANCE.md.
- Opening sequence on the first load of a session: js/head.js sets a curtain before first paint, the plate starts tipped back and swings up in 1.8 s, the page's chrome is released 1.0 s after the engine starts.
- Pointing at another domain blends its mode half-way in (live superposition). A click strikes the plate. A moving pointer drags sand; there is no effect at rest.
- js/main.js picks this engine only on tier 1 or 2 (WebGPU) with no ?seed= and no ?force=. Every other path, and any failure, runs the legacy field or the static ground unchanged.

### Measured here (owner's PC, headless system Chrome, RTX 4070 SUPER)
- 1,400,000 grains at 1440x900 and at 2560x1440: 57-60 fps. Five domain changes: 59-60 fps, worst frame 33 ms. Phone-size emulation: 360,000 grains at 60 fps.
- Mode matrix clean (no console error, page error or failed request): default, reduced motion, ?force=webgl, ?seed=1, ?force=static, no-JS, mobile emulation, repeat visit, /resume/.
- Budget 769.8 KB of 900; HTML+CSS+app JS 59.9 KB of 60. Node tests 17/17. Bake parity: one added line (the sand.css link). Surface contract passes.
- To fit the 60 KB app cap the shipped shader text and resonance.js carry no comments; docs/RESONANCE.md is their documentation.

### Costs
- First load of a session: the page's text is hidden until about 1.5-2.2 s after navigation, then fades for 0.9 s (three runs: released at 2183, 1626, 1463 ms). Chrome reported no LCP candidate at all on those loads. Repeat loads in a session skip the curtain.
- One 533 ms frame at start (pipeline compile) and, in one run, a 150 ms frame between 3 and 5 s.
- App-code budget headroom is 0.1 KB.

### NOT verified
- No real phone, no Safari, no Firefox, no integrated GPU. The frame-rate governor and its static hand-over never triggered here, so they are untested.
- The Playwright suite was not run (no node_modules here). No test renders this engine; CI has no GPU.
- Not pushed. Not deployed.

## 2026-11-24, late - RESONANCE round 2 (same branch, NOT pushed)

Owner order, verbatim: "Raise the gate cap as rec, proceed with rec on all, time is 30 minutes starting now, go".
- tools/budget.mjs app-code cap raised from 60 KB to 80 KB on that order. PLAN.md section 6 still says 60; it was not edited.
- Built, all in js/field/resonance.js (rewritten): the two restrictions (title untouchable by pointer and boom; no text selection from the plate), long exposure, marks that last 30 s, hold to gather, charged boom with edge echoes and an overtone flash, relief and light on desktop, tilt on phones. Notes: docs/RESONANCE.md, Round 2.
- NOT built, though recommended: the dial that tunes the plate, the visible plate. NOT approved and not built: tenure as quantity, path memory, sound.
- Echoes reflect off the screen edges only, not off text blocks as proposed.
- Tilt was exercised only by synthetic deviceorientation events in Chrome's phone emulation. No real phone.
- Later in the same 30 minutes the tuning dial was built as well (its own commit). The visible plate remains unbuilt. The dial does not snap to a notch per domain, as proposed.

## 2026-11-25 - RESONANCE: no legacy page before the sand (same branch, NOT pushed)

Owner report, verbatim: "the original website loads momentarily prior to your changes loading".
- Reproduced by filming a load: the compositor's frames plus a state timeline sampled on every animation frame. On a repeat load in a session the legacy page showed from about 100 ms until the engine went live at 1116 ms: the solid heading for all of it, and the static picture of the field until js/main.js set the tier. The first load of a session was covered by the curtain.
- Cause: js/head.js prepared the page only on the first load of a session, and nothing hid the legacy look while the engine started.
- Fix: head.js sets html.sand before first paint on every load where the engine is expected. css/sand.css hides the static picture under it. js/main.js gives the legacy page back when the engine will not start or throws. A 6 s timer in head.js is the last resort. A load without the opening sequence raises the light over 0.6 s, so the sand does not pop in.
- Verified here (owner's PC, headless system Chrome, RTX 4070 SUPER): after the fix no sampled frame of a first load or of a reload shows the legacy state, and the same instrument did report it before the fix. Five engine-start cases land correctly (control, no adapter, adapter throws, software adapter, adapter never answers). Nine load modes clean. Node tests 17/17. Bake parity. Budget 774.3 KB of 900, app code 64.4 KB of 80.
- Cost: when the adapter request hangs, the heading stays an empty outline for 6 s before the legacy page returns. Before this change the legacy page showed at once in that case. A solid heading would remove this cost.
- NOT verified: a real phone, Safari, Firefox, a weak GPU. The Playwright suite was not run.
- Known cost until the title decision below is made: with the outlined heading, a repeat load shows an empty outline for about a second, until the sand fills it. Before the fix the solid legacy heading showed there.
- Measured, not changed: across four filmed repeat loads the engine was live at 669, 773, 821 and 1116 ms. In the two loads that were instrumented, one frame of 333 and 383 ms is the GPU pipeline compile, which blocks the main thread. Parallel async pipeline creation is untried.

## 2026-11-25 - Title treatment: options rendered, owner's pick PENDING (nothing changed in the repo)

Owner, verbatim: "i don't like the font/effect of each page's title. it's not professional. what alternatives do you suggest?"
- The live site and this branch set the title in the same type: Archivo, weight 520, normal width, up to 174 px, tracking -0.077em. Read from the live site on 2026-11-25. The branch changed only the effect: css/sand.css makes the heading a hollow outline and the engine fills it with sand.
- The options were rendered in the real engine without touching the repo. Review tooling serves the worktree with CSS appended to css/sand.css and, for a solid title, with the two lines of js/field/resonance.js that draw the letters into the mask switched off. Tools, shots and sheets: test-results/review-2026-11-25/ (gitignored, on disk only). Launcher: Title-Lab.bat there, ports 8800 to 8806.
- Effects. A, set in type: solid text, no sand in the letters, the plate keeps clear of the title. B, written then set: sand gathers in the letters and solid type resolves over it at 0.8 s. Or keep the outline.
- Types, all Archivo except the last. 1 as live. 2 quiet: one line, 65 px at 1440, weight 560. 3 masthead: weight 800, width 66, the headline PLAN 3.2 specifies. 4 engraved: weight 300, width 118, tracked caps. 5 serif: a face installed on this PC as a stand-in; a real one needs a font file (fonts are at 92.8 of 105 KB) and overrides PLAN 3.2 "No serif anywhere".
- Found for B, from filmed frames of a page change: the previous title's sand overlaps the new title at 0.22 s; the sand letters sit out of register with the type at 1.05 s, because the plate rocks during a change; at the quiet size there are too few grains to form letters. Not recommended without more engine work.
- The engine draws the mask's glyphs from font style, weight, size and family. It does not read font-stretch or text-transform, so a sand-filled title in a condensed, expanded or upper-cased setting would be out of register. A solid title does not use the mask.
- Recommended to the owner: A with type 2. Every lab port rendered at 1440x900 and at phone size with no error and no sideways overflow; phone sizes of types 2 to 5 are not tuned.

## 2026-11-25 - Titles built: effect A, type 2 (same branch, NOT pushed)

Owner's pick, verbatim: "a with 2".
- Built in the base stylesheet, so every load mode shows the same title. css/main.1.css and css/main.3.css carry the type and are baked into index.html. css/sand.css no longer outlines headings. js/field/resonance.js no longer draws the heading's glyphs into the mask, and the shader terms that only they fed are removed. Notes: docs/RESONANCE.md, Round 3.
- The setting. Name: one line, weight 560, clamp(28px, 4.5vw, 78px), and 8.2vw at 720 px and below. Domain titles: weight 520, clamp(36px, 4.1vw, 70px), at most 16ch wide, and 9.4vw at 720 px and below. The no-JS size override is removed, because the quiet sizes suit the stacked page.
- This overrides two earlier rulings on the owner's order. PLAN 3.2 specifies headlines at weight 800 and width 66. The live site had already departed from that (weight 520, normal width), and the owner was shown the PLAN's own headline as type 3 before picking type 2. PLAN.md was not edited. RESONANCE round 1 made the sand fill the heading.
- Verified here (owner's PC, headless system Chrome, RTX 4070 SUPER): 117 titles across 13 load modes and sizes are solid, on screen and cause no sideways scroll, and the name is on one line in all 13 (1440, 1920 and 800 wide, phones at 390 and 320, legacy WebGL, static, reduced motion, fallback font, no-JS). Filmed first load and reload: the title is solid from the first frame, 42 ms into the reload, and no legacy frame shows. Five engine-start cases and nine load modes land correctly. Node tests 17/17. Bake parity. Budget 773.8 KB of 900, app code 64.0 KB of 80. Five page changes at 60 fps, worst frame 16.9 ms.
- The two costs recorded for the boot fix are gone, because the title is real text from the first frame.
- The review tooling's title lab is retired. Its launcher was renamed, because the code it patched no longer exists.
- Found, not changed. tests/visual.spec.js-snapshots dates from 2026-07-18 and already differed from the build before this change, by 14 to 23% of pixels on the three baselines measured against a 2% limit. CI does not run that spec and passes --ignore-snapshots. On a 390 px phone the slash-joined word in the home copy runs wider than its column.
- NOT verified: a real phone, Safari, Firefox, a weak GPU. The Playwright suite was not run (no node_modules here), so tools/static-smoke.mjs and the browser specs that CI runs are unproven for this change.

## 2026-11-25 - Shipped: 9d1a0b7 is live (titles, boot fix, RESONANCE rounds 1 to 3)

Owner, verbatim: "the last preview (http://127.0.0.1:8797/) is great. lock this in, commit, and push." Asked which push, the owner picked "Ship after CI passes".
- gitleaks over 10dee90..9d1a0b7: 7 commits, no leaks.
- resonance-20261124 pushed to origin at 02:24 UTC. GitHub QA run 45532761383 on 9d1a0b7: success, every step green, including the browser suite that could not run locally.
- origin/cloudflare-staging-anchor fast-forwarded 10dee90..9d1a0b7 at about 02:28 UTC.
- Verified live: index.html, css/sand.css and js/field/resonance.js fetched from kaisabuhussein.com hash identical to the 9d1a0b7 blobs (sha256 prefixes e881049084356822, 6a3c1f1029c32e63, 642a35e823c3630f).
- Still NOT verified: a real phone, Safari, Firefox, a weak GPU.

## 2026-11-25 - Sand lab: pattern and colour options (review tooling only, nothing in the site changed)

Owner, verbatim: "i would like to explore more sand pattern options and differing color schemas."
- test-results/sand-lab/server.mjs serves the worktree with js/field/resonance.js patched as served (8 patches, each must find its text exactly once): ten candidate modes as fld() cases 9 to 18, a per-frame override read from window.__sandLab, and a light-ground path in the show pass (negative exposure means the sand absorbs light from the ground). panel.js puts a pattern and colour picker at the top centre and sets the page's CSS colour variables after every recipe event.
- Patterns: quasicrystal (fivefold), two-source and three-source interference, drum (circular plate), sunflower spirals, cells (Voronoi borders), maze (Truchet arcs), contour map (fbm), moire of two gratings, Chladni (5,11).
- Schemes: as built, bone on graphite, gilt on black, cyanotype, ember, verdigris, duotone, white with one accent, graphite on paper (light), umber on sand (light).
- Verified here (headless Chrome, RTX 4070 SUPER, 1440x900, home page): all 21 shots ran the resonance engine with the lab state applied and no console error. A WGSL precedence error was caught by that check on the first run and fixed. Sheets: test-results/sand-lab/sheet-patterns.png and sheet-schemes.png.
- Not checked: domain pages under the light schemes, phone sizes, frame rate on the costlier modes (contours, cells) on a weak GPU.

## 2026-11-25 - Owner's picks, and the sand lab tripled (review tooling only, nothing in the site changed)

Owner, verbatim: "sunflower spirals should be the pattern for the main page. white with one accent should be the main color. can you triple the amount of patterns (include at least half as mathematical shapes and patterns) and color schemes?"
- DECIDED, not yet built into the site: home page pattern = sunflower spirals (lab mode 13); main colours = white with one accent (lab scheme "signal": white sand, one orange #ff6a3d tint band, ground #0c0d10). The lab's default is now "Decided: per page, home = sunflower" with that scheme.
- Patterns 10 -> 30 (cases 19 to 38). Twelve are mathematical shapes: rose 5/3, nested cardioids, superformula star, nested hexagons, pentagram offsets, Sierpinski triangle, Mandelbrot set, Julia set (Douady rabbit), Cassini ovals, Apollonian circles, Lissajous figure, flower of life. Eight are patterns: sevenfold quasicrystal, zen garden, wind ripples, seigaiha, isometric cubes, conformal grid of z^3 - 1, kaleidoscope, rain on water.
- Schemes 9 -> 28 (19 new). Three are variants of the owner's pick: the page's own accent, a cobalt accent, a gold accent.
- Verified here (headless Chrome, RTX 4070 SUPER, 1440x900, home): all 32 pattern options and 29 scheme options render the resonance engine with the lab state applied and no console error; the shot script reads its lists from the panel (window.__sandLabLists). Fixed after my own review of the sheets: Mandelbrot and Julia smeared into haze (bands too dense, a sign test that misread far points) and now read clearly. Conformal grid still has a hazy region; not recommended.
- Measured cost: the lab's engine starts in about 4.6 to 7.4 s (3 timed loads 5.9 to 6.2 s; the first load after a server restart exceeded 15 s twice), against 0.8 to 1.8 s for the live site in the same harness (3 loads). Inference: compiling all 30 extra modes into one shader causes it. A shipped build must carry only the chosen modes, and its start time must be re-measured before shipping.


## 2026-11-26 — Round 4 release preparation, NOT pushed

Owner reported the improved phone preview was better and requested thorough tests/preparation for main. On the scope question, explicitly selected inclusion of session-stable random pattern/color/zoom in this change. Local release branch: appearance-release-20261126, from166239a. Original untracked Preview-Local.bat is preserved and excluded.

Implemented the26-pattern/26-palette curated catalog, fixed sunflower/signal home, distinct session-stable domain assignments and bounded phone crop/detail; staged/latest-owned GPU preparation; matching static contours; loading/failure cleanup; controlled gestures, stale-route ownership, quiet phone interaction and text wrapping. Added atomic readable polarity changes and Index background/focus isolation, including a control created after Index opens. Engine design and exact scope: docs/RESONANCE.md Round4.

VERIFIED HERE (owner PC): Node23 passed/0failed; source interaction9/9; full required desktop/mobile suite88passed/0failed/2existing intentional keyboard skips; hardware Chrome browser matrix10groups/0failed; all26 full SIM programs,3mixes×6steps×512particles, four intended fault controls killed; all26 rendered palette content/Index contrast cases pass; four assigned-mode mock queue cases and stale-owner control pass; old CSS polarity red1.02/1.15 versus current green14.80/16.73; five session-plan mutants rejected by intended assertions; both startup races pass. Repeated canonical bake byte-identical. Budget880.7KB total/900 and75.6KB app/80. Tools and receipts are described in README and docs/receipts/APPEARANCE-2026-11-26.md.

Failed checks retained as evidence: palette matrix twice flagged16 covered main-content nodes under Index; independent review identified missing isolation rather than bad palettes. Fixed the real accessibility boundary, then stage-separated scan passed. Early-open Index test exposed a late pitch control outside isolation; observer now captures it without overwriting prior states. Late device timeout test proves disposal. Original CSS polarity failure is frozen in a test fixture. A cooldown test initially waited beyond the intended rapid window; corrected fixture timing. First bake hash difference was CRLF-only; normalized text equal and canonical repeat exact. No caps/assertions weakened, no July visual snapshots updated.

Production remains9d1a0b7 on cloudflare-staging-anchor; origin/main89eac7b is older/archival. GitHub Pages API confirms main/root legacy publication at the project URL and no CNAME. This preparation targets integration into main while preserving its guard history; main publication and Cloudflare production promotion are distinct. Final commit/merge IDs and review verdict will be in the handback. No push or deploy performed. Final source is not physically tested on Kais's phone, Safari, Firefox or a weak GPU; preceding v5 phone feedback is qualitative only.
