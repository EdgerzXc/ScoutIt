# ScoutIT — Supabase Complete Rebuild Guide

> **Purpose:** When you reset/recreate the Supabase project, run every SQL block in this file
> (in order) to fully restore the database. Every table here was verified from a full audit of
> all `supabase.from()` call sites across the entire codebase on 2026-06-25.
>
> **Project to recreate:** Region `ap-northeast-2` (Seoul — closest to PH).
> After creation, update these env vars everywhere (`.env.local` + both Vercel projects
> `scoutit` and `scout-it`):
> - `NEXT_PUBLIC_SUPABASE_URL`
> - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
> - `SUPABASE_SERVICE_ROLE_KEY` (server-side only — never in any `NEXT_PUBLIC_*` var)
>
> Cross-ref: `SUPABASE_AUTH_INTEGRATION_PLAN.md` (auth phases),
> `CONNECTS_AND_BROKER_HANDSHAKE.md` (Connects rules),
> `SUPABASE_LIVE_SCHEMA.md` (last snapshot before reset).

---

## ⚠️ Read before running anything

- All RLS policies below are **DEV-OPEN** (`for all using (true)`). This is intentional for the
  current build phase. **Harden per-table before accepting real subscribers** — see
  `SUPABASE_AUTH_INTEGRATION_PLAN.md` Phase 6.
- `SUPABASE_SERVICE_ROLE_KEY` must only ever be used server-side (API routes / Edge Functions).
  It must never appear in a `NEXT_PUBLIC_*` variable. Double-check after setting up Vercel.
- RLS enabled + no policy = **denies all**. Every table below enables RLS immediately and adds
  the dev-open policy in the same block — so nothing silently blocks during development.
- The identity system is still **localStorage-based** (no Supabase Auth yet). All `user_id`
  columns are `text` (e.g. `"usr-1700000000"`). They become `uuid` when Auth is wired —
  that migration is a separate tracked job in `SUPABASE_AUTH_INTEGRATION_PLAN.md`.

---

## How Supabase connects to the rest of the system

```
AIRTABLE (public read-only CMS)          SUPABASE (private user data)
───────────────────────────────          ──────────────────────────────────────
PROPERTIES_CMS   ←── approved ───────── properties (owner submissions/drafts)
BROKERS_CMS                              user_profiles (identity + tier cache)
PROPERTY_BROKERS ←── handshake ──────── deals (pitch/handshake workspace)
CONNECT_COSTS                            connect_balances (3-bucket wallet)
CONNECT_PACKS                            connect_transactions (audit ledger)
Subscription Tiers                       subscriptions (per-role tier rows)
BOUNTIES         ←── claim/verify ────── bounty_claims
INTEL_CMS                                saved_intel (private wishlist/Ledger)
```

**The Supabase → Airtable sync points (both go through API routes, never direct client):**
1. `POST /api/dashboard/publish` — owner approves draft → `pipeline_status = approved` in
   Supabase → `insertProperty()` pushes to Airtable `PROPERTIES_CMS`
2. `POST /api/dashboard/update` — owner edits an already-approved listing → updates Supabase
   then calls `updateProperty()` to keep Airtable in sync
3. Handshake charge (future Edge Function) — Connect spent → flip Airtable
   `PROPERTY_BROKERS.Handshake_Connect_Spent` checkbox

---

## BLOCK 1 — Extensions (run first)

```sql
create extension if not exists postgis;
```

---

## BLOCK 2 — Core tables

### `properties` — owner submissions and listing drafts

> This is the **private** owner-side. Not the same as Airtable `PROPERTIES_CMS`.
> When an owner publishes, `pipeline_status` flips to `approved` and the record
> is synced to Airtable via `/api/dashboard/publish`.

