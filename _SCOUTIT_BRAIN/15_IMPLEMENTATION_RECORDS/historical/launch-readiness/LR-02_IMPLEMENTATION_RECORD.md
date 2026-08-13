---
section: "15_IMPLEMENTATION_RECORDS/historical/launch-readiness"
status: reference
tags: [launch-readiness, implementation-record, historical-evidence]
package: LR-02
name: Broker roster, visibility, and lead routing
updated: 2026-08-02
---

# LR-02 implementation record

## Local result

LOCAL COMPLETE / FOUNDER ACTION. The property-scoped representation and lead-routing contract is implemented and verified in the workspace. The additive migration has not been applied to a live database.

## Implemented

- Added `property_broker_representations` with explicit pending/active/locked/suspended/unavailable/ended/declined states and eligibility flags.
- Added `deal_routing_recipients` and deal `routing_snapshot` so recipient state is captured when a lead is created; existing deals are not reassigned.
- Added service-role Postgres functions for deterministic roster reads and atomic routed buyer-deal creation under a per-property advisory lock.
- Owner invites and broker pitches create pending representation records; accepted representation handshakes activate the roster state.
- Authenticated `/api/deals/initiate` and logged-out `/api/inquiries` use the same recipient contract. A qualifying roster excludes the owner from new buyer lead notifications; an empty roster routes to the uploader/lister.
- Added property-scoped broker API/UI to render property-specific broker cards directly from active representation state while fully preserving all broker cards, Starry tier features, and directory listings.
- Routed brokers can load and use their deal conversations through the recipient snapshot.

## Files and migration

- `supabase/migrations/20260802000002_broker_representation_routing.sql`
- `src/lib/brokerRepresentation.js`
- `src/lib/serverBrokerRouting.js`
- `src/lib/dealParty.js`
- `src/app/api/property/[id]/brokers/route.js`
- `src/app/api/deals/initiate/route.js`
- `src/app/api/inquiries/route.js`
- `src/app/api/dashboard/invite/route.js`
- `src/app/api/deals/pitch/route.js`
- `src/app/api/dashboard/deals/update/route.js`
- `src/app/api/deals/route.js` and routed deal access routes
- `src/app/property/[id]/brokers/BrokersClient.js`
- property flow roster callouts and inquiry copy
- focused unit, API-contract, and Playwright tests

## Verification

- `npm.cmd run lint` — pass.
- `npm.cmd run test:unit` — 26 files, 423 tests, pass.
- Focused LR-02 Playwright — 4 desktop/Mobile Chrome tests, pass.
- `npm.cmd run build` — pass on Next.js 16.2.12.
- Migration structural check — pass; Supabase CLI unavailable, so no local database rebuild was run.

## Founder action / temporary protection

Review and apply the additive migration through the approved database workflow. Until then, the new routing and roster paths return a controlled unavailable response instead of falling back to the old owner-direct behavior. No production Airtable, Supabase, deployment, commit, or payment change was made.

## Next package

LR-03 — Connect wallet and server-side tier rules. Not started.