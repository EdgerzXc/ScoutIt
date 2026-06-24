# ScoutIT — Supabase Auth + Database Integration Plan

> Drafted 2026-06-24. The "final boss" before a real, persistent prototype.
> Council-ruled (see §2). Honors every SOP invariant. **Plan only — nothing executes without owner approval, one phase at a time.**
> Source of truth: the running code + live DB (verify in Phase 0 before acting).

---

## 1. Where we actually are (verified from the code, 2026-06-24)

**Already wired to Supabase (≈70% done):** `properties`, `deals`, `user_profiles`, `saved_intel`,
`connect_balances/transactions`, `broker/researcher_profiles` are read/written across **16 `.from()`
call sites**. `lib/profileClient.js` already upserts + loads profiles. Owner publish/load already hit
Supabase. Connects spend already routes through Edge-Function-style API routes (`/api/dashboard/invite`).

**The real gap = identity.** There is **no `supabase.auth` anywhere**. `currentUser` is a mock read from
`localStorage.scoutit_user`; `user.id` is a text key like `usr-1700000000`. Every owner_id / user_id
write currently uses that mock text id.

**So this phase is narrow:** replace the mock identity with a real Auth session, make the real user id
flow into the writes that already exist, mirror the wishlist for logged-in users, add route guards, and
harden RLS last.

**Inconsistencies to resolve in Phase 0 (found in the SQL files):**
- `properties.owner_id` is declared `uuid` in `supabase_schema.sql`, but the 2026-06-22 handoff says
  user-ref columns were coerced to **text**. → Verify the live column type before writing.
- Two RLS files exist: `supabase_schema.sql` (dev-open) and `supabase_rls_policies.sql` (hardened,
  owner-scoped, casts `auth.uid()::text`). → Confirm which is **currently live**.
- `user_profile_schema.sql` header names project `zytsuaimziyxnzrwrqs`, but the live project per the
  handoff is `yyixsuaimdzyiocswcgc`. → Confirm the real project id before running any SQL.

---

## 2. Council rulings (decided — do not re-litigate)

1. **Wishlist = hybrid, never gated.** `localStorage` (`scoutit_reactions`) stays the source of truth and
   the anonymous experience. On login, mirror to `saved_intel` for cross-device sync. No account ever
   required to save. *(Protects the privacy-first Ledger invariant.)*
2. **Identity = keep `text` columns, store the real Auth UUID as text.** No column/FK migration this phase
   (the hardened RLS already casts `auth.uid()::text`). Full UUID migration is a deferred separate job.
3. **RLS hardening is LAST**, per-table, each verified live, with dev-open kept as instant rollback.
   Connects writes stay on Edge Functions (service role) — unchanged.
4. **Real auth is added alongside the demo-owner login.** Scaffolding removal is a separate final gated step.

---

## 3. Invariants honored throughout
- **Dual-CMS:** Airtable stays the public read-only CMS — **the public property directory does not change.**
- **Ledger never gated / never server-required.**
- **Connects via Edge Functions only** (no client INSERT/UPDATE on connect tables).
- **Nothing to `main`/Vercel without owner say-so.** Smallest additive change per step; verify before next.
- **`NEXT_PUBLIC_*` env vars must stay non-sensitive** (the prior empty-dashboard root cause).

---

## 4. The phased plan (each phase is small, additive, verified, reversible)

### Phase 0 — Pre-flight (read-only; do this first)
- Restore the Supabase project if paused; confirm it's `yyixsuaimdzyiocswcgc`.
- Verify live: column type of `properties.owner_id` and `user_profiles.id`; **which RLS set is live**;
  that `NEXT_PUBLIC_SUPABASE_URL/ANON_KEY` are present + non-sensitive in Vercel + `.env.local`.
- Baseline: run the e2e suite (currently 8/8) and capture green as the rollback reference.
- **Output:** a one-paragraph "live state confirmed" note appended here. No changes yet.

### Phase 1 — Auth foundation (additive, nothing removed)
- Add auth helpers (new `lib/authClient.js` or extend `supabaseClient.js`): `signUp`, `signInWithPassword`,
  `signOut`, `getSession`, `onAuthStateChange`. Keep the inert-stub fallback behavior.
