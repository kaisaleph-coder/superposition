# Appearance release preparation — 2026-11-26

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
