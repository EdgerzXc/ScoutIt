---
section: "15_IMPLEMENTATION_RECORDS/active/launch-readiness"
status: complete
tags: [repository-audit, ownership, dead-code, typography, copy]
updated: 2026-08-24
related: ["[[02_ARCHITECTURE_AND_STRUCTURE/STRUCTURE]]", "[[08_OPERATIONS_AND_BACKLOG/ACTION/ACTIVE#A-028 — Reconcile repository ownership, dead code, typography, and product copy]]"]
---

# Repository ownership audit — 2026-08-24

## Scope and method

A-028 audited the full ScoutIt workspace as an ownership problem, not as a
filename popularity contest. Evidence included:

- all 1,187 tracked entries grouped by root, extension, size, and exact SHA-256;
- all repository-root directories checked against Git tracking and ignore state;
- a static import graph over 727 source files, with 183 Next runtime roots and
  152 test roots, plus manual review of dynamic/config/build ownership;
- package-manifest references, public-asset consumers, generated Master Flow
  scripts/tests, typography loading/tokens, and a focused public-copy corpus;
- Git history and canonical Brain references before any deletion.

The import graph resolved 544 files from runtime roots. Its two unresolved
entries were test source strings such as `"./page.module.css"`, not executable
imports. Generated Master Flow data is intentionally not runtime-reachable yet:
generation scripts, validation/retrieval tests, and A-020 own it.

## Removed now

### Dead runtime/style files

The following nine files had no runtime importer. The graph renderer was
reachable only through another dead component; the three CSS modules had no
importer. Repository-wide search, history, tests, build scripts, and canonical
documents provided no current owner:

- `src/components/descent/EventHorizonCanvas.js`
- `src/components/ecosystem/FoundingProgramPanel.js`
- `src/components/flow/MasterFlowGraph.js`
- `src/components/intel/StratosphereRadarMap.js`
- `src/components/layout/MasterCascadeMap.js`
- `src/components/legal/TermsAcceptanceModal.jsx`
- `src/app/profile/[username]/page.module.css`
- `src/components/dashboard/BrokerMode.module.css`
- `src/components/dashboard/OwnerMode.module.css`

The obsolete Terms modal was especially unsafe to retain as a “maybe”: it
hard-coded a stale legal version and wrote acceptance directly from the client,
while the live onboarding/API contract is versioned and server-authoritative.

### Tool/vendor debris

Five unreferenced Gemini Antigravity chat mockup PNGs were removed from tracking
and their tool-brain path is now ignored. They remain recoverable from Git
history. The broken `council-of-high-intelligence` gitlink had no
`.gitmodules` mapping, so a fresh clone could not initialize it; ScoutIt no
longer tracks the gitlink and ignores the external local clone. The clone and
its nested `.git` directory were explicitly left intact on this machine.

### Dependency and duplicate cleanup

- Removed `algoliasearch`: it had no import, configuration, script, or current
  product consumer; npm removed fifteen transitive packages.
- Removed the first overridden selector block from
  `shared-board.css`; the tokenized block immediately below it is the only
  rendered authority.
- Corrected stale comments that claimed Instrument Serif and the deleted 2D
  event-horizon component were active. No font or visual behavior changed.

## Retained intentionally

- `mission-control/` is a separate deploy/security boundary. Exact-hash twins
  for field registries, numeric twins, favicon, and selected migration SQL are
  deliberate cross-app contracts, not accidental copies.
- The PHIVOLCS fault collection intentionally exists twice: server logic imports
  `src/data/phivolcs_active_faults.json`, while MapLibre clients fetch
  `public/data/phivolcs-active-faults.geojson`.
- `src/data/flow/*`, `masterFlowGraphData.js`, graph validators, extraction,
  retrieval, OSINT, and context-bridge contracts remain build/test/future-flow
  owned. A-020 explicitly consumes the Master Flow guides.
- Brain implementation records, audit screenshots, and raw evidence are
  operational history. Large size alone is not grounds for deletion.
- `.obsidian`, `.impeccable`, root agent/config files, and ignored local
  `reference/`, `scratch/`, review, dependency, and tool trees are not public
  runtime code but have named editor/tool/local ownership.
- `react-dom`, Tailwind, PostCSS, Autoprefixer, Tailwind plugins, and Vitest UI
  are framework/build/tool dependencies even when application imports do not
  name their package string.

## Typography and copy findings

Font plumbing is consistent: root `next/font` loads Geist Sans and Geist Mono
once, CSS variables expose them, and the existing audit passed all 489 scanned
UI source files with no sub-12px text, excessive tracking, or low-opacity text
utility. The design question is that display and body intentionally resolve to
the same Sans face; changing that affects locked surfaces and belongs to A-029,
not cleanup.

The copy corpus found two separate authorities:

- A-023 now owns the property-roster contradiction: subscription tier is named
  as a recommendation input while the same screen claims ranking is strictly
  independent, purely meritocratic, and untouched by tier.
- A-029 owns repeated uncited “Philippines' first” and blanket “verified
  intelligence” claims, plus the AI rewrite prompt that explicitly requests
  generic luxury clichés such as bespoke, curated, seamless, and prestige.

A-028 did not silently rewrite public marketing, legal meaning, scores, or locked
composition.

## Verification state

- Post-deletion reference scan found no executable reference to a removed file;
  the only old name is historical prose in the legacy ledger.
- The import graph now reports 718 source files, 183 runtime roots, 152 test
  roots, and only named build/test/future-owned unreachable candidates.
- `npm run verify`: approved surfaces 3/3, ESLint clean, typography clean over
  480 live UI files, 151 test files and 1,567 tests passed, 518 Playwright cases
  discovered.
- Main Next 16.3 production build compiled and generated 121 pages.
- Mission Control passed 54/54 security/operations tests and its Next 15.5
  production build generated 27 pages.
- GitHub's clean checkout exposed one test-only dependency on an ignored Brain
  audit document. The contract now verifies the tracked server-only retrieval
  coordinator and keyword fallback directly; its focused suite passes 5/5.
- The subsequent Linux run also exposed a Windows-only Mission Control
  action-path key. Both path forms are now recognized, and the complete Mission
  Control security suite passes 54/54.
- Focused production-mode browser audit over public, professional, design,
  accessibility, PDF, image, desktop, and mobile paths completed 178 passed and
  one skipped. One mobile Intel case logged an `ECONNRESET` during the
  two-worker run; the same exact case passed immediately in isolation (1/1).
- U-011 production-mode probes returned 404 for both fabricated nested routes
  and 200 for the valid broker roster and child-space routes.

A-028 is complete. A-023 and A-029 own the product work routed from its findings.
