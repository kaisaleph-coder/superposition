# ONE-SHOT PROMPT
Paste the block below into Claude Code (Fable 5, high effort) at E:\superposition. Walk away.

---

Read CLAUDE.md, then EXECUTE.md, then PLAN.md in full, then GATES.md,
docs/receipts/ADR-001-renderer.md, content/resume.data.js, and
reference/superposition-preview.html. Then execute the entire build P0→P5 in this
single session under these absolute rules:

1. ONE agent. Never spawn subagents, parallel tasks, or delegated workers.
2. ZERO user involvement. Never ask a question, never pause for approval, never
   wait for anything. Every decision resolves through the Autonomy Protocol in
   EXECUTE.md (priority stack + Ladders A–D). If blocked, take the ladder's
   terminal branch and record it — do not stop.
3. All content remains [PLACEHOLDER]; no real personal data and no external
   personal links anywhere, including commits, receipts, and repo metadata.
4. PLAN.md is law. Budget caps (§6) and the DOM-state contract (§5.6) are
   binding. Gates are self-verified: checks → receipts on disk → GATES.md
   updated → commit `gate(PX): <summary>` → adversarial self-review (try to
   fail your own gate) → only then proceed.
5. Deploy per Ladder D: if `gh auth status` shows an authenticated account, you
   are pre-authorized to create the PUBLIC repo `superposition`, push, enable
   GitHub Pages, verify the live URL, and record it. Otherwise terminate
   deploy-ready and write DEPLOY.md with the owner's single push command.

The run terminates only when P5 receipts exist and docs/receipts/RUN-REPORT.md
is written: gates table with results, every measurement vs its cap, ADR index,
deviations, deploy state with live URL or the owner's one command, and
suggested v-next items.

Begin now with P0: scaffold per PLAN §5.5, then the ADR-001 spike — measured
vendor bundle size recorded in docs/receipts/P0-budget.md before anything
else ships.
