# Website validation — locally prepared, not published

Generated 2026-11-26T21:38:10.358Z. Unmet: publication has not happened. Physical phones, Safari/Firefox, weak-GPU startup timing and the archival GitHub Pages project subpath remain unverified. No new independent agent review is claimed; the four-agent allowance was already spent.

The desktop hover correction and isolated wheel diagnosis are complete on the owner's PC. All positive final checks below pass. The earlier main-preparation hold is resolved; the branch remains local until an explicit publication instruction.

## Result and intended behavior

Bottom domain links activate page content, pattern, palette and framing only on click/Enter. Hover/focus preserves the current page and appearance. Explicit Index previews remain non-committing. The runtime delta against d94d17f is only removal of bottom-strip renderer preview listeners and their cleanup bookkeeping in js/field/resonance.js. Production js/main.js wheel behavior is unchanged.

The wheel sequence scrolls overflowing copy first, advances once at the boundary, rejects a rapid repeat inside its existing900ms cooldown, and accepts a later independent gesture. Seed0 is an ordinary stored appearance seed used to make control journeys repeatable; no seed/force QA parameter selects a sibling renderer for normal-GPU journeys. Random assignment and fresh-session variation have separate coverage. No input deadline, cooldown, acceptance cap, or intentional skip was relaxed.

## Fresh final evidence

| Claim | Command | Result |
|---|---|---|
| Complete required desktop/mobile suite | workflow nine-spec Playwright command | VERIFIED:90 passed,2 existing intentional mobile keyboard skips,0 failed |
| All normal-renderer control journeys | node tools/appearance-journey-qa.mjs | VERIFIED:15 passed,0 failed; all8 domains,14 dossiers on each of desktop/phone,24 phone page/size combinations, Index, System, history, pitch, résumé, normal-GPU print, mouse and wheel |
| Native phone sand/startup/gesture behavior | node tools/appearance-touch-qa.mjs | VERIFIED:10 passed,0 failed; completed GPU strike/mark work, charged hold, both drawing directions, scroll/swipe and actual pinch before/after drawing |
| Catalog/session plan, worker policy/imports/input | workflow Node command | VERIFIED:32 passed,0 failed |
| Keyboard/router/source input ownership | node tools/appearance-interactions.mjs . | VERIFIED:11 passed,0 failed |
| Native GPU wheel behavior | node tools/appearance-wheel-qa.mjs | VERIFIED:pass=true; rapid receipt gap150.7ms<900; copy scrolls, repeat stays on Tables, later gesture advances to Construction |
| CI native wheel behavior | node tools/appearance-wheel-qa.mjs --static --bundled | VERIFIED:pass=true; receipt gap189.6ms<900; same actual main.js wheel callback |
| Observer rejects a real broken cooldown | same command plus --broken-cooldown | VERIFIED:controlKilled=true; receipt gap237.4ms; named assertion rejects duplicate navigation to #view-frame instead of #view-tables |
| Canonical HTML and existing size caps | bake.mjs / git diff; budget.mjs | VERIFIED:no semantic bake diff;882.2KB/900 total and77.2KB/80 app, all caps pass |

The current public79-file runtime is byte-identical to the earlier hover candidate (runtime-parity.json). The preceding comprehensive pass on those same bytes also covered26 full SIM programs with4 killed fault controls,26 rendered palettes,10 desktop/mobile/storage/GPU-failure groups,3 isolated startup races,4 queued-program cases and5 plan mutants. Those catalog/fault receipts are retained as earlier evidence, not described as rerun in this final pass.

## Diagnosis and negative controls

On the broken hover source, the actual shared desktop browser kept home text/hash while switching sunflower/signal to another page's pattern/palette. The native GPU regression failed: "Bottom navigation hover changed appearance for columns". The corrected source passes the same hover check and positive click/Enter activation. Shared-browser before/after retained home/sunflower/signal with Resonance active.

The first wheel fixture failure was "Wheel cooldown allowed a second page". It awaited GPU settlement before a supposedly rapid repeat. Isolated replay measured1083.3ms between handler receipts, outside900ms: advancing again was allowed. The corrected native test delivers the repeat before awaiting rendering and asserts both the actual receipt interval and route. A route-intercepted browser-only mutant removes the900ms guard from the actual served main.js; it fails verbatim: "Rapid native repeat navigated twice", actual #view-frame versus expected #view-tables. The disk source is never mutated by this control.

The second old wheel journey failed "page.waitForFunction: Timeout16000ms exceeded" at renderer readiness, before wheel input. Its original cause remains unproven. Control fixtures now use a recorded seed, include complete startup DOM diagnostics, and close a failed setup context. Neither application startup limits nor fallback behavior changed. Final15/15 normal-renderer journeys include successful readiness on the controlled inputs. This is not a universal phone/GPU startup-time claim.

Earlier test-fixture failures are retained: a domain heading selector incorrectly requested h1 instead of h2; the responsive matrix passed after using the actual heading semantics. A print assertion assumed >500 characters although the authored record has425; the final test proves exact source-text preservation and all9 rows visible. One concurrent delayed-device fault probe timed out at12000ms; its isolated rerun preserved the limits, observed the late device, destroyed it and stayed static. Its concurrent-run cause is not proven.

Kais explicitly selected continued isolated diagnosis after the supplied two-failure escalation. The original failures, subsequent observations and all final receipts remain in the task workspace's wheel-resume-evidence/hover-release-evidence folders.

## Scope, main and publication

Runtime: js/field/resonance.js bottom hover bindings only. Tests: appearance.spec.js, appearance-browser-qa.mjs, new journey/wheel tools, lifecycle diagnostics in appearance-edge-qa.mjs, and CI normal plus broken-cooldown checks. Documentation: README, design note, worklog and this receipt. No content fact, curated choice, random-plan algorithm, shader math, runtime dependency, privacy behavior, hosting configuration or production wheel handler changed. Original untracked Preview-Local.bat is excluded.

Release branch appearance-release-20261126 preserves main's guard history. Fresh read-only fetch confirmed origin/main89eac7b; ancestry check passes. Live production remains9d1a0b7 on cloudflare-staging-anchor. Main publication and Cloudflare promotion are separate outward actions; no push, tag, PR, deploy or hosting-setting change was performed.
