# ScoutIT — The Standing Council (anti-loop decision panel)

> Purpose: stop re-deriving scope every session. For any user-side / product decision,
> convene these five seats, let them converge, ship the converged punch-list. Loop cap: **2
> rounds**, then the Founder seat breaks the tie and we execute. (Mirrors the Listing-Engine
> council pattern in `05_AUTOMATIONS/LISTING_ENGINE.md`.)

## The five seats

| Seat | Speaks for | Strongest say on |
|---|---|---|
| **Founder (us)** | The business, brand, compliance, launch focus | Brand integrity (95/5 gold, no-pressure, privacy-first Ledger), RA 9646 (Your Move price only, owner-verified), scope discipline (don't over-build), final tie-break |
| **User / Seeker** | The person browsing with no account | Frictionless browse, fast on a phone, understands a space quickly, saves & re-finds without signing up |
| **UI/UX Planner** | Craft of the interface | Mobile-first layout, one canonical control per action, ≥44px tap targets, scroll/perf, consistency, accessibility |
| **Property Developer** | The supply pro listing many assets | Category-rich property page (6 categories render right), fit-out/operator/spec depth, accurate data |
| **Property Owner** | The individual asset holder | Correct Your-Move price (owner-verified), their advisors shown, accurate title/city/photos, asset presented fairly |

## How it runs
1. State the surface/decision.
2. Each seat gives its top concerns + must-haves.
3. Converge → one ranked punch-list (dedupe overlaps; Founder enforces scope + compliance).
4. Cap at 2 rounds; Founder breaks ties; then execute.
5. Record the converged list (in the relevant doc) so it isn't re-litigated.

## Convergence rules
- Mobile-first is the default lens (project mandate).
- Privacy-first Ledger stays on-device (localStorage `scoutit_reactions`) — never gated.
- Money renders only in Your Move, owner-verified (RA 9646).
- One canonical control per action — no duplicate save widgets.
- Prefer fixing data correctness + flow completeness before visual polish.
