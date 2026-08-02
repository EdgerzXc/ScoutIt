---
section: "15_IMPLEMENTATION_RECORDS"
status: active
tags: [implementation-records, handoffs, archive, moc]
updated: 2026-08-02
related: ["[[00_START_HERE]]", "[[02_ARCHITECTURE_AND_STRUCTURE/STRUCTURE|STRUCTURE]]", "[[00_MASTER_SYNC]]", "[[08_OPERATIONS_AND_BACKLOG/NEW_IDEAS|NEW_IDEAS]]"]
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

- [[START_LAUNCH_READINESS_IMPLEMENTATION_PROMPT]] — current execution prompt;
  starts with LR-01 and stops for review before LR-02.
- Canonical program: [[LAUNCH_READINESS_MASTER_PLAN]].
- Monthly metrics program: [[MONTHLY_SCOUT_WRAP_IMPLEMENTATION_PLAN]].
- Founder activation/budget: [[FOUNDER_LAUNCH_BUDGET_CHECKLIST]].

### Spatial OSINT and Intel

- [[HANDOFF_PROMPT_SPATIAL_OSINT_AND_ARTICLES]] — phased execution handoff.
- [[SCOUTIT_OSINT_INTEL_BLUEPRINT]] — supporting system blueprint.
- Canonical product architecture: [[OSINT_INTEL_ARCHITECTURE]].
- Current backlog: [[08_OPERATIONS_AND_BACKLOG/NEW_IDEAS|NEW_IDEAS]] §23.

## Historical

### Coordination

- [[CLAUDE_CODE_MASTER_BRIEF]] — dated multi-track implementation brief.
- [[WORK_SPLIT_AND_CLAUDE_CODE_QUEUE]] — dated agent work split and prompt index.

### Launch readiness

- [[HANDOFF_PROMPT_FOR_CLAUDE_CODE]] — earlier human-testing handoff.
- [[PRODUCTION_READINESS]] — dated launch-readiness snapshot.
- [[PRODUCTION_SECURITY_AUDIT]] — dated security-readiness audit.

### Master Mission Control handoffs

- [[HANDOFF_PROMPT_DEPLOY_MISSION_CONTROL]]
- [[HANDOFF_PROMPT_METRICS_AND_IP_GUARD]]
- [[HANDOFF_PROMPT_MMC_PASSWORD_LOGIN]]
- [[HANDOFF_PROMPT_REDESIGN_MISSION_CONTROL]]
- [[HANDOFF_PROMPT_RUN_MISSION_CONTROL_LOCAL]]

### Master Mission Control planning

- [[MASTER_MISSION_CONTROL_HARDENING]]
- [[MMC_ACCESS_SETUP]]
- [[MMC_CLAUDE_CODE_BRIEF]]
- [[MMC_GAP_ANALYSIS]]

For the real current staff-console state, use
[[MISSION_CONTROL_REAL_BUILD_STATUS]] and the application-local
`mission-control/README.md` plus `mission-control/MISSION_CONTROL_SPEC.md`.

## Reference

### Enterprise Mission Control

- [[Enterprise Mission Control - Model]]
- [[15_IMPLEMENTATION_RECORDS/reference/enterprise-mission-control/Enterprise Mission Control Framework Version 1.0 (Architecture)|Enterprise Mission Control Framework v1.0]]
- Canonical feature spec: [[ENTERPRISE_MISSION_CONTROL_SPEC]].

### Property units

- [[Unit master page]] — original product framework.
- Canonical current model: [[PROPERTY_ARCHITECTURE]], [[DATA_DICTIONARY]], and
  [[SCOUTIT_MASTER_BUILD_SPEC]].
