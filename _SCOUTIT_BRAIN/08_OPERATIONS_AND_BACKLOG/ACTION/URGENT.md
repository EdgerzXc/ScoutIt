---
section: "08_OPERATIONS_AND_BACKLOG/ACTION"
status: active
tags: [urgent, pre-pilot, current-work, security]
updated: 2026-08-24
related: ["[[00_MASTER_ACTION_PLAN]]", "[[ACTIVE]]", "[[MASTER_OWNER_ACTIONS]]"]
---

# Urgent — stabilize before new expansion

> Maximum 12 open items. Urgent means broken now, security/privacy-sensitive, or
> blocking an honest invited pilot. It does not mean visually interesting.

## U-011 — Fail closed for nonexistent nested property URLs

**Current production defect (2026-08-24):** a nonexistent parent property returns
a correct HTTP 404/noindex at `/property/audit-invalid-property`, but its nested
`/brokers` and `/unit/audit-invalid-unit` URLs return HTTP 200 with indexable
metadata and titles built from the caller-controlled path. Current source confirms
the brokers route never validates the parent, while the unit route renders
`UnitMasterPage` with `initialProperty=null` instead of calling `notFound()`.

**Why Urgent:** these are public soft 404s that let crawlers and shared links
present nonexistent inventory as named ScoutIt pages. No private data leaked,
but the behavior violates the canonical-property and truthful-listing contract.

**Agent lane:** validate the parent and requested child on the server through the
existing cached CMS authority, then call Next `notFound()` before rendering or
constructing indexable metadata. Do not create a placeholder listing, redirect an
unknown slug to `/property`, or expose premium fields while validating.

**Exit test:** nonexistent parent and child combinations return HTTP 404 with
`noindex`; valid property broker rosters and valid child spaces retain their
canonical URL and content; sample inheritance remains noindex; CMS failure is an
honest degraded error rather than a false 404; regression tests cover both nested
routes on desktop/mobile; full verify, build, and 3/3 surface locks pass.

U-008 through U-010 and the GitHub release action O-009 are closed in
[[08_OPERATIONS_AND_BACKLOG/ACTION/DONE/2026-08|Done]].
