# SUPERPOSITION — Design & Implementation Plan v1.3

**Project:** Personal resume site for [OWNER] — five-facet professional identity
**Codename:** SUPERPOSITION (internal; the public site is simply the person's name)
**Status:** EXECUTION PACKAGE v1.3 — single-agent, ONE-SHOT, ZERO user involvement; all decision points pre-resolved via autonomy ladders; owner inputs (§13) deferred by design
**Prepared:** 2026-07-17 · claude.ai design session
**Executor:** Claude Code — ONE agent, Claude Fable 5 at high effort, single uninterrupted session (§11). No subagents, no questions, no waits.
**Hosting:** GitHub Pages (free tier) — locked
**Prime directive:** One hard idea, executed clean, receipts for every byte.

---

## 1. Concept & Thesis

**The idea:** One GPU particle field is the entire visual identity of the site. The same ~100K particles never leave the screen — they *reorganize*. Each of the five professional facets (finance executive, AI/technical builder, investor/trader, entrepreneur, hobbyist) is an **attractor state**: a distinct 3D structure the field collapses into when that facet is selected.

**The receipt for the name:** the idle state is not a sixth design — it is the *weighted blend of all five attractors at low amplitude, simultaneously*. The metaphor is mechanically true: at rest, the identity exists in superposition; navigation collapses it into one observable state. The name is not a vibe, it is a description of the compute shader.

**Why this is the most technically impressive achievable output (the call):**
1. GPU compute is the 2026 frontier (WebGPU + TSL, WebGL fallback) — this puts it at the *center* of the experience, not as decoration.
2. Zero-asset geometry: all five attractors are procedural (SDF/parametric point sets generated in-shader or at boot). No model downloads. The Messenger doctrine — the byte budget is the thesis, not a constraint.
3. One system, five outputs — the engineering mirrors the content. A reviewer who views source finds the site's argument restated in the architecture.
4. Deliberate anti-Igloo choice: **all text is real DOM text.** Impressiveness lives in the physics; honesty lives in the typography. Recruiters, ATS parsers, screen readers, and Ctrl-F all get first-class content. This is a stated tradeoff, not an omission.

**Density doctrine (per owner brief):** light on details in most places, dense where needed. Surfaces are near-empty — a manifest of ≤5 lines per facet. Depth lives in expandable **dossiers** that open inline with dense, metric-heavy content. The homepage says almost nothing; the third click tells you everything.

---

## 2. Experience Specification

### 2.1 States

| State | Trigger | Field behavior | Content column |
|---|---|---|---|
| `superposition` (idle/home) | Landing, `Esc`, logo click | All 5 attractors blended, weights ≈0.2 each, slow breathing via curl noise | Name, one-line positioning, 5 facet marks, contact row. Nothing else. |
| `facet:{id}` ×7 | Facet mark click, keys `1–7`, arrow cycle | Weights animate → selected attractor 1.0, others 0 over ~1.1s (curl-noise flight path, velocity-mapped brightness) | Facet manifest (≤5 lines, monumental type) + dossier list (collapsed) |
| `dossier-open` | Dossier row click / `Enter` | Field dims to 35% opacity, slows 50% (content takes focus) | Dense block: role/project, span, 3–8 lines, metrics, links |
| `record` | "Full record" link, key `r` | Field freezes to faint still | Chronological CV, print-optimized layout |
| `static` | No JS, `prefers-reduced-motion`, WebGL init failure | Prerendered SVG of the superposition state as background | Everything works. Full content, full navigation. |

### 2.2 The five attractors

| # | Facet | Attractor name | Structure | Generation |
|---|---|---|---|---|
| 1 | Finance executive | **COLUMNS** | Ordered array of rising columns, staggered heights — capital structure as architecture | Parametric grid + height function |
| 2 | Construction executive | **FRAME** | Post-and-beam structural skeleton; topmost level deliberately incomplete — a build in progress | Orthogonal post/beam segment distribution |
| 3 | AI / technical | **LATTICE** | 3D node-edge graph, particles cluster at nodes, thin streams along edges | Fibonacci-sphere nodes + great-circle edges |
| 4 | Investing / trading | **SURFACE** | Undulating sheet — a volatility-surface / terrain manifold | Parametric u,v sheet + layered noise displacement |
| 5 | Skills | **CLUSTERS** | Gravitational domain clusters, mass ∝ skill count, faint inter-domain filaments — the field as dataset | Weighted ball sampling around domain centers + filament interpolation |
| 6 | Entrepreneur | **VECTOR** | Convergent ascending spiral — many scattered origins resolving into one rising trajectory | Logarithmic helix with radial capture field |
| 7 | Hobbyist | **ORBIT** | Playful constellation — 3–4 interleaved Lissajous orbital rings | Lissajous parametrics, per-ring phase offsets |

Each attractor doubles as its own **nav icon**: a 20px SVG of its silhouette (drawn once by the design pass, checked into `/assets/marks/`). Structure encodes content; no numbering (facets are not a sequence).

### 2.3 Home-state semantics (what the field shows on first load)

Every particle holds **permanent citizenship in exactly one facet**. At home, all seven attractors are co-resident at low spring stiffness and high wander — structure without resolution. The field is not decoration and not noise: each particle is already somewhere true, and navigation *reveals* structure rather than creating it. Production allocates citizenship **proportional to facet content mass** (a facet with more dossier material owns more of the field), so the superposition is a weighted self-portrait, not an even split. The boot sequence (uniform noise → superposition over ~2 s) reads as assembly. The only color logic anywhere: velocity maps ink → `--klein-live`; motion is charge.

### 2.4 Skills facet — field as dataset (CLUSTERS)

The one facet where particles are **data-bearing**. Each skill domain is a gravitational cluster; cluster mass and radius ∝ skill count; ~7% of particles render as faint filaments between declared-related domains. At production counts, particles map to individual skills with redundancy (≈300 skills → ~150–400 particles each). Opening a domain in the galley performs a **sub-collapse**: that domain's particles tighten (spring ×1.9) and charge toward `--klein-live`; unlike other facets, the field does **not** dim behind an open dossier here — the field is the content. The site's core gesture repeats fractally: site → facet → domain.

### 2.5 Interaction detail

- **Pointer:** soft repulsor (radius ~120px world-space); particles part around the cursor and heal behind it. Touch: same on drag.
- **Scroll within a facet:** scroll progress 0→1 subtly rotates camera orbit ±8° and tightens attractor convergence (field "firms up" as you read deeper). No scroll-jacking — native scroll always.
- **Keyboard:** `1–7` facets · `←/→` cycle · `Esc` home · `r` full record · `p` print · `.` pause field (battery courtesy). All focusable elements have visible focus rings.
- **Transitions:** facet-to-facet is one choreographed morph, never a page load (single-page, `history.pushState` per facet for deep links: `/#/lattice` etc.).
- **Idle courtesy:** field pauses on `document.hidden` and when canvas exits viewport (IntersectionObserver).

### 2.6 Voice & copy rules

Sentence case. Plain verbs. No self-praise adjectives — the metrics do the talking (copy states facts; dossier lines lead with numbers). Facet manifests are written as positioning statements, not job descriptions. Optional home microline (owner may cut): "One system. Five observable states." Errors/empty states give direction, never mood.

---

## 3. Design System

**Anti-default statement (binding):** This design must not resolve into any of the three current AI-default looks — (a) warm-cream + high-contrast serif + terracotta, (b) near-black + acid-green/vermilion accent, (c) broadsheet hairline-rule grid. The choices below were made against that list; the implementing agent must not drift back toward them during polish.

### 3.1 Palette — "iron gall on cold paper"

| Token | Hex | Role |
|---|---|---|
| `--paper` | `#F2F4F7` | Ground. Cold gallery white, faint blue cast — deliberately *not* warm cream |
| `--paper-deep` | `#E7EAF0` | Dossier wells, record page ground |
| `--ink` | `#10131A` | Text. Blue-black iron-gall ink, not pure black |
| `--ink-60` | `#4A5160` | Secondary text, captions |
| `--klein` | `#002FA7` | Accent. International Klein Blue — links, active facet mark, selection |
| `--klein-live` | `#2743FF` | Electric variant — particle brightness peaks, focus rings, live states only |

Particles render `--ink` at rest, shifting toward `--klein-live` proportional to velocity (fast = charged). One accent family, spent in one place.
Dark scheme (`prefers-color-scheme: dark`, P4): ground `#0C0E13`, ink `#E9ECF2`, particles pale, Klein unchanged. Light is canonical.

### 3.2 Typography — one voice, two axes

- **Archivo Variable** (self-hosted woff2, `wght` 100–900 × `wdth` 62–125) — the entire text voice. The type signature is the **width axis**: monumental headlines at `wght 800 / wdth 66` (compressed, architectural), eyebrows and labels at `wdth 118` with +12% tracking (wide, engraved). One file ≈ 70–90 KB subset does display, body, and UI.
- **Fragment Mono** (tiny subset, digits + caps ≈ 12 KB) — metrics, dates, data chips only. `font-feature-settings: "tnum"` where applicable.
- Scale: manifest display `clamp(2.6rem, 6vw, 5.2rem)`; body `1.0625rem/1.65` at max width `42ch`; eyebrow `0.75rem`.
- No serif anywhere. If either font fails to load, `system-ui` stack — layout must survive it (test in QA).

### 3.3 Layout

Full-viewport canvas as ground layer (`z:0`, `aria-hidden`). Content is a **single left galley** — `max-width 42ch`, offset from left edge by `clamp(24px, 7vw, 120px)` — floating over the field like a typeset column laid on a plate. Facet marks: fixed vertical rail, right edge, 5 SVG silhouettes. Contact row and "Full record" pinned in a quiet footer band. Mobile (<720px): galley full-width with 20px gutters, facet rail becomes a bottom bar, particle tier drops (§6.4).

```
┌────────────────────────────────────────────┐
│  ▓▓ field (full viewport, behind)      ◇  │
│  ┌──────────────┐                      ◆  │ ← facet rail
│  │ galley 42ch  │                      ◇  │   (5 marks)
│  │ manifest     │                      ◇  │
│  │ dossiers…    │                      ◇  │
│  └──────────────┘                          │
│  contact · full record            (footer) │
└────────────────────────────────────────────┘
```

### 3.4 Motion rules

The field is the only ambient motion. DOM motion is limited to: dossier expand (180ms ease-out height+fade), facet content crossfade (240ms, staggered 40ms), focus transitions. Nothing else animates. `prefers-reduced-motion`: field → static SVG, DOM transitions → instant. The one orchestrated moment: first load, particles boot from uniform noise into superposition over 2.0s (skipped on reduced-motion and repeat visits within session).

---

## 4. Information Architecture & Content Model

### 4.1 Site map

```
/               superposition (home)
/#/columns      finance executive
/#/frame        construction executive
/#/lattice      ai / technical
/#/surface      investing / trading
/#/clusters     skills
/#/vector       entrepreneur
/#/orbit        hobbyist
/#/record       full chronological record (print target)
404.html        field in static form + "no such state" + home link
```

### 4.2 Content schema — `content/resume.data.js`

Script-tag data pattern (`window.__RESUME__ = {...}` via classic `<script src>` — CORS-safe on static hosting, no fetch, no build). Single source of truth; the record page and all facets render from it.

```js
window.__RESUME__ = {
  identity: {
    name: "",            // display name — OWNER INPUT
    positioning: "",     // one line under the name, ≤90 chars
    location: "",        // granularity is owner's choice, e.g. "New York metro"
    links: [ { label: "GitHub", href: "" } ]   // only what owner approves public
  },
  facets: [
    {
      id: "columns", name: "Finance executive", attractor: "COLUMNS",
      manifest: ["", "", ""],          // ≤5 lines, ≤70 chars each — the light layer
      dossiers: [                       // the dense layer
        {
          title: "", org: "", span: "",      // e.g. "2019 — present"
          lines: ["", ""],                    // 3–8 dense lines, metrics-first
          metrics: [ { k: "", v: "" } ],      // rendered as Fragment Mono chips
          links: [ { label: "", href: "" } ]  // receipts: repos, writeups, press
        }
      ]
    }
    // …frame, lattice, surface, clusters, vector, orbit — same shape.
    // clusters (skills) dossiers instead use: { domain, count,
    //   tiers: { core: [], working: [], familiar: [] }, related: ["domainId"] }
  ],
  record: { order: ["chronological entries derived or hand-authored"] },
  meta: { updated: "2026-07-17", pdfNote: "print view is the canonical one-pager" }
};
```

**Placeholder policy:** the fleet builds and tests against clearly-fake placeholder data (`"[ROLE]"`, `"[METRIC 12.3%]"`). Real content is dropped in at P1-gate without code changes. Placeholder strings must be visually unmistakable so an unfilled field can never ship silently — QA greps for `[` in rendered DOM at P5.

**Skills content rule (binding):** no bars, no percentages, no word clouds, no radar charts — those encode either fake precision or noise. The galley renders each domain as an expandable row with a Fragment Mono count chip; inside, skills run as **comma-set prose in three typographic tiers** — core (700 weight, `--ink`), working (400, `--ink`), familiar (400, `--ink-60`). Hierarchy is encoded honestly in type, never in invented numbers. Production adds type-to-filter across all domains (filter input collapses the field toward matching domains as you type).

---

## 5. Technical Architecture

### 5.1 Stack (locked)

- **Static. No framework. No build step for the site.** Hand-authored ES modules. `npm` exists only for dev tooling (Playwright, budget script) — `node_modules` gitignored, site never depends on it.
- **three.js** vendored into `/vendor/` (pinned release, WebGPU build). No CDN at runtime — the repo is self-contained.
- Rendering: `WebGPURenderer` + **TSL** node materials/compute; automatic WebGL2 backend fallback is three's built-in behavior.
- Fonts self-hosted, subset. Zero third-party requests of any kind at runtime. No analytics (privacy default; owner may add later).

### 5.2 Renderer strategy — ADR-001 + mandatory P0 spike

Primary path: TSL compute pass updates particle position/velocity storage buffers on WebGPU.
**Open question (spike, ≤half day):** verify whether our compute graph translates cleanly through the WebGL2 backend of `WebGPURenderer` at target particle counts. Two receipts decide the branch:
- **Spike passes** → single TSL codebase, both backends. Delete fallback plan.
- **Spike fails or underperforms** → keep TSL for WebGPU; implement WebGL path as classic FBO ping-pong GPGPU (positions/velocities in float textures, fragment-shader integration — the proven Igloo-era technique) behind the same `FieldEngine` interface. Interface below is designed so either branch is invisible to the rest of the app.

### 5.3 Field engine spec

```
js/field/
  engine.js      // FieldEngine: init(canvas, tier) → {setWeights(w[5]), setPointer(x,y),
                 //  pause(), resume(), dispose(), state} — the ONLY public surface
  attractors.js  // 5 pure functions: (i, N, t) → target position for particle i
                 //  + blendTarget(p, weights) — normalized weighted target
  sim.tsl.js     // TSL compute: force = k1*(blendTarget - pos)        (attractor spring)
                 //              + k2*curlNoise(pos*s, t)              (life)
                 //              + k3*pointerRepulse(pos, cursor)      (interaction)
                 //  vel = (vel + force*dt) * damping ; pos += vel*dt  (semi-implicit Euler)
  render.tsl.js  // instanced point sprites; size ∝ clamp(speed); color mix(ink, kleinLive, speed)
  pointer.js     // pointer→world-space projection, touch handling
```

Choreography: `setWeights` eases weights with per-facet stagger so morphs read as *flight*, not tween. Home = `[0.2 ×5]`. Determinism: seeded PRNG for initial positions so visual-regression screenshots are stable (seed fixed in test mode via `?seed=`).

### 5.4 Capability tiers

| Tier | Condition | Particles | Notes |
|---|---|---|---|
| T1 | WebGPU, desktop-class | 131,072 | Full effects |
| T2 | WebGPU, mobile | 49,152 | Reduced sprite size |
| T3 | WebGL2 fallback, desktop | 65,536 | Branch per ADR-001 |
| T4 | WebGL2, mobile | 16,384 | |
| T0 | No JS / reduced-motion / init failure | 0 | Static SVG ground; site fully functional |

Tier detection at boot; active tier + renderer written to `<body data-renderer data-tier>` (QA hooks, §10). Downshift one tier if sampled FPS < 45 for 3s.

### 5.5 Repository layout

```
/
  index.html          404.html
  css/  main.css  print.css
  js/   main.js  router.js  render-dom.js  field/…(§5.3)
  vendor/ three.webgpu.min.js  (pinned, licensed)
  content/ resume.data.js
  assets/ fonts/*.woff2  marks/*.svg  og.png  favicon.svg  field-static.svg
  tests/  *.spec.js  playwright.config.js
  tools/  budget.mjs        # gzip-aware byte report per file + total, fails > cap
  README.md               # runbook (§9)
  .github/workflows/qa.yml  # optional CI receipts (§9)
```

### 5.6 DOM state contract (binding, per owner's testing convention)

All app state that tests or CSS care about is mirrored to DOM attributes — **never** read from module internals or `window` globals:
`<body data-state="superposition|facet|dossier|record" data-facet="columns|…" data-renderer="webgpu|webgl|static" data-tier="0–4" data-paused>`. Playwright asserts exclusively on DOM.

---

## 6. Performance Budget (receipts required)

| Metric | Cap | Measured by |
|---|---|---|
| Total transfer, cold load (gzip) | **≤ 900 KB**; hard fail 1.2 MB | `tools/budget.mjs` in CI + P-gates |
| Of which vendor three.js | ≤ 340 KB gzip (measure at P0; if exceeded, ADR-001 fallback branch: classic WebGL build ≈ 170 KB) | budget.mjs |
| Fonts | ≤ 105 KB total | budget.mjs |
| HTML + CSS + app JS | ≤ 60 KB | budget.mjs |
| First contentful paint (content layer) | < 1.0 s (Fast-3G lab) | Lighthouse |
| Field boot to first frame | < 2.5 s desktop | perf mark |
| Frame rate | 60 fps T1/T3 desktop, ≥ 30 fps mobile | rAF sampler in test mode |
| Lighthouse (Perf/A11y/BP/SEO) | ≥ 95 each | Lighthouse CI |
| Main-thread long tasks after boot | 0 > 50 ms | trace at P4 |

Loading order: inline critical CSS → content HTML renders complete (no JS required) → `resume.data.js` → app JS `defer` → field engine dynamic-imported *after* first paint. The field is a progressive enhancement in the literal load order.

---

## 7. Accessibility

- Canvas `aria-hidden="true"`; the DOM is the complete experience.
- Semantic landmarks (`header/nav/main/footer`), one `h1`, facet pages `h2`.
- Full keyboard operability (§2.3); visible `:focus-visible` rings in `--klein-live`; skip-link.
- Dossier expanders: `<button aria-expanded>` + region; arrow-key support within rail.
- Contrast: all text pairs ≥ 4.5:1 (`--ink` on `--paper` ≈ 15:1; verify `--ink-60` ≥ 4.5:1 at final values).
- `prefers-reduced-motion` → T0 path, instant transitions. `prefers-color-scheme` respected.
- Screen-reader pass at P4 (NVDA or VoiceOver walkthrough is a named QA task).

## 8. SEO, Meta, Print

- JSON-LD `Person` (+ `sameAs` links owner approves); title/description per facet route via JS with static defaults in HTML.
- OG/Twitter card: `assets/og.png` — a rendered still of the superposition state with name typeset (produced at P4 from the actual engine, 1200×630).
- Favicon: five-dot mark (the five attractors as dots, one Klein).
- **Print (`p` / Ctrl-P):** `print.css` collapses everything to a typeset **one-page** chronological resume — galley typography, no field, links as visible URLs, `--ink` on white. The print view is the canonical "PDF": zero divergence risk because it renders from the same data. QA snapshots it (§10).

## 9. Hosting & Deployment

- **GitHub Pages**, public repo, deploy from `main` root. No Actions required to ship.
- Optional (recommended) `qa.yml` on push: budget.mjs, Playwright (chromium), Lighthouse CI, dead-link check — green checks as public receipts on the repo.
- Domain: `<user>.github.io/<repo>` at launch (fully free). Custom domain is a 10-minute CNAME follow-up if ever wanted; not in scope.
- README runbook: local dev (`npx serve` or `python -m http.server`), test commands, content-update procedure (edit `resume.data.js`, push), tier/seed query flags, license notes for three.js + fonts (OFL).

## 10. QA Plan — Playwright, DOM-state only

Matrix: chromium desktop + chromium mobile-emulation (+ webkit desktop if runner allows).

1. **Content integrity:** every schema field renders; no `[` placeholder residue; record page complete; all links resolve (dead-link check).
2. **State machine:** keys `1–7/←/→/Esc/r` drive `data-state`/`data-facet` correctly; deep links (`/#/lattice`) restore state; history back/forward works.
3. **Fallbacks:** JS-disabled context → full content + static SVG; `reduced-motion` → `data-tier="0"`; forced WebGL (`?force=webgl`) → `data-renderer="webgl"`.
4. **Visual regression:** fixed-seed screenshots — superposition + each facet settled + dossier open + record + print snapshot (light & dark).
5. **Perf smoke:** in `?seed` test mode, rAF sampler ≥ 55 fps median over 5s on desktop runner; budget.mjs under caps.
6. **A11y:** axe-core scan zero critical; tab-order snapshot; focus-visible screenshots.

## 11. Execution Plan — single-agent Claude Code session (Fable 5, high effort)

**Constraint (owner-set, v1.2):** ONE agent. No subagents, no parallel fleet, no delegated tasks. The four former fleet roles collapse into **sequential hats worn by the same agent** — ARCHITECT (structure, decisions) → FIELD (engine) → GALLEY (content layer, design) → VERIFIER (gates) — with the VERIFIER hat mandatory at every gate: attempt to *fail* your own gate before passing it.

**Session discipline:**
- Authority chain: this PLAN is law → EXECUTE.md is process → GATES.md is live state → reference/superposition-preview.html is the owner-approved behavioral reference.
- Strict phase order P0→P5. A phase begins only when the prior gate's receipts exist on disk in `docs/receipts/`.
- Gate procedure: run checks → write receipts → update GATES.md → commit `gate(PX): <summary>` → adversarial VERIFIER pass → proceed.
- Context hygiene: receipts live on disk, never only in conversation. GATES.md must always let a cold session resume from the repo alone.
- Re-read the relevant PLAN sections at each phase start; do not implement from memory of them.
- Before styling work, consult the ui-ux-catalog MCP if registered — catalog informs, this packet decides.
- **Pre-authorized waivers (owner):** P1 ships with [PLACEHOLDER] content (real resume deferred); P3 CLUSTERS ships with placeholder domain counts (real skills inventory deferred). No other deviation from PLAN without stopping to ask.
- **One-shot protocol (v1.3):** ZERO user involvement — the agent never asks, never pauses, never waits. Every decision point resolves through the Autonomy Protocol in EXECUTE.md: priority stack (PLAN text → prototype fidelity → budget → a11y → anti-default clause → visual fidelity) plus pre-authorized Ladders A–D (renderer, fonts, verification tooling, deploy). Ladder D: if `gh auth status` shows an authenticated account, creating the PUBLIC repo `superposition`, pushing, and enabling GitHub Pages is PRE-AUTHORIZED (content is 100% placeholder); otherwise the run terminates deploy-ready with DEPLOY.md containing the owner's single push command. The run's only termination condition is `docs/receipts/RUN-REPORT.md` written after P5 receipts.

**Phases & gates (sequential, gate = hard stop with receipts):**

| Phase | Scope | Gate (all required) |
|---|---|---|
| **P0 Foundations** | Scaffold, vendor three (pinned), budget.mjs, ADR-001 spike, tier detect, placeholder data | Page serves; budget report runs; **ADR-001 decided with measured numbers**; vendor gzip size recorded |
| **P1 Content layer** | Full semantic HTML/CSS from schema, print.css, static SVG, router, 404 | Lighthouse ≥ 95 with field disabled; print snapshot approved; no-JS walkthrough passes; **owner content merged** — placeholder-ship waiver PRE-AUTHORIZED (v1.2) |
| **P2 Field engine** | Engine + superposition idle on decided branch, pointer, pause courtesy | 60/30 fps per tier on reference hardware; fallback + T0 verified; memory stable over 5-min soak |
| **P3 Choreography** | 5 attractors, morph flights, scroll/keyboard integration, deep links | All transitions < 1.3 s and readable; state-machine spec green; downshift logic proven |
| **P4 Polish** | Micro-typography, dark scheme, OG/favicon, JSON-LD, copy pass, **screenshot self-critique vs §3 anti-default statement**, SR walkthrough, long-task trace | Full Playwright matrix green; axe zero-critical; budget ≤ 900 KB; A4 adversarial signoff |
| **P5 Ship** | Pages deploy, optional qa.yml, README runbook, tag `v1.0.0` | Deploy-ready; auto-push + Pages + live-URL verification iff `gh` authenticated (Ladder D), else DEPLOY.md; RUN-REPORT.md written; receipts archived in `/docs/receipts/` (budget report, LH JSON, screenshot set) |

**Definition of done (one-shot):** all gates green with receipts archived, ≤ 900 KB, Lighthouse ≥ 95 (or Ladder-C substitute receipt), content pipeline exercised end-to-end with placeholders, RUN-REPORT.md written — plus live GitHub Pages URL if Ladder D auto-deploy ran, else DEPLOY.md with the owner's single command. Real content later is a data-only change — zero code.

## 12. Risk Register

| Risk | L | Impact | Mitigation |
|---|---|---|---|
| three WebGPU bundle busts budget | M | budget | Measured at P0; ADR-001 branch to classic WebGL build (~170 KB gz) — concept survives at T3/T4 counts |
| TSL-on-WebGL2 compute gaps | M | schedule | P0 spike is first task; FBO ping-pong fallback pre-designed |
| Mobile thermals / battery | M | UX | Tiering, FPS downshift, pause-on-hidden, `.` pause key |
| Attractors read as blobs, not glyphs | M | concept | P3 gate includes silhouette legibility check at 50% zoom screenshot; tune point size/convergence per attractor |
| Polish drifts into AI-default look | L | brand | §3 anti-default statement is a named P4 gate check |
| Seed nondeterminism breaks VR tests | L | QA | `?seed=` test mode fixed at P2 |
| Content leaks something non-public | M | privacy | Only `resume.data.js` renders; owner reviews it as a single file before P5; no analytics |

## 13. Open Owner Inputs (only blockers)

1. **Resume source material** — current resume/CV + which projects and metrics are public-safe. Needed at **P1 gate** (build starts without it).
2. **Identity surface** — display name, public links (GitHub/LinkedIn/email?), location granularity.
3. **Constraint confirmations** — strict one-page print (assumed yes) · no analytics (assumed yes) · anything ATS-specific.
4. **Skills inventory** — domain list, skills per domain, tier assignment (core / working / familiar), and declared domain-relatedness pairs (drives the filaments). Needed at **P3 gate**; CLUSTERS builds against placeholder counts until then.

Everything else in this packet is decided. Vetoes accepted until P0 starts; after that, changes go through a gate.

---
*Changelog: v1.0 — initial full packet (concept, design system, architecture, budgets, QA, fleet plan).*
*v1.3 — ONE-SHOT amendment: zero user involvement; hard stops replaced by pre-authorized autonomy ladders (A renderer, B fonts, C verification tooling, D deploy); conditional auto-deploy via authenticated `gh` to PUBLIC repo `superposition`; mandatory RUN-REPORT.md as the sole termination condition; PROMPT.md added to package.*
*v1.2 — execution restructured to a SINGLE agent (Fable 5 high) with sequential role hats; placeholder-ship waivers pre-authorized for P1/P3; P5 push made owner-performed; handoff package composed (CLAUDE.md / EXECUTE.md / GATES.md / schema starter / ADR stub / prototype reference).*
*v1.1 — +FRAME (construction executive) and +CLUSTERS (skills) attractors → seven states; home-state semantics formalized (content-mass particle citizenship); skills specified as field-as-dataset with sub-collapse + three-tier typeset index (no bars/clouds/radar); routes and keys extended to 1–7; skills inventory added as owner input at P3.*
