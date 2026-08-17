---
section: "15_IMPLEMENTATION_RECORDS/active/agent-workspace"
status: active
date: 2026-08-14
type: decision-record
report-state: owner-action-required
task-id: T0-AGENT-SAFE-HARDENING-BATCH-1-2026-08-14
tags: [decision-record, agent-workspace, freshness, ranking, search-algorithm, owner-decision]
updated: 2026-08-14
ai-first: true
related: ["[[TASK_T0_AGENT_SAFE_HARDENING_BATCH_1]]", "[[PROPERTY_FRESHNESS_AND_STALENESS_SPEC]]"]
---

# Owner Decision Record: Freshness Rank Modifier Integration into Public Search

## 1. Context & Architectural Status

In `src/lib/freshness.js`, freshness tiers are defined with deterministic `rankModifier` weights:
- **`fresh` (< 30 days):** `rankModifier: 0` (Top placement in discovery)
- **`warning` (30–60 days):** `rankModifier: -1` (Slight demotion)
- **`stale` (60–180 days):** `rankModifier: -2` (Significant demotion)
- **`outdated` (> 180 days):** `rankModifier: -3` (Public staleness notice displayed)
- **`unverified` (no verification date):** `rankModifier: -2` (Honest blank default)

Currently:
1. `rankModifier` is fully tested and returned by `getFreshness(lastVerifiedDate)`.
2. Public and dashboard badges (`FreshnessBadge.js`), monthly portfolio audits (`auditPortfolio`), and `/api/cron/check-stale-listings` read and enforce staleness levels.
3. The live public directory search query (`/api/cms/route.js` and `DirectoryClient.js`) does NOT currently inject a weighted arithmetic multiplier or sorting penalty for `rankModifier` into the primary multi-filter result pipeline.

## 2. Product Decisions Required by Owner

To transition `rankModifier` from an informational tier metadata value into an active algorithmic search ranking penalty, the owner must approve one of the following ranking policies:

### Option A: Strict Tier Bucketing (Recommended)
- Search results bucket listings by Freshness Tier first (Verified Fresh -> Warning -> Stale/Unverified -> Outdated), then order by relevance / price / distance within each tier bucket.
- **Pros:** Maximum incentive for owners to maintain fresh inventory. Immediately penalizes stale listings.
- **Cons:** A slightly stale listing with an exact location match might appear below a fresh listing with a looser match.

### Option B: Weighted Relevance Score
- Calculate composite search score: `Score = RelevanceScore + (rankModifier * W_freshness)`.
- **Pros:** Balances freshness with query relevance.
- **Cons:** Requires tuning weight parameters `W_freshness`.

### Option C: Informational-Only (Status Quo)
- Preserve `rankModifier` as informative tier metadata and display badges/notices, without altering primary search sorting order.

## 3. Owner Action Items

- [ ] Select preferred search ranking policy (Option A, Option B, or Option C).
- [ ] Specify if off-market / outdated listings should be filtered out of default organic search or merely badged.
