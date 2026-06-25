# Session Handoff — 2026-06-25 (Session B)

> Resume point for the next Claude session. Read this first, then read the files listed under
> "Must Read Before Touching Code." Everything here is current as of the last push to main.

---

## What ScoutIt Is

Premium ultra-luxury commercial + residential real estate intelligence platform for the Philippines.
Dark mode always. 95% deep black (`#0d0d0d`, `#121212`), 5% gold (`--accent #FFB800`,
`--accent-bright #FFC929`, `--accent-muted #7A5C00`). Always use CSS variables, never raw hex.

**Dual CMS — do not mix these up:**
- **Airtable** = public read-only content (properties, brokers, articles). Accessed via `src/app/api/cms/route.js`
- **Supabase** = private user data (owner submissions, connects, deals, profiles, saved intel)

---

## Current Tech State (verified 2026-06-25)

- **Framework:** Next.js 16 (breaking changes from prior versions — read `node_modules/next/dist/docs/` before touching framework code)
- **Branch:** `main` — all work goes here, no sandbox for regular changes
- **Two Vercel projects** deploy the same repo: `scoutit` and `scout-it` — both auto-deploy on push to main
- **Auth:** still localStorage-based mock (no Supabase Auth yet). `user_id` is text like `"usr-1700000000"`
- **Entitlements:** `src/lib/entitlements.js` — `canSee(feature, tier)`, `FEATURE_MIN_TIER`, `CONNECTS_ALLOWANCE`, `monthlyAllowance()`
- **Connects wallet:** `src/lib/connectsWallet.js` — 3-bucket localStorage engine (granted/purchased/earned). Supabase is the real target after reset.
- **Tier names:** `starry → solar → cluster → universe`
- **Roles:** `seeker | owner | broker | photographer | researcher`

---

## What Was Built (cumulative — all on main)

### Entitlements & Gating
- `src/lib/entitlements.js` — full feature gate + Connects allowance ladder
- Hidden dev tier/role switcher in dashboard for testing
- VIP Spatial Vault gated at Cluster+ tier

### Vault (VIP Spatial Vault)
- `src/components/dashboard/OwnerMode.js` — full wizard redesign:
  - **Path A:** Paste a URL (Matterport/Luma/360) → live immediately
  - **Path B:** Build one — "I'll record myself" (video upload) or "ScoutIT team records it" (joins queue → internal QuestIT quest)
- `src/lib/airtable.js` — camelCase aliases added (`matterportTourUrl`, `luma3dMapUrl`, `droneHeatmapUrl`) so SpatialVaultWidget reads correctly

### Connects Wallet
- `src/lib/connectsWallet.js` — 3-bucket engine, monthly reset, spend-order, anti-exploit `grantedMonth` tracking
- `src/context/DashboardContext.js` — wired to wallet; `sendPitch()` and `inviteBroker()` use `spendConnects()`

### Pricing
- `/pricing` — hub with 5 cards (4 roles + Bundles card)
- `/pricing/seeker`, `/pricing/broker`, `/pricing/owner`, `/pricing/creator` — all show `◈ X Connects / month` badge on every tier
- `/pricing/bundles` — 4 bundle packages:
  - **Binary** (Seeker + Broker) — ₱2,199 · 38 Connects · Save ₱299
  - **Eclipse** (Seeker + Owner) — ₱2,599 · 36 Connects · Save ₱399 ← strongest ARPU lever
  - **Orbit** (Owner + Photographer) — ₱2,699 · 33 Connects · Save ₱399
  - **Constellation** (Seeker + Owner + Broker) — ₱3,999 · 60 Connects · Save ₱998

### Bug Fixes (all on main)
- `saved_intel` insert/delete now correctly passes `user_id`
- `deals` insert in `sendPitch()` now sets `broker_id`
- `invite/route.js` — full 3-bucket spend logic, role-scoped wallet, proper transaction ledger
- `v1/questit/raise/route.js` — same 3-bucket fix applied

### Documentation
- `_SCOUTIT_BRAIN/04_DATA_AND_SCHEMA/SUPABASE_REBUILD_GUIDE.md` — fully audited rebuild guide for all 15 Supabase tables, verified against every `supabase.from()` call in the codebase. Run this SQL after the security reset to rebuild the DB from scratch.

---

## What Is Blocked / Not Started Yet

| Item | Status | Why blocked |
|---|---|---|
| Supabase reset | Blocked | Owner doing security study first; rotate all tokens after |
| Supabase Auth (real login) | Blocked | Needs reset first. Plan: `SUPABASE_AUTH_INTEGRATION_PLAN.md` |
| RLS hardening | Blocked | Needs Auth first. All policies currently DEV-OPEN |
| Payments / checkout | Deferred | Launch after 200 properties listed (no PayMongo/Xendit yet) |
| QuestIT API (live) | Future | Separate platform, not built yet |
| `property_leads` inquiry route | Future | Commented out in `/api/inquiries/route.js` |

---

## Key Files — Read These Before Touching Anything

```
AGENTS.md                                          ← project rules, read first
_SCOUTIT_BRAIN/00_START_HERE.md                   ← brain index
_SCOUTIT_BRAIN/02_ARCHITECTURE_AND_STRUCTURE/STRUCTURE.md
_SCOUTIT_BRAIN/04_DATA_AND_SCHEMA/DATA_DICTIONARY.md
_SCOUTIT_BRAIN/04_DATA_AND_SCHEMA/SUPABASE_REBUILD_GUIDE.md
_SCOUTIT_BRAIN/04_DATA_AND_SCHEMA/SUPABASE_AUTH_INTEGRATION_PLAN.md
_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/USER_FLOWS.md
_SCOUTIT_BRAIN/06_MONETIZATION/CONNECTS_AND_BROKER_HANDSHAKE.md
src/lib/entitlements.js                           ← tier/feature gating source of truth
src/lib/connectsWallet.js                         ← Connects engine
src/context/DashboardContext.js                   ← main dashboard state
src/app/api/cms/route.js                          ← Airtable proxy (public)
src/lib/airtable.js                               ← Airtable field mapping
src/lib/supabaseClient.js                         ← Supabase client
src/lib/profileClient.js                          ← all profile read/write functions
```

---

## Decisions Already Locked — Do Not Re-Litigate

- Wishlist/Ledger is always localStorage first, never gated — Supabase is cross-device sync only
- `user_id` stays `text` until Auth migration (never UUID right now)
- Connects write only through API routes / Edge Functions — never direct client INSERT
- QuestIT = ScoutIT's internal fulfillment tool, invisible to property owners
- Payments deferred until 200 properties listed
- RLS hardening is last, per-table, after Auth is wired
- All work goes to `main` directly — no feature branches unless owner says otherwise

---

## Suggested Next Steps (in order)

1. Security study → token rotation → Supabase reset → run `SUPABASE_REBUILD_GUIDE.md` SQL
2. Supabase Auth — follow the 7-phase plan in `SUPABASE_AUTH_INTEGRATION_PLAN.md`
3. Getting to 200 properties — any friction in the owner listing flow worth fixing?
4. Pricing page: add Connects explanation tooltip or FAQ section (people won't know what Connects do)
5. RLS hardening (after Auth)
6. Payments (after 200 properties)
