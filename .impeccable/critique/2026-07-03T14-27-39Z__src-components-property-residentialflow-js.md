---
target: property page (ResidentialFlow.js)
total_score: 25
p0_count: 2
p1_count: 2
timestamp: 2026-07-03T14-27-39Z
slug: src-components-property-residentialflow-js
---
# Critique: ScoutIt Residential Property Detail Page

Method: dual-agent (isolated parallel sub-agents)

## Design Health Score: 25/40 (Acceptable)
Heuristic scores: Visibility=3, Match Real World=3, User Control=1, Consistency=2, Error Prevention=3, Recognition=3, Flexibility=2, Aesthetic=4, Error Recovery=2, Help=2

## Anti-Patterns Verdict
NOT AI slop. Deterministic scan: 18 findings (9x design-system-radius using 2px, 9x design-system-color using undocumented #6a6a6a/#a0a0a0/#c85050).

## Priority Issues
- P0: Chapter nav (.nav-chapter divs) has zero keyboard/screen-reader accessibility - no role, tabIndex, or onKeyDown. ResidentialFlow.js:1001-1007.
- P0: Vault's deliberate placeholder Matterport/3D content (real, documented, HTTP-verified) isn't labeled as illustrative, so it reads as a bug (wrong-country address) at the highest-stakes trust moment. Separately, unrelated: mockProperties.js:496 has dead, unused demo Matterport URL.
- P1: "Orbit Tier Only" (line 1213) vs "Cluster Tier" (lines 78/96/114/1696) - Orbit isn't a real tier in entitlements.js.
- P1: Breathing Signal Rule (DESIGN.md) not applied to this page; property-detail.css:929 has a separate radar-btn-pulse with no prefers-reduced-motion fallback anywhere in the file.
- P2: activeTab chapter state not synced to URL - no deep-linking, no back/forward, resets on refresh.
- P3: Location chapter's 5-item fact list slightly exceeds 4-item chunking guideline.

## What's Working
1. Location chapter's specific, sourced PH real-estate intelligence (flood risk reasoning, zoning citations)
2. Disciplined honest-blank handling throughout ("Not recorded", "Price on request")
3. Restrained blur-then-CTA gating pattern

## Persona Red Flags
Jordan: Vault damages trust right before CTA. Sam: chapter nav entirely unreachable by keyboard. Riley: tier-name mismatch + silent mock-data fallback with no freshness signal.
