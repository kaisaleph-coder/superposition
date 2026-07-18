# Iteration receipt — v1.1 (owner-directed changes I1–I5)

**Date:** 2026-07-18 · owner approved plan + the four design decisions (desktop nav =
wheel-at-edge; full résumé = header button; colors = pale hue per domain; 8th attractor =
TABLES dining floor).

## I1 — chrome & identity
- Removed all visible "superposition" copy (home eyebrow, back-links, hint), the
  `[LOCATION]` footer item, and the footer "Full record" link (footer now renders only
  owner-approved links; empty with placeholder data).
- New persistent `<header class="site">` on every view: name (brand, hidden on home
  where the monumental h1 carries it) + "Full résumé" pill button (hidden on the record
  page itself). Baked + runtime-rendered like all content (ADR-004).
- Domain pages: back-link "◂ home"; the domain name promoted to a monumental
  `.domain-title` heading. Record page retitled "Full résumé".
- Keys hint now 1–8; router key handling generalized to FACET_ORDER length.

## I2 — restaurant executive (TABLES)
- New domain `tables` inserted after `frame` in schema, FACET_ORDER/FACET_IDS,
  index.html section, rail (new 4-tables-and-aisle mark), MODES (pitch −0.46 —
  floor-plan view), gen-static, citizenship, engine (state count generalized: F facets
  + home; clusters index looked up, not hardcoded).
- Attractor: 4×5 round table-discs with slim pedestals on a floor plane, center aisle,
  12% of particles as a service stream along the aisle.

## I3 — domain navigation
- Touch: horizontal swipe (pointer events; >60 px, 2:1 horizontal, <600 ms) pages
  prev/next with wrap, like the arrow keys. Taps and vertical scrolls never trigger it.
- Desktop: wheel-at-content-edge — native scroll always wins; continued scroll past
  top/bottom (≥120 accumulated delta, 250 ms gesture window) pages domains, 900 ms
  cooldown, no wrap; wheel-up past the first domain returns home. Record page excluded.

## I4 — field recolor
- Every particle carries a static pale hue from its home domain (8-hue palette:
  mist blue, dove, sand, lavender, celadon, sage, powder, rose-grey). Home = multi-hue
  self-portrait; collapsed views ease the rest colors 65% toward the active domain's
  hue (uCast/uStateColor), giving each domain its own cast while text stays dominant.
  Velocity/focus still charge toward Klein-live; dark scheme brightens pastels ×1.18.
- Alpha raised 0.4→0.5 base (pale hues need slightly more presence).

## I5 — dynamics
- Per-domain idle motion, analytic and in-kernel (ADR-005-safe, deterministic in sim
  time): columns breathe, frame sways (more up high), tables' service floor drifts,
  lattice nodes pulse radially, surface waves roll, clusters bob per domain, vector
  streams upward, orbit rings genuinely revolve.
- Parallax: mouse (fine pointers) and gyro (`setParallax`; iOS behind a first-tap
  permission request) ease the camera ±~3.5°; off when no input; zero in test mode
  (determinism preserved).
- The field never dies: dossier dim 35%→60% opacity + slow 0.6 (was 0.5); record
  freeze replaced by faint drift (slow 0.3, opacity 32%).

## Verification
- Budget: 713.0 KB gz total / 900 · HTML+CSS+app JS 31.2 / 60 · vendor/fonts unchanged.
- Screenshots reviewed: header/title chrome, TABLES floor (sand cast), lattice
  (lavender cast), recolored home — text-over-field readability visibly improved.
- Full matrix re-baselined for 8 domains + recolor; final run results recorded in the
  commit message; suite includes new wheel-paging and swipe specs and the updated
  key-map (1–8) and tab-order (header → rail) assertions.
- Mobile rail compacted (38 px marks, 4 px gap) so 8 marks fit a 375 px viewport.
