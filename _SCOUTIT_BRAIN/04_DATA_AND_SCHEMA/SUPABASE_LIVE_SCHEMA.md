# ScoutIT — Supabase Live Schema (as applied)

> Source of truth for the Supabase side. Applied June 2026 to project **`yyixsuaimdzyiocswcgc`**
> ("ScoutIT", region ap-northeast-2). Supersedes the older `DATA_DICTIONARY.md` Supabase
> section, which named tables (`profiles`, `user_reactions`, `property_submissions`) that do
> **not** exist — the real tables are below. Cross-ref: `06_MONETIZATION/CONNECTS_AND_BROKER_HANDSHAKE.md`.

## Reality notes
- **Auth is localStorage-based**, not Supabase Auth yet. User IDs are **text** (e.g. `usr-...`).
  All `user_id` columns are text; FK enforcement to `user_profiles` is in place but there's no
  link to `auth.users` until Supabase Auth is wired in.
- **Owners are not a separate table.** An owner = a `user_profiles` row with `'owner'` in
  `active_roles`; `properties.owner_id` and Airtable `PROPERTIES_CMS.Owner_Ref` both point to
  that user id. (No `owner_accounts` table — would be dead weight the code never queries.)
- **RLS is enabled but policies are DEV-OPEN** (`for all using (true)`). **Harden before
  launch**, especially `connect_balances`, `connect_transactions`, `subscriptions`, privacy.
- The project is on a tier that **auto-pauses when idle** — it was paused and restored during
  this build. If queries time out, restore it again.

## Tables applied

**Core (migration `base_core_schema`)** — dashboard/submissions side (public site reads Airtable):
- `properties` — owner submissions / dashboard listings (id, owner_id text, title, type,
  location, price, description, media_link, verified, completeness_score, `coordinates`
  geography). Distinct from Airtable `PROPERTIES_CMS` (public, approved).
- `deals` — broker pitch/CRM workspaces (broker_id, property_id, status, pitch_message, notes).
- `projects` — service-provider portfolios (provider_id, title, status, deliverables…).
- `saved_intel` — the Ledger/wishlist (user_id, property_id). This is the on-device/private save.
- RPC `search_properties_in_radius(lng, lat, radius_km)` — PostGIS Haversine radius search.

**Profiles (migration `user_profiles_system`)**:
- `user_profiles` (text `id` PK) — identity + `subscription_tier`, `connects_balance` (simple
  caches), `active_roles[]`, `provider_type`, `prc_license`, `is_profile_public`, …
- `privacy_settings` — anonymous browsing/byline, public_roles, connects never shown.
- `broker_profiles` — `scout_rating`, `verified_closures`, `active_listings_count`, … (Scout
  Rating from closures only).
- `researcher_profiles` — intel_submissions, credibility, connects_earned_from_research.

**Monetization / user layer (migration `monetization_user_layer`) — NEW, the decided model**:
- `subscriptions` — one row per (user, role): `user_type`, `cosmic_tier`, `airtable_tier_id`,
  `status`, `monthly_connect_grant`, `listing_limit` (null = unlimited). Unique (user_id,
  user_type), so a broker-who-is-also-owner holds two rows.
- `connect_balances` — one per user, three buckets: `granted_balance` (resets monthly, no
  roll-over), `earned_balance` (bounties, never expire), `purchased_balance` (never expire),
  `total_balance` (generated), `last_granted_reset`.
- `connect_transactions` — immutable ledger: kind (grant/reset/spend/earn/purchase/refund),
  bucket, signed amount, reason, `ref_type` (handshake/commission/bounty/pack/subscription),
  `ref_id`. This is where a handshake's 1-Connect charge is recorded (ref = PROPERTY_BROKERS id).
- `bounty_claims` — live claims against Airtable `BOUNTIES` defs: status
  (claimed→submitted→verifying→verified/rejected→paid), proof_url, geo, `payout_connects`,
  `owner_approved` (Cluster+ gate).

## Still to do (Supabase track)
- Wire Supabase Auth (replace localStorage text IDs) → then convert `user_id` to uuid + FK to
  `auth.users`.
- Edge Functions for: monthly granted-Connect reset; handshake charge (debit + write tx + set
  Airtable `Handshake_Connect_Spent`); bounty payout; Airtable↔Supabase sync
  (submission→`PROPERTIES_CMS`, bounty verified→property flag, tier change→display). **Replaces
  the old Make.com plan.**
- Payments + email Edge Functions (PayMongo/Xendit, Resend/Brevo) — deferred per owner.
- Harden RLS to per-user policies.
