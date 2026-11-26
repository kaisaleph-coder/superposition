# Appearance release preparation — 2026-11-26
## Superseding phone regression check

After the first prepared preview, Kais reported that tapping, holding and dragging the sand did nothing, and a different pattern appeared at startup. Those reports reopen the earlier readiness statement. The old source check asserted that all touch must be ignored; it tested the wrong intent. The replacement distinguishes ordinary movement from deliberate touch and adds native Chrome/Pixel7 input. No prior numerical acceptance threshold was relaxed.

Before: native input reproduced four named failures: "Approximate SVG was visible before the real sunflower", "Finger tap produced no completed GPU strike", "Hold produced no completed GPU mark upload", and "Drag produced no completed GPU mark work". Three ordinary gesture controls passed.

After: native10/10 pass, with submitted/completed GPU strike and mark work, a charged hold, vertical and short horizontal drawing, normal scrolling/swiping, cancellation, and actual pinch zoom before/after ownership. Horizontal drawing is required to finish within the route swipe's600ms window. Taps strike; a stationary350ms hold claims drawing. A second finger relinquishes it. Mouse ownership, copy, controls, visibility and disposal are covered by arbitration checks. Approximate SVG is hidden throughout animated startup; only the real field is revealed. A final watchdog fallback refuses a late renderer module or initialization.

VERIFIED HERE (owner PC, headless Chrome; physical phone still pending):32 Node tests/0 failed,11 source interaction checks/0 failed; full required suite88 passed/0 failed/2 existing intentional mobile keyboard skips; native10/0; hardware browser/randomization10/0; startup races3/0; all26 SIM programs and4 killed fault controls; four queue cases and stale-owner control; old/current CSS polarity red/green. Static smoke returned errors=[] and logs=[]. Existing budget caps pass:882.3KB/900 total and77.2KB/80 app. Canonical bake has no semantic diff.

Independent bounded adversarial re-review: NO-OBJECTION after actual artifacts and read-only reruns. It does not certify physical phones, Safari/Firefox, weak-GPU timing or the archival GitHub Pages project subpath. No push or deploy.

Raw before/after and current manual receipts are preserved outside the public preview. New persistent commands: node --test tests/touch-input.test.mjs; node tools/appearance-touch-qa.mjs; node tools/appearance-edge-qa.mjs.

One tightened fixture initially failed verbatim: "Drawing fixture did not overlap the swipe time window: 601.7000000476837". The path was shortened to two moves totaling120px after a360ms hold; the >=350ms and <600ms assertion remains. Final native10/10 passes.


| Corrected claim | Command | Fresh result |
|---|---|---|
| Native sand input and startup | node tools/appearance-touch-qa.mjs | VERIFIED: {"passed":10,"failed":0} |
| Touch arbitration and runtime source | workflow Node command; node tools/appearance-interactions.mjs . | VERIFIED:32 passed/0 failed;11 passed/0 failed |
| Required browser behavior | workflow nine-spec Playwright command | VERIFIED:88 passed (2.5m),2 skipped,0 failed |
| Randomization/failure matrix | node tools/appearance-browser-qa.mjs http://127.0.0.1:8080 | VERIFIED: {"passed":10,"failed":0} |
| Actual GPU pattern math | node tools/appearance-gpu-qa.mjs | VERIFIED:complete=true,modes=26,controlsKilled=4,errors=[] |
| Final fallback races | node tools/appearance-edge-qa.mjs | VERIFIED:three PASS lines, exit0 |
| Queue and readable polarity | node tools/appearance-transitions-qa.mjs | VERIFIED:complete=true,queueCases=4,staleControl caught,errors=[] |
| Existing transfer caps | node tools/budget.mjs | VERIFIED:882.3KB/900 total;77.2KB/80 app, both ok |

## Earlier preparation evidence (superseded above for phone input/startup)


Unmet: nothing has been pushed or deployed; production remains on the prior release. The new randomization has not been physically tested on Kais's phone, Safari or Firefox. Kais reported the preceding v5 phone preview was better; that is qualitative feedback, not a measured phone startup time.

## Delivered behavior