```sql
create table properties (
  id                   uuid primary key default gen_random_uuid(),
  owner_id             text,                        -- text until Supabase Auth; then real uuid
  title                text not null,
  type                 text,
  space_category       text,
  slug                 text,                        -- synced from Airtable after publish
  location             text,
  price                numeric,
  description          text,
  media_link           text,                        -- primary photo URL
  matterport_tour_url  text,                        -- Vault: 360/Matterport/Luma URL
  pipeline_status      text default 'pending',      -- pending | approved | rejected | closed
  verified             boolean default false,
  completeness_score   integer default 0,
  details              jsonb default '{}',          -- category specs + deepIntel key-values
  coordinates          geography(Point, 4326),      -- PostGIS for radius search
  created_at           timestamptz default now(),
  updated_at           timestamptz default now()
);

alter table properties enable row level security;
create policy "dev open" on properties for all using (true);

-- Radius search RPC used by the map/discover features
create or replace function search_properties_in_radius(
  lng double precision,
  lat double precision,
  radius_km double precision
)
returns setof properties
language sql
as $$
  select * from properties
  where st_dwithin(
    coordinates,
    st_makepoint(lng, lat)::geography,
    radius_km * 1000
  );
$$;
```

### `deals` — broker pitch / owner-invite / handshake CRM workspace

> One row per handshake event. Status mirrors the PROPERTY_BROKERS Airtable row
> once the Make/Edge sync is built.

```sql
create table deals (
  id             uuid primary key default gen_random_uuid(),
  property_id    uuid references properties(id) on delete cascade,
  broker_id      text,             -- broker's user_id (text)
  status         text default 'pending',
  -- statuses: pending | invited | active | declined | closed
  pitch_message  text,
  notes          text,
  created_at     timestamptz default now(),
  updated_at     timestamptz default now()
);

alter table deals enable row level security;
create policy "dev open" on deals for all using (true);
```

### `saved_intel` — Ledger / wishlist (private, per user)

> The public Ledger lives in localStorage (`scoutit_reactions`). This table
> is the server mirror for cross-device sync when a user is logged in.
> Per Council ruling: localStorage is always the source of truth; this table
> never gates or replaces the local Ledger.

```sql
create table saved_intel (
  id          uuid primary key default gen_random_uuid(),
  user_id     text not null,
  property_id text not null,      -- Airtable record ID (text) or Supabase UUID
  created_at  timestamptz default now(),
  unique (user_id, property_id)
);

alter table saved_intel enable row level security;
create policy "dev open" on saved_intel for all using (true);
```

### `error_reports` — client-side error logging

> Written by `src/lib/reportError.js`. Columns verified from the actual insert payload.

```sql
create table error_reports (
  id          uuid primary key default gen_random_uuid(),
  kind        text,                        -- e.g. 'js_error' | 'api_error'
  user_id     text,
  user_name   text,
  message     text,
  stack       text,
  url         text,
  user_agent  text,
  context     jsonb,
  created_at  timestamptz default now()
);

alter table error_reports enable row level security;
create policy "dev open" on error_reports for all using (true);
```

---

## BLOCK 3 — User profile system

> All written/read by `src/lib/profileClient.js`. Every function there is
> documented here so you know exactly which columns each function touches.

### `user_profiles` — master identity + tier/role cache

> Written by: `upsertProfile()`, `updateProfilePublic()`, badge claim API,
> Connect spend APIs (updates `connects_balance` cache).
> Read by: `loadOwnProfile()`, `loadPublicProfile()`, DashboardContext badges fetch.

```sql
create table user_profiles (
  id                    text primary key,           -- text until Auth; becomes uuid after
  display_name          text,                       -- public username / byline
  name                  text,                       -- full name (private)
  email                 text,
  avatar_url            text,
  location              text,
  headline              text,
  bio                   text,
  firm                  text,                       -- broker firm name
  service               text,                       -- provider service description
  subscription_tier     text default 'starry',      -- starry | solar | cluster | universe
  active_roles          text[] default '{seeker}',  -- seeker | owner | broker | photographer | researcher
  provider_type         text,                       -- photographer | researcher | event_planner
  provider_availability boolean default true,
  prc_license           text,                       -- broker PRC license
  is_profile_public     boolean default false,
  member_since          timestamptz,
  badges                jsonb default '[]',         -- [{id, minted_at}]
  connects_balance      integer default 0,          -- denormalized cache; source of truth = connect_balances
  updated_at            timestamptz default now()
);

alter table user_profiles enable row level security;
create policy "dev open" on user_profiles for all using (true);
```

### `privacy_settings` — per-user privacy controls

> Written/read by: `loadPrivacySettings()`, `updatePrivacySettings()`.
> Auto-created with defaults on first load if row doesn't exist.

