---
section: "08_OPERATIONS_AND_BACKLOG/ACTION/INBOX"
status: unverified
tags: [inbox, buyer-journey, desktop, non-executable]
updated: 2026-08-22
related: ["[[00_MASTER_ACTION_PLAN]]", "[[07_FEATURES_AND_FLOWS/USER_FLOWS|User Flows]]"]
---

# A priced property offers no direct contact action on desktop

> **Not executable.** Observed 2026-08-22 in a real browser at 1280px while
> re-aiming a stale E2E assertion. It may be the intended RA 9646 posture
> rather than a gap — that is the question to settle before any work.

## What was observed

On `/property/cyber-sigma-tower-3` (a listing with a confirmed, broker-verified
price) at 1280×720, the Your Move chapter renders:

- the verified price, its provenance note, and the reaction tiers;
- `Save`, the three intent tiers, and `AI Promote ✦`;
- a `View current roster →` link to `/property/<slug>/brokers`.

There is **no** inquiry button. The bottom bar that carries `Inquire` on a
phone is `display: none` at desktop width, and the
`Inquire with an authorized broker →` link in `CommercialFlow.js` renders only
in the **unpriced** branch ("Price on request"). So the highest-intent case —
the price is confirmed and the buyer is convinced — is the one case with no
one-click way to reach a person on desktop.

The roster route is still reachable, so nothing is broken; it is one extra step
at the moment of highest intent.

## What must be checked before promoting

1. Is routing a priced-listing buyer through the representation roster the
   deliberate RA 9646 posture? If so this is correct and should be documented
   in [[07_FEATURES_AND_FLOWS/USER_FLOWS|User Flows]], not "fixed".
2. If not, decide the desktop affordance — the same `Inquire` action, or a
   roster-first CTA with clearer wording.
3. Check the residential path too: `ResidentialFlow.js` has the same
   priced/unpriced branch at the same line positions.
