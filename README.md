# SUPERPOSITION

Personal website at https://kaisabuhussein.com. The homepage keeps its sunflower spirals and white/orange palette. Eight domain pages receive distinct pattern assignments, a complete curated palette and bounded framing/detail for each browser-tab session. Refreshing or returning to a page preserves its assignment.

The site uses static HTML, CSS and native ES modules with no runtime npm dependency. Hardware WebGPU runs the sand simulation; a lightweight SVG field supports reduced motion, unsupported hardware or failure. Animated startup reveals only the real GPU pattern, with readable content available immediately. Real content and the printable résumé remain ordinary semantic HTML. Fonts and assets are self-hosted; no analytics or visitor identity is added.

## Run locally

```sh
node tools/serve-secure.mjs . 8080
```

Open http://127.0.0.1:8080. This local server applies the production CSP except HTTPS upgrading. QA flags: ?force=static, ?force=webgl, ?seed=123 and ?timing=1. Explicit seeded QA preserves the older deterministic renderer path; the normal visitor path runs Resonance.

Bottom domain links change page and appearance on click/Enter; hovering or focusing them preserves the current page.

Keyboard: 1–8 domains, arrows to cycle, Escape home/close, r standalone résumé, p print. Index contains keyboard focus while open. A deliberate horizontal swipe advances one page; vertical scrolling, pinch/cancelled gestures, controls and rapid repeats do not. On the sand, tap to strike, hold to gather and charge, then drag after the hold to draw. Movement before the 350ms hold remains a page gesture. A second finger releases drawing for native pinch zoom. Phone orientation does not steer the sand.

## Development and release checks

Node/npm are development tools only. Install the pinned tools with npm install and npx playwright install chromium. Required source/browser checks live in .github/workflows/qa.yml. Start the local server before manual browser tools.

- node tools/budget.mjs — existing 900 KB total and 80 KB app gzip caps.
- node tools/bake.mjs — synchronize semantic HTML after changing content or base CSS; commit the bake output.
- node --test tests/worker-edge.test.mjs tests/performance-policy.test.mjs tests/module-graph.test.mjs tests/appearance.test.mjs tests/touch-input.test.mjs
- node tools/appearance-interactions.mjs .
- npx playwright test --config tests/playwright.config.js content.spec.js appearance.spec.js state.spec.js print.spec.js a11y.spec.js s4-integration.spec.js seo-p0.spec.js metadata-schema.spec.js browser-runtime-evidence.spec.js --ignore-snapshots
- node tools/appearance-journey-qa.mjs — all15 real-renderer control journeys, with a recorded seed0; --appearance-seed=N selects another reproducible plan.
- node tools/appearance-wheel-qa.mjs — isolated native scroll/boundary/cooldown checks; --static --bundled runs in CI, and --broken-cooldown must reject duplicate navigation.
- node tools/appearance-browser-qa.mjs http://127.0.0.1:8080 — real hardware Chrome desktop/mobile and failure cases.
- node tools/appearance-gpu-qa.mjs — all 26 full SIM programs and four fault controls; requires hardware WebGPU.
- node tools/appearance-transitions-qa.mjs — assigned-mode races, stale-owner control and frozen old/current CSS polarity contrast.
- node tools/appearance-edge-qa.mjs — Index during startup, late device disposal and final watchdog fallback.
- node tools/appearance-touch-qa.mjs — native phone tap/hold/drawing, scrolling, swiping and pinch, with completed GPU work assertions (Chrome with WebGPU).
- node tools/appearance-plan-mutations.mjs — regression observers reject deliberately broken plan behavior.
- node tools/appearance-palette-qa.mjs — all 26 rendered palettes on page copy and Index.

Manual tool receipts and screenshots are written under test-results/appearance-release and test-results/appearance-touch (gitignored). The older visual snapshots predate this design and are not refreshed by this change.

## Hosting and branch preparation

At preparation time, the live Cloudflare release is 9d1a0b7 on cloudflare-staging-anchor. main is older and historically served an archival GitHub Pages copy. The appearance-release-20261126 branch prepares the current site for integration into main; preparation does not push or deploy. Moving main alone must not be represented as updating the existing Cloudflare production branch. Preserve main's guard changes when integrating its history.

Latest validation and limitations: docs/receipts/WEBSITE-VALIDATION-2026-11-26.md. Earlier release evidence: docs/receipts/APPEARANCE-2026-11-26.md. Engine/appearance design: docs/RESONANCE.md. Content source: content/resume.data.js.

## Licenses

Vendored three.js is MIT. Archivo and Fragment Mono use SIL OFL 1.1. No external runtime requests are required.