```sql
create table privacy_settings (
  id                       uuid primary key default gen_random_uuid(),
  user_id                  text not null unique,
  anonymous_browsing       boolean default false,
  anonymous_byline         boolean default false,
  public_roles             text[] default '{}',
  connects_balance_visible boolean default false,
  created_at               timestamptz default now()
);

alter table privacy_settings enable row level security;
create policy "dev open" on privacy_settings for all using (true);
```

### `broker_profiles` — broker-specific extended data

> Written/read by: `loadBrokerProfile()`.
> Auto-created with defaults on first load if row doesn't exist.
> Scout Rating comes from verified closures only — never purchased or tier-granted.

```sql
create table broker_profiles (
  id                     uuid primary key default gen_random_uuid(),
  user_id                text not null unique,
  scout_rating           numeric default 0,         -- from verified closures only
  verified_closures      integer default 0,
  active_listings_count  integer default 0,         -- mirrors Airtable PROPERTY_BROKERS Active count
  firm_name              text,
  specializations        text[],
  created_at             timestamptz default now()
);

alter table broker_profiles enable row level security;
create policy "dev open" on broker_profiles for all using (true);
```

### `researcher_profiles` — researcher-specific extended data

> Written/read by: `loadResearcherProfile()`.
> Auto-created with defaults on first load if row doesn't exist.

```sql
create table researcher_profiles (
  id                             uuid primary key default gen_random_uuid(),
  user_id                        text not null unique,
  intel_submissions              integer default 0,
  credibility_score              numeric default 0,
  connects_earned_from_research  integer default 0,
  created_at                     timestamptz default now()
);

alter table researcher_profiles enable row level security;
create policy "dev open" on researcher_profiles for all using (true);
```

### `projects` — photographer/provider portfolio items

> Written/read by: `loadPhotographerProjects()`.

```sql
create table projects (
  id            uuid primary key default gen_random_uuid(),
  provider_id   text not null,
  title         text,
  cover_image   text,
  status        text default 'active',
  deliverables  jsonb default '[]',
  created_at    timestamptz default now()
);

alter table projects enable row level security;
create policy "dev open" on projects for all using (true);
```

---

## BLOCK 4 — Connects wallet engine

> Rules locked in `CONNECTS_AND_BROKER_HANDSHAKE.md`.
> **Anti-exploit:** `granted_tier` records which tier was active at the last monthly reset.
> Mid-month upgrade only grants the delta (new allowance − already granted this month).
> Downgrade: next month resets at the lower tier. Subscribe-cancel farming is blocked because
> the reset only fires once per calendar month regardless of tier changes.

### `connect_balances` — one row per (user_id, role)

> Each role a user holds has its own independent wallet.
> Written by: `/api/dashboard/invite`, `/api/v1/questit/raise`, future Edge Functions.
> Never written directly by client code.

```sql
create table connect_balances (
  id                  uuid primary key default gen_random_uuid(),
  user_id             text not null,
  role                text not null,               -- seeker | owner | broker | photographer | researcher
  granted_balance     integer not null default 0,  -- resets monthly, no roll-over
  purchased_balance   integer not null default 0,  -- never expires
  earned_balance      integer not null default 0,  -- bounty payouts, never expires
  total_balance       integer generated always as
                        (granted_balance + purchased_balance + earned_balance) stored,
  granted_month       text,                        -- 'YYYY-MM' of last reset
  granted_tier        text default 'starry',       -- tier at time of last grant (anti-exploit)
  last_granted_reset  timestamptz,
  updated_at          timestamptz default now(),
  unique (user_id, role)
);

alter table connect_balances enable row level security;
create policy "dev open" on connect_balances for all using (true);
```

### `connect_transactions` — immutable audit ledger

> Every Connect movement is recorded here. Never deleted or updated.
> Written by: `/api/dashboard/invite`, `/api/v1/questit/raise`, future Edge Functions.

```sql
create table connect_transactions (
  id          uuid primary key default gen_random_uuid(),
  user_id     text not null,
  role        text not null,                       -- which role wallet was affected
  kind        text not null,                       -- grant | reset | spend | earn | purchase | refund
  bucket      text not null,                       -- granted | purchased | earned
  amount      integer not null,                    -- negative = debit, positive = credit
  reason      text,
  ref_type    text,                                -- handshake | commission | bounty | pack | subscription
  ref_id      text,                                -- ID of related record
  created_at  timestamptz default now()
);

alter table connect_transactions enable row level security;
create policy "dev open" on connect_transactions for all using (true);
```