- On `/onboarding`: add a real **email+password login/signup** form **next to** the existing demo-owner
  button (demo stays as scaffolding).
- In `DashboardContext`: subscribe to `onAuthStateChange`; when a session exists, treat it as the signed-in
  user. Keep the `localStorage.scoutit_user` mirror for backward compatibility this phase.
- **Verify:** sign up → confirm a row appears in `auth.users`; refresh keeps the session; sign out clears it.

### Phase 2 — Unify identity
- For a logged-in user, set `currentUser.id = session.user.id` (the Auth UUID, stored as text).
- On first authenticated load, `upsertProfile()` (already exists) into `user_profiles` keyed by that id.
- Ensure the existing profile fetch (`DashboardContext` badges fetch) uses the session id.
- **Verify:** logged-in `currentUser.id` is the Auth UUID; `user_profiles` row exists for it.

### Phase 3 — Owner listings on the real id (mostly already built)
- Confirm publish (`/api/dashboard/publish` + `LiveEditorWorkspace`) writes `owner_id = session uuid`.
- Confirm dashboard load filters `properties` by the session uuid (not the mock id).
- Decide on seeded demo data (`usr-sm-offices` listings): re-point to a real test account, or keep as demo.
- **Verify:** new owner account → publish a listing → it loads only for that owner; Airtable public side
  unaffected.

### Phase 4 — Wishlist hybrid sync (per Council ruling 1)
- Keep `localStorage` Ledger exactly as-is for everyone (anonymous included).
- On login: push any local `scoutit_reactions` into `saved_intel` (dedupe by `user_id + property_id`).
- On authenticated load: merge `saved_intel` rows back into the local Ledger (union, local wins on conflict).
- **Never** block saving on auth.
- **Verify:** save anonymously → still works; log in → saves appear in `saved_intel`; open on a second
  session → saves are there; log out → local Ledger still usable.

### Phase 5 — Protected routes
- Guard owner/dashboard surfaces: if no session, redirect to `/onboarding` (client guard or middleware).
- **Public directory (`/property`, `/discover`, intel) stays fully open** — no guard.
- **Verify:** signed-out visit to `/dashboard` redirects; public pages load signed-out.

### Phase 6 — RLS hardening (LAST + riskiest; per-table, verified, rollback ready)
- Apply `supabase_rls_policies.sql` **one table at a time** (properties → deals → profiles → saved_intel).
- After each table: confirm the app still reads/writes as the authenticated user; if a table goes empty,
  roll that table back to dev-open immediately and diagnose (almost always a missing session on the request).
- Connect tables: leave write-locked (Edge Functions only) — already correct.
- **Verify:** authenticated user sees only their own drafts/deals/saves; anon sees only what's intended.

### Phase 7 — Pre-launch scaffolding removal (separate, gated, do NOT bundle here)
- Remove demo-owner login, mock-data fallbacks, any "Simulate" backdoors, and the dev-open rollback policies.
- This is its own session with its own owner sign-off.

---

## 5. Risk register
| Risk | Mitigation |
|---|---|
| Hardened RLS before auth works → empty screens (the prior saga) | RLS is Phase 6, per-table, with instant dev-open rollback |
| `NEXT_PUBLIC_*` marked Sensitive → client can't auth | Phase 0 confirms non-sensitive; re-verify after any Vercel change |
| text/uuid mismatch on writes | Council ruling 2: keep text, store uuid-as-text; RLS already casts |
| Seeded demo data orphaned from real accounts | Phase 3 decision: re-point or keep as demo |
| Breaking the working 70% | Every phase additive + verified before the next; e2e baseline from Phase 0 |

---

## 6. Needs an owner decision before/at that phase
- **Email confirmation on signup?** On (safer, needs email flow later) vs off (faster for prototype).
- **Seeded SM-Offices listings:** re-point to a real test account, or keep purely as the demo?
- **Phase 6 timing:** harden RLS now, or stay dev-open until just before public launch (security is a
  deferred overhaul per the SOP — this is a judgment call).

---

## 7. Suggested execution order
Phase 0 (verify) → 1 (auth) → 2 (identity) → 4 (wishlist) → 3 (owner listings confirm) → 5 (guards) →
6 (RLS, when owner says) → 7 (scaffolding removal, separate). Each phase ends green before the next begins.