- Fixed sunflower/white-orange home. Twenty-six retained patterns and complete palettes; requested exclusions removed.
- Eight distinct per-session domain assignments, stable on refresh/revisit; bounded pitch/crop/rotation with conservative phone adaptation. No frame-by-frame reroll, analytics or visitor identifier.
- Staged GPU preparation, latest-request ownership, assigned hover/click behavior and matching static fields. Text remains available during loading/failure.
- Controlled gestures and route transitions; no ordinary touch/gyro steering; copy wrapping and readable palette changes.
- Index background isolation/focus restoration, including controls created during GPU startup.

## Evidence map

All commands below ran locally on the owner's PC; browser tests use emulation, not physical phones. Raw receipts are gitignored under test-results/appearance-release.

| Claim | Command / receipt | Observed result |
|---|---|---|
| Core source and appearance rules | Node test files in README | 23 passed, 0 failed |
| Keyboard/router/pointer regressions | appearance-interactions.mjs | 9 passed, 0 failed |
| Session-plan tests detect wrong behavior | appearance-plan-mutations.mjs | control green; five intended assertion failures caught |
| Full required browser suite | workflow's nine spec files | 88 passed, 0 failed, 2 pre-existing intentional mobile keyboard skips |
| Desktop/mobile, storage and GPU failures | appearance-browser-qa.mjs | 10 groups passed on final source |
| Full SIM math/bindings | appearance-gpu-qa.mjs / gpu.json | 26 modes ×3 mixes ×6 steps ×512 particles pass; four fault controls killed; final receipt records exact source hashes |
| Assigned-mode ownership/polarity | appearance-transitions-qa.mjs | four queue cases pass; stale-owner mutant caught; old CSS fails at1.02/1.15:1, current CSS passes at14.80/16.73:1 |
| All palette text surfaces | appearance-palette-qa.mjs | 26 palettes passed for content and open Index; stage-separated receipts |
| Late-control and device-timeout races | appearance-edge-qa.mjs | both cases pass; late-control case failed before isolation fix |
| Canonical static content | two consecutive bake runs | byte-identical after canonical bake |
| Existing size caps | budget.mjs | 880.7KB total/900; 75.6KB app/80, final application size; documentation excluded by the existing budget gate |

The older visual snapshot set dates from July and is intentionally not regenerated or offered as proof. Hardware compute completion does not prove displayed animation, sustained phone frame rate or cross-browser support. The sampled static contours are a designed fallback, not an animation-speed proxy.

## Failures found and resolved

The original queued-pipeline fixture reproduced a non-atomic rebind failure; current activation constructs the group before swapping. The old CSS polarity transition produced near1:1 foreground contrast; the current transition fixture retains the old red control. A broader palette scan twice reported16 dimmed background nodes under Index. Independent review identified missing background isolation, not26 bad palettes. After fixing that state boundary, the unchanged palette matrix passes. Opening Index during GPU startup then exposed a late-created pitch control; the new observer preserves/restores each root's prior state and the race passes. Late GPU devices are destroyed after timeout.

A first mobile cooldown check was mis-timed after awaiting shader preparation; corrected to truly consecutive events. The first bake byte check differed solely by183 CR line endings from base CSS; normalized content was equal, and repeated canonical bakes are identical. A static contour generator initially rejected positive-distance fields with no sign crossing; it now deliberately samples near-zero contours. No assertion or existing size cap was weakened.

## Main and rollback

Release branch: appearance-release-20261126. Base166239a contains the currently deployed9d1a0b7 and two worklog-only commits. origin/main89eac7b has additional guard/archival metadata changes. Preparation must preserve those guards while retaining current canonical production metadata and truthful documentation. No force push is planned. Final local commit/merge IDs and independent review verdict belong in the worklog/handback.

Before any outward action, refresh the named remote heads, require a clean owned release diff, verify the exact prepared head is a descendant of target main, and obtain the owner's explicit push instruction. Push/main CI and promotion of cloudflare-staging-anchor are separate actions. Production rollback target remains9d1a0b7; preserve it rather than resetting or deleting history. A revert or a reviewed corrective release should restore that tree if a future deployment needs reversal.

GitHub API read confirmed Pages uses main/root (legacy build), no custom domain; main protection read returned “Branch not protected” (HTTP404). The release suite validates the canonical site at a host root, not the archival GitHub Pages project subpath. Any main publication affects that archival copy; it does not by itself promote the existing Cloudflare production branch. No setting was changed.