---

## BLOCK 5 — Subscriptions

> One row per (user_id, user_type) — a broker-who-is-also-owner holds two rows.
> Unique constraint enforces this.

```sql
create table subscriptions (
  id                    uuid primary key default gen_random_uuid(),
  user_id               text not null,
  user_type             text not null,             -- which role this subscription covers
  cosmic_tier           text not null default 'starry',
  airtable_tier_id      text,                      -- links to Airtable Subscription Tiers table
  status                text default 'active',     -- active | cancelled | paused | past_due
  monthly_connect_grant integer default 1,
  listing_limit         integer,                   -- null = unlimited (Universe tier)
  current_period_start  timestamptz,
  current_period_end    timestamptz,
  payment_provider      text,                      -- paymongo | xendit (when payments go live)
  payment_ref           text,
  created_at            timestamptz default now(),
  updated_at            timestamptz default now(),
  unique (user_id, user_type)
);

alter table subscriptions enable row level security;
create policy "dev open" on subscriptions for all using (true);
```

---

## BLOCK 6 — Bounties

> Bounty definitions live in Airtable `BOUNTIES`. This table tracks individual
> user claims and quests raised against those definitions.
> `initiator_id` = the owner/user who raised the quest.
> `user_id` = the researcher who claimed and fulfilled it.

```sql
create table bounty_claims (
  id              uuid primary key default gen_random_uuid(),
  initiator_id    text,                            -- user who raised the quest
  user_id         text,                            -- researcher who claimed it
  bounty_id       text,                            -- Airtable BOUNTIES record ID (optional)
  property_id     text,                            -- Airtable PROPERTIES_CMS record ID
  target_field    text,                            -- which data field the quest is gathering
  status          text default 'open',
  -- statuses: open | claimed | submitted | verifying | verified | rejected | paid
  proof_url       text,
  geo             jsonb,                           -- lat/lng of submission
  payout_connects integer default 0,
  owner_approved  boolean default false,           -- Cluster+ gate: owner must confirm
  submitted_at    timestamptz,
  verified_at     timestamptz,
  created_at      timestamptz default now()
);

alter table bounty_claims enable row level security;
create policy "dev open" on bounty_claims for all using (true);
```

---

## BLOCK 7 — QuestIT API bridge

> QuestIT is a future standalone app. These tables let the QuestIT app talk
> to ScoutIT via API key auth. ScoutIT team also uses this internally to post
> quests on behalf of owners who join the Vault recording queue.

```sql
create table questit_api_keys (
  id            uuid primary key default gen_random_uuid(),
  user_id       text not null,
  api_key_hash  text not null unique,
  is_active     boolean default true,
  last_used_at  timestamptz,
  created_at    timestamptz default now()
);

alter table questit_api_keys enable row level security;
create policy "dev open" on questit_api_keys for all using (true);

create table questit_policies (
  id            uuid primary key default gen_random_uuid(),
  user_id       text not null unique,
  policy_rules  jsonb default '{}',               -- daily_limit, max_bounty_connects, etc.
  created_at    timestamptz default now()
);

alter table questit_policies enable row level security;
create policy "dev open" on questit_policies for all using (true);

create table company_quests (
  id              uuid primary key default gen_random_uuid(),
  company_id      text not null,
  property_id     text not null,
  target_field    text,                            -- which data field the quest is gathering
  description     text,
  bounty_connects integer default 0,
  status          text default 'open',             -- open | claimed | fulfilled | cancelled
  created_at      timestamptz default now()
);

alter table company_quests enable row level security;
create policy "dev open" on company_quests for all using (true);
```

---

## BLOCK 8 — Future / commented-out tables (create now, wire later)

> These are referenced in the codebase but currently commented out or not yet used.
> Create them now so the schema is complete.

### `property_leads` — inquiry submissions from the property page

> Currently commented out in `/api/inquiries/route.js`. The table is ready;
> the route just needs to be uncommented when inquiry flow is built.

