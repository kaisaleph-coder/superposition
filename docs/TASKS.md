# TASKS — resume

The task ledger. `self-direction` reads this to pick exactly ONE unblocked task,
verify it, commit, and stop. Keep it current: this file is the Build lane's input.

## Conventions

- One heading per tranche or batch; tasks as `- [ ] Tn — <verb phrase>`.
- Mark `[USER-GATE]` on anything needing a decision only the user can make. The
  Build lane stops at a gate rather than guessing.
- `done <commit>` means **the code EXISTS**, never that anything calls it. Before
  building against a task another track reports as done, check the entry point's
  real argv and grep for production callers. <!-- earned: 2026-08-03, a sprint
  item was scoped against a subsystem with zero production callers -->
- Record REJECTED items WITH their reason and PARKED items unscheduled. A ledger
  that lists only live work loses why the dead work died, and the next session
  re-proposes it.
- Coverage gaps are tasks too: a known-untested seam is scheduled work, not a
  footnote.

An empty ledger is the correct state for a new project. Sections stay with
`(none)` rather than being deleted, so the shape survives and the next author
sees where things go.

## Tranche 1 — unblocked

(nothing scheduled yet)

## [USER-GATE] — needs a decision only the user can make

(none)

## Blocked

(none)

## Coverage gaps — known-untested seams

(none recorded)

## Rejected — with reasons

(none)

## Parked — recorded, not scheduled

(none)
