---
section: "08_OPERATIONS_AND_BACKLOG/ACTION"
status: active
task_id: A-023
tags: [active-work, broker-dossier, professional-profile, trust]
updated: 2026-08-24
related: ["[[ACTIVE]]", "[[00_MASTER_ACTION_PLAN]]", "[[DATA_DICTIONARY]]", "[[USER_FLOWS]]"]
---

# A-023 — Canonical Broker Dossier and editor

> This file is A-023's single authoritative Active home. `ACTIVE.md` is its
> queue index.

## Outcome and current defect

Build one premium broker master page with sourced mathematical signals,
authorized property representations, broker-written description, explainable
Scout Rating, client recommendations, inspectable ScoutIt contributions, and one
compliant Connect path. Editing uses the Property Review model: structured
editor left and exact desktop/mobile public preview right.

Today `/brokers/[broker-slug]` reads Airtable but its
`managedProperties` is always empty and it expects `broker.scoutRating`, which
normalization never supplies. `/profile/[id]` separately renders a 5-point
broker panel while the broker page expects 100 points. Identity, URL, and metric
authority must converge before expansion.

## Locked authority

- ScoutIt owns composition, chapters, typography, motion, SEO, accessibility,
  metrics, trust labels, and Connect routing.
- Brokers edit declared facts only: portrait, biography, firm, markets,
  categories, languages, areas, working style, availability, and optional intro
  media.
- Brokers never edit credentials, represented properties, rating events,
  statistics, recommendations, contributions, or badges.
- Tier may change capacity/media limits; it never buys trust or rating.
- Every public card says whether it is broker-declared, client-submitted,
  ScoutIt-computed, staff-verified, or source-linked.

## Public dossier

1. **Identity + rating:** specific PRC evidence, markets, specialties,
   availability, and Scout Rating. Insufficient data says **Building a ScoutIt
   record**, never zero stars.
2. **Mathematical signals:** active accepted representations, completed
   two-sided handshakes, response rate, median response time, recommendation
   count, and freshness only where sourced. Show definition, window, sample,
   source, and calculation date; low-sample/stale values stay absent.
3. **Current Representations:** compact cards derived only from active, visible,
   contactable, owner-accepted `property_broker_representations`. They link to
   canonical property pages without repeating chapters. Brokers cannot add,
   retain, or reorder them; ended/locked/suspended/withdrawn/off-market rows
   obey their visibility rules.
4. **About the Advisor:** structured broker-provided narrative with length,
   markup, unsupported-claim, and contact-leak controls.
5. **Client Recommendations:** ScoutIt cards with consented attribution,
   relationship type, date, moderation, and **Verified ScoutIt connection** only
   for a qualifying deal. External items remain unverified. Screenshots are
   private evidence, never public presentation.
6. **ScoutIt Contributions:** inspectable links to published Q&A, approved
   corrections, briefings, and credited Intel. Contributions stay separate from
   rating.
7. **Connect:** availability, service area, representations, Connect
   consequence, and compliant inquiry/viewing route; no public contact bypass.

## Rating and recommendations

- V1 Scout Rating follows the locked rule: only a completed two-sided
  buyer–broker transaction handshake qualifies; representation acceptance does
  not. Supporting statistics are named signals, not hidden weights.
- Remove conflicting 5-point and 100-point displays. Any future composite needs
  a published formula, anti-gaming review, minimum sample, reversal/dispute and
  backfill rules, plus separate owner approval.
- Reversed, disputed, duplicate, test, refunded, or invalidated events do not
  contribute; aggregates reproduce from audited source events.
- Recommendation authors choose full name, initials, role-only, or anonymous.
  Brokers cannot edit/fabricate them. Consent, source, proof, moderation,
  withdrawal, and redaction are recorded. No immature star average ships.

## Editor and data architecture

- Structured left editor, exact live preview, autosaved private draft, explicit
  publish state, dirty-state protection, completeness, and provenance.
- No custom font, palette, HTML, script, freeform layout, badge, property,
  metric, or recommendation controls.
- Airtable `BROKERS_CMS` stays the public identity/content source; Supabase
  stays Auth plus private/operational authority. Broker drafts save to Supabase;
  an audited bridge publishes only allowed narrative fields to Airtable. Staff
  PRC/example/trust fields are excluded from broker payloads.
- Supabase owns representations, handshakes, recommendations, contributions,
  consent, disputes, and statistics. Public rendering consumes one allowlisted
  server projection, never private deal/message data.
- Link Auth UUID to BrokerID explicitly, never by mutable email/name.
- `/brokers/[BrokerID]` is canonical; broker-shaped `/profile/[id]` output
  redirects or becomes a non-indexed owner preview.

## Delivery phases

1. Converge live fields, canonical ID/URL, rating contract, and public-safe
   field tests.
2. Build the projection and dossier with loading, empty, stale, degraded, and
   error states.
3. Build ownership-checked draft/edit/publish, sanitization, autosave, preview,
   audit events, and honest empty composition.
4. Add versioned recommendation/contribution consent, moderation, withdrawal,
   dispute, private evidence, and artifact linkage.
5. Add reproducible metrics with sample/freshness thresholds and reversal
   handling.
6. Complete metadata, mobile/Lite/reduced-motion, migration/rollback, and owner
   visual review.

## Boundary and exit test

Code and prepared migrations are Active; live application remains behind
[[WAITING#W-003|W-003]]. Never fabricate/backfill scores, reviews, response
times, closures, contributions, or properties; never expose client identity,
messages, deal value, negotiations, private saves, or withdrawn properties.

Done means one canonical URL serves every entry path; brokers publish only
allowed narrative; preview matches public output; representations match eligible
authority; V1 rating matches qualifying handshakes including reversal,
duplicate, and test cases; every recommendation has consent/source; every
contribution opens its artifact; low-sample/error states make no false claim;
authorization, privacy, XSS/contact-leak, accessibility, metadata, responsive,
full verification, build, and 3/3 surface locks pass. Live schema/data/deploy
changes remain separately owner-approved.

