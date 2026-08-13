---
section: "15_IMPLEMENTATION_RECORDS"
status: active
tags: [implementation-records, handoffs, archive, moc]
updated: 2026-08-13
related: ["[[00_START_HERE]]", "[[02_ARCHITECTURE_AND_STRUCTURE/STRUCTURE|STRUCTURE]]", "[[00_MASTER_SYNC]]", "[[08_OPERATIONS_AND_BACKLOG/00_START_HERE|Operations & Backlog]]"]
---

# Implementation Records

This section is the tracked home for implementation packets that previously
sat loose at the repository root. It preserves their history without treating
every dated brief as current policy.

Use the records with these rules:

- `active/` contains a currently usable execution packet. Confirm it against
  runtime code and [[00_MASTER_SYNC]] before implementation.
- `historical/` contains dated plans, handoffs, and audits. They are evidence,
  not instructions to run blindly.
- `reference/` preserves useful product source material that has already been
  implemented or distilled elsewhere in the Brain.
- Current architecture, business rules, schemas, and flows remain in sections
  02, 04, 06, 07, 08, and 09. Runtime code wins when a record disagrees.

## Active

### Launch readiness

- Canonical program: [[08_OPERATIONS_AND_BACKLOG/ACTION/00_MASTER_ACTION_PLAN|MASTER ACTION PLAN]].
- Monthly metrics program: [[MONTHLY_SCOUT_WRAP_IMPLEMENTATION_PLAN]].
- Founder activation/budget: [[FOUNDER_LAUNCH_BUDGET_CHECKLIST]].
- [[CRITICAL_LOGIC_SECURITY_1_0B_2026-08-12]] — applied critical-logic and
  security corrections, including the live-schema reasoning.
- [[MIGRATION_DRIFT_2026-08-12]] — why migration files cannot be assumed to
  describe production.
- [[THREE_PLATFORM_SECURITY_AUDIT_2026-08-13]] — GitHub, Vercel, and Supabase
  evidence snapshot.
### Sharing

- [[2026-08-13_SHARE_ENGINE]] — mobile curated share, Viber/Messenger, opaque
  attribution, tests, merge evidence, and the small remaining verification list.

### Spatial OSINT and Intel

- [[HANDOFF_PROMPT_SPATIAL_OSINT_AND_ARTICLES]] — phased execution handoff.
- [[SCOUTIT_OSINT_INTEL_BLUEPRINT]] — supporting system blueprint.
- Canonical product architecture: [[OSINT_INTEL_ARCHITECTURE]].
- Current sequencing: [[08_OPERATIONS_AND_BACKLOG/ACTION/00_MASTER_ACTION_PLAN|MASTER ACTION PLAN]] and [[08_OPERATIONS_AND_BACKLOG/ACTION/FUTURE|FUTURE]].

## Historical

- [[15_IMPLEMENTATION_RECORDS/historical/launch-readiness/README|Launch-readiness evidence]] contains the retained LR implementation records, full reaudit, authorization evidence, and remediation evidence.
- [[2026-08-13_BRAIN_PRUNING_RECORD|Brain Pruning Record]] records the removal of obsolete coordination, documentation, prompt, and Mission Control packets.
- Deleted handoff/planning packets must not be reconstructed as active queues. For current Mission Control state use [[MISSION_CONTROL_REAL_BUILD_STATUS]].

## Documentation history

- [[2026-08-13_BRAIN_PRUNING_RECORD|Brain Pruning Record]]
## Reference

### Enterprise Mission Control

- [[Enterprise Mission Control - Model]]
- [[15_IMPLEMENTATION_RECORDS/reference/enterprise-mission-control/Enterprise Mission Control Framework Version 1.0 (Architecture)|Enterprise Mission Control Framework v1.0]]
- Canonical feature spec: [[ENTERPRISE_MISSION_CONTROL_SPEC]].

### Property units

- [[Unit master page]] — original product framework.
- Canonical current model: [[PROPERTY_ARCHITECTURE]], [[DATA_DICTIONARY]], and
  [[08_OPERATIONS_AND_BACKLOG/ACTION/00_MASTER_ACTION_PLAN|MASTER ACTION PLAN]].

<!-- BEGIN:GENERATED_LOGIC_INDEX -->

## Complete logic index

> Generated navigation block. Keep human explanation above this marker; regenerate this block whenever files move.

- **Parent:** [[00_LOGIC_HIERARCHY|ScoutIt Logic Hierarchy]]

### Child logic folders

- [[15_IMPLEMENTATION_RECORDS/active/README|active]]
- [[15_IMPLEMENTATION_RECORDS/historical/README|historical]]
- [[15_IMPLEMENTATION_RECORDS/reference/README|reference]]

<!-- END:GENERATED_LOGIC_INDEX -->
