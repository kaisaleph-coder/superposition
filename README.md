# SUPERPOSITION

Source project for **Kais Abu-Hussein's** personal identity, résumé and portfolio site.

**Canonical live site:** https://kaisabuhussein.com/

The site uses a static-first semantic document with a progressively enhanced generative field. Primary identity and résumé content remain readable without the graphics runtime; the visual system is an enhancement rather than the document source.

## Current public architecture

- Canonical identity URL: `https://kaisabuhussein.com/`
- Canonical résumé URL: `https://kaisabuhussein.com/resume/`
- Cloudflare Workers + static assets
- Hand-authored ES modules
- three.js WebGPU/WebGL runtime vendored locally
- Self-hosted fonts
- No third-party runtime requests
- No client-side analytics
- Reduced-motion and static fallbacks
- Keyboard-accessible semantic content

The repository contains development history across multiple branches. The deployed production release and canonical domain are authoritative; the legacy GitHub Pages copy is intentionally non-indexable and canonicalizes to the production site.

## Local development

```bash
python -m http.server 8080
```

Dev tooling is npm-based but the public site itself has no framework build dependency.

Useful checks include:

```bash
node tools/budget.mjs
npx playwright test --config tests/playwright.config.js
```

## Accessibility and fallbacks

The canvas is decorative and `aria-hidden`. Semantic DOM content is the primary experience. No-JavaScript, reduced-motion, low-capability and initialization-failure paths retain the full readable document and navigation.

## Licenses

- three.js — MIT
- Archivo and Fragment Mono — SIL OFL 1.1
