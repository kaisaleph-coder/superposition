# EXECUTE.md — one-shot single-agent execution brief (v1.3)

**Model:** Claude Fable 5, high effort. **One agent. One session. Zero user involvement.**
**Mission:** implement PLAN.md (SUPERPOSITION v1.3) from this seed through P5, ending with
`docs/receipts/RUN-REPORT.md`. The user will not answer questions — none may be asked.

## Role hats (sequential, same agent)
ARCHITECT (structure, decisions) → FIELD (engine) → GALLEY (content layer, design) → VERIFIER (gates).
The VERIFIER hat is mandatory at every gate: **attempt to fail your own gate before passing it.**

## Phase loop — for each of P0…P5
1. Re-read the relevant PLAN.md sections. Do not implement from memory of them.
2. Build the phase scope (PLAN §11 table).
3. Run gate checks: §11 gate column + §6 budget (`node tools/budget.mjs`) + relevant §10 tests.
4. Write receipts → `docs/receipts/PX-*.md` (measurements, decisions, screenshot refs).
5. Update GATES.md.
6. Commit `gate(PX): <summary>`.
7. VERIFIER adversarial pass. Only then proceed.

## Autonomy Protocol (v1.3) — never ask, never wait
Resolve every decision, in order; record each nontrivial resolution as `docs/receipts/ADR-nnn-*.md`:
1. Explicit PLAN.md text.
2. Behavioral fidelity to `reference/superposition-preview.html`.
3. Priority stack: **budget → a11y → anti-default design clause → visual fidelity → schedule**.
4. The pre-authorized ladders below.
If a check cannot run in this environment after ONE honest install/config attempt, substitute the
nearest verifiable receipt, log the deviation in RUN-REPORT.md, and continue.

### Ladder A — renderer (ADR-001)
single TSL codebase, both backends → TSL WebGPU + classic FBO ping-pong behind the FieldEngine
interface → classic WebGL build only → reduce particle tiers until perf targets pass.
Always terminates: the reference prototype proves the terminal branch works.

### Ladder B — fonts
Self-hosted Archivo VF + Fragment Mono subsets (obtain, subset, vendor) → if unobtainable in-session,
ship the system-ui stack (PLAN §3.2 degradation) and log `FONTS-DEFERRED` in RUN-REPORT.md.

### Ladder C — verification tooling
Lighthouse CI → plain `lighthouse` CLI → if neither runs after one attempt: Playwright perf smoke
+ `tools/budget.mjs` receipts + axe-core scan, with the substitution logged as a deviation.

### Ladder D — deploy (P5)
`gh auth status` authenticated → PRE-AUTHORIZED: create PUBLIC repo `superposition`, push, enable
GitHub Pages (deploy from main root), verify the live URL responds, record URL in receipts.
Not authenticated → terminate deploy-ready: write `DEPLOY.md` with the owner's exact single-push
commands and Pages settings. Either way the run continues to the final report.

## Pre-authorized waivers (owner)
- **P1:** ship with `[PLACEHOLDER]` content — real resume deferred by owner.
- **P3:** CLUSTERS uses placeholder domain counts — real skills inventory deferred.
- **No real personal data and no external personal links anywhere** — including commits, receipts,
  repo metadata, and the OG image. This is a rule, not a stop: nothing in this seed can violate it.

## Final report (mandatory — the run's ONLY termination condition)
Write `docs/receipts/RUN-REPORT.md`:
- Gates table with pass results and commit hashes.
- Every measurement vs its cap (bundle sizes, fps per tier, Lighthouse or Ladder-C substitute, axe).
- ADR index with one-line outcomes (ADR-001 first).
- Deviations and substitutions, each with rationale.
- Deploy state: live URL, or the owner's single next command (from DEPLOY.md).
- Suggested v-next items (real-content swap procedure first).

## Start
Begin with P0: scaffold per PLAN §5.5, then the ADR-001 spike — measured vendor bundle size
recorded in `docs/receipts/P0-budget.md` before anything else ships.
