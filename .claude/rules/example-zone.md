---
paths:
  - "{{zone-glob, e.g. src/tagger/**}}"
---

# {{Zone}} rules — loaded ONLY when files matching `paths:` are touched

- {{Earned, zone-specific invariant with its required alternative}}

<!-- EXAMPLE FILE: adapt or delete at scaffold. Rules WITHOUT paths: frontmatter
     load every session and count against the instruction budget like CLAUDE.md;
     rules WITH paths: are lazy — the right home for zone invariants. Note:
     path-scoped rules do not survive compaction until re-triggered. -->
