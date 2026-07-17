/* SUPERPOSITION content — single source of truth (PLAN §4.2)
   PLACEHOLDER BUILD: every bracketed [FIELD] is owner-replaceable data.
   QA greps rendered DOM for "[" — placeholders can never ship silently.
   Owner instruction (v1.2): links arrays stay EMPTY — no public links. */
window.__RESUME__ = {
  identity: {
    name: "[NAME]",
    positioning: "[One-line positioning — 90 characters of exactly what this person is.]",
    location: "[LOCATION — owner-chosen granularity]",
    links: []
  },
  facets: [
    { id: "columns", name: "Finance executive", attractor: "COLUMNS",
      manifest: ["[Positioning line — the executive claim]",
                 "[Scope line — scale, entities, mandate]",
                 "[Signature outcome line]"],
      dossiers: [
        { title: "[Role]", org: "[ORG]", span: "[SPAN]",
          lines: ["[Dense line — metric-led accomplishment, numbers first.]",
                  "[Dense line — second proof point.]"],
          metrics: [ { k: "[scope]", v: "[00 units]" }, { k: "[Δ]", v: "[+00.0%]" } ],
          links: [] } ] },

    { id: "frame", name: "Construction executive", attractor: "FRAME",
      manifest: ["[Positioning line — the build claim]",
                 "[Scope line — sites, capex, trades]",
                 "[Delivery line — on-time, on-budget proof]"],
      dossiers: [
        { title: "[Program]", org: "[ORG]", span: "[SPAN]",
          lines: ["[Dense line — sites delivered, capex managed, schedule performance.]"],
          metrics: [ { k: "[sites]", v: "[00]" }, { k: "[capex]", v: "[$00M]" } ],
          links: [] } ] },

    { id: "lattice", name: "AI / technical", attractor: "LATTICE",
      manifest: ["[Positioning line — the builder claim]",
                 "[Systems line — what gets built, how]",
                 "[Depth line — the hard part]"],
      dossiers: [
        { title: "[System or project]", org: "[SOLO BUILD]", span: "[SPAN]",
          lines: ["[Dense line — architecture, constraint, result.]"],
          metrics: [ { k: "[status]", v: "[shipped]" } ],
          links: [] } ] },

    { id: "surface", name: "Investing / trading", attractor: "SURFACE",
      manifest: ["[Positioning line — the market claim]",
                 "[Method line — instruments, horizon, edge]",
                 "[Discipline line — risk stance]"],
      dossiers: [
        { title: "[Research program]", org: "[PERSONAL]", span: "[SPAN]",
          lines: ["[Dense line — thesis, instrument, measured result.]"],
          metrics: [ { k: "[horizon]", v: "[EOD]" } ],
          links: [] } ] },

    { id: "clusters", name: "Skills", attractor: "CLUSTERS",
      manifest: ["[Positioning line — the range claim]",
                 "[Depth line — where mastery concentrates]"],
      domains: [
        { domain: "[Domain A]", related: ["[Domain B]"],
          tiers: { core: ["[Core skill]", "[Core skill]"],
                   working: ["[Working skill]", "[Working skill]", "[Working skill]"],
                   familiar: ["[Familiar]", "[Familiar]"] } },
        { domain: "[Domain B]", related: ["[Domain A]"],
          tiers: { core: ["[Core skill]"],
                   working: ["[Working skill]", "[Working skill]"],
                   familiar: ["[Familiar]", "[Familiar]", "[Familiar]"] } }
      ] },

    { id: "vector", name: "Entrepreneur", attractor: "VECTOR",
      manifest: ["[Positioning line — the zero-to-one claim]",
                 "[Trajectory line — scattered starts, one direction]"],
      dossiers: [
        { title: "[Venture or initiative]", org: "[FOUNDER]", span: "[SPAN]",
          lines: ["[Dense line — what was built from nothing and what it did.]"],
          metrics: [ { k: "[from]", v: "[0]" }, { k: "[to]", v: "[1]" } ],
          links: [] } ] },

    { id: "orbit", name: "Hobbyist", attractor: "ORBIT",
      manifest: ["[Positioning line — the curiosity claim]",
                 "[Orbit line — the recurring obsessions]"],
      dossiers: [
        { title: "[Pursuit]", org: "[ONGOING]", span: "[SPAN]",
          lines: ["[Dense line — depth achieved for its own sake.]"],
          metrics: [ { k: "[why]", v: "[joy]" } ],
          links: [] } ] }
  ],
  record: {
    entries: [ { span: "[SPAN]", line: "[Chronological record line.]" } ]
  },
  meta: { updated: "2026-07-17", schema: "1.2" }
};