```sql
create table property_leads (
  id           uuid primary key default gen_random_uuid(),
  property_id  text not null,                      -- Airtable PROPERTIES_CMS record ID
  name         text,
  email        text,
  phone        text,
  message      text,
  source       text,                               -- which page/button triggered it
  created_at   timestamptz default now()
);

alter table property_leads enable row level security;
create policy "dev open" on property_leads for all using (true);
```

---

## After running all blocks — verification checklist

- [ ] All 15 tables created with no errors
- [ ] `select postgis_version();` returns a version string
- [ ] `select * from search_properties_in_radius(121.02, 14.55, 5);` returns rows or empty (no error)
- [ ] Update `.env.local` — `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] Update both Vercel projects env vars and redeploy
- [ ] Smoke test: open `/dashboard` as Owner → create a test listing → check row appears in `properties` table in Supabase dashboard
- [ ] Smoke test: invite a broker → check row appears in `deals` and `connect_transactions`
- [ ] Smoke test: save a property → check row appears in `saved_intel`

---

## What lives in Airtable — do NOT recreate in Supabase

| Table | Purpose |
|---|---|
| `PROPERTIES_CMS` | Public approved listings (read-only by the website) |
| `BROKERS_CMS` | Public broker directory |
| `PROPERTY_BROKERS` | Broker↔property relationships + handshake status |
| `CONNECT_COSTS` | Cost per action (e.g. handshake = 1) |
| `CONNECT_PACKS` | Buy ladder: ₱49/199/499/1,199 |
| `Subscription Tiers` | Tier config per role (listing limits, grant amounts) |
| `BOUNTIES` | Bounty definitions (what can be claimed) |
| `INTEL_CMS` | Editorial intel articles |
| `L2_CATEGORIES` | Property category taxonomy |
| `REACTION_TAGS` | Ledger reaction types |
| `FEATURE_GATES` | Feature flag config per tier + user type |

---

## Known code bugs to fix when you rebuild (do not skip these)

These bugs exist in the current code. They won't crash the app today (localStorage covers them),
but they will cause silent failures once Supabase is the real data store.

| Bug | File | What's wrong | Fix |
|---|---|---|---|
| `saved_intel` inserts without `user_id` | `src/context/DashboardContext.js` `toggleSave()` | Record inserted without user_id; breaks unique constraint | Pass `currentUser?.id` as `user_id` when inserting, or skip the Supabase write if user is not logged in |
| `deals` inserts without `broker_id` in `sendPitch()` | `src/context/DashboardContext.js` `sendPitch()` | Broker pitches have NULL broker_id; CRM can't identify who pitched | Add `broker_id: currentUser?.id` to the insert payload |
| `invite/route.js` only checks `granted_balance` | `src/app/api/dashboard/invite/route.js` | Ignores purchased and earned buckets; a user with only purchased Connects gets blocked | Replace with 3-bucket spend logic: check `granted` first, then `purchased`, then `earned` |
| `connect_balances` designed per-role but queried per-user | `invite/route.js`, `v1/questit/raise/route.js` | Code does `.eq('user_id', userId).single()` — breaks if multiple role rows exist | Decide: either query by `(user_id, role)` or simplify schema to single row per user |

---

## Still to build after security hardening (do not do these now)

| Item | Notes |
|---|---|
| **Supabase Auth** | Replace localStorage text IDs with real `auth.users` UUIDs. Then convert all `user_id text` → `uuid` + FK. See `SUPABASE_AUTH_INTEGRATION_PLAN.md` for the 7-phase plan. |
| **RLS hardening** | Replace `using (true)` with per-user policies (e.g. `using (auth.uid()::text = user_id)`). One table at a time, verified before the next. |
| **Edge Functions** | `monthly-connect-reset` (1st of month, per-role, anti-exploit tier check) · `handshake-charge` (debit + tx + Airtable flag) · `bounty-payout` (credit earned bucket) · `airtable-sync` (submission approved → Airtable push) |
| **Payments** | PayMongo or Xendit webhook → update `subscriptions` + credit `purchased_balance` + write `purchase` transaction |
| **Email** | Resend or Brevo — onboarding confirmation, handshake notifications, Vault queue updates |
| **`property_leads` route** | `/api/inquiries/route.js` has the insert commented out — uncomment when inquiry flow ships |
