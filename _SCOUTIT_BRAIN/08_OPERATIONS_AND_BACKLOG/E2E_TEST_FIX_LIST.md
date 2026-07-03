# E2E Test & Fix List — things to verify/repair in the full end-to-end pass

> **Function of this file:** every bug or unverified flow flagged during codebase work that
> needs a real, authenticated, click-through test before it can be trusted — as opposed to the
> unit-level SQL/API checks already done inline. Owner instruction (2026-07-02): park these,
> keep building the Master Build Spec, come back for one dedicated E2E pass later.
> Add to this file whenever you find something during other work that needs full E2E
> verification rather than fixing it as a tangent — don't silently expand scope.

---

## ✅ Fixed AND fully E2E-verified with a real account (2026-07-02, part 3)

### 1. `inviteBroker()` never sends an Authorization header — FIXED + E2E VERIFIED
**File:** `src/context/DashboardContext.js` → `inviteBroker()` → `fetch("/api/dashboard/invite", ...)`
**Found:** 2026-07-02, while hardening `/api/dashboard/invite/route.js` for the Security Core work.
**Fixed:** now calls `getSession()` and attaches `Authorization: Bearer ${session.access_token}`.
**E2E verified 2026-07-02 (part 3):** created a real (throwaway) Supabase Auth user via the Admin
API, funded a test Connects wallet, and hit the real route end-to-end: no-token → 401 as expected;
real listing + no balance → clean "Insufficient Connects balance" 403 with correct rollback of the
`deals` row; real listing + funded wallet → full success, `deals` row created, `connect_transactions`
ledger row correct (right bucket, right amount, right reason). All test data cleaned up after.

### 1b. `user_profiles.badges` column didn't exist — FIXED + E2E VERIFIED, then corrected further
**Found:** 2026-07-02, while wiring the Badge Engine to real data. Three live code paths referenced
a `badges` column on `user_profiles` that was never migrated in — profile saves and badge claims
were likely failing for every real user. **Corrected twice this session:** first added a `badges
jsonb` column (worked, but was later found to diverge from the real `SCOUTIT_MASTER_BUILD_SPEC.md`
§5.2, which specifies a proper `user_badges` table) — redone as `public.user_badges` (`user_id`,
`badge_id`, `earned_at`, `granted_by`, `progress_snapshot`) before any real data existed, so the
correction was free. Claim route now enforces real max_slots scarcity server-side.
**E2E verified 2026-07-02 (part 3):** real Supabase Auth user, real claim → success; duplicate
claim → correctly rejected (`23505` unique-constraint violation); real count updates on `/badges`.

### 1c. New real bug found DURING this E2E pass: no `user_profiles` auto-provisioning
**Found:** 2026-07-02 (part 3), while E2E-testing 1b with a genuinely fresh signup (not a seeded
profile) — the badge claim failed with a foreign-key violation because the brand-new auth user had
no `user_profiles` row at all. **No code path anywhere created one** — `onboarding/page.js` only
ever `SELECT`s, `profileClient.js`'s `upsertProfile()` only runs when a user visits `/profile`.
Since `user_badges` AND `connect_balances` both FK to `user_profiles`, this would have silently
blocked badges *and* Connects for every real new signup, indefinitely, until they happened to visit
`/profile` first. **Fixed:** standard Supabase `AFTER INSERT ON auth.users` trigger
(`handle_new_auth_user()`) that auto-creates a minimal `user_profiles` row. Verified: deleted and
recreated the test user, confirmed the trigger fires and the row appears immediately.

---

## 🟡 Rewired but only unit/API-tested — needs a full authenticated click-through

### 2. `/api/dashboard/invite` — the atomic Connects spend
**Rewired:** 2026-07-02 to call the new `spend_connects` Postgres RPC instead of racy manual
balance math (see `NEXT_DAY_HANDOFF.md` §7-10).
**Tested so far:** RPC math verified directly in SQL with a throwaway wallet (bucket order,
ledger rows, insufficient-balance failure all correct). Route confirmed to compile and 401
correctly with no token.
**Still needed:** a real owner session inviting a real broker on a real (or sandboxed) listing —
confirm the deal is created, the Connect is actually deducted from the right bucket, and the
UI reflects the new balance. Blocked on fixing #1 above first (no Authorization header = will
never get past the auth check).

### 3. `/api/v1/questit/raise` — same atomic Connects spend
**Rewired:** same session, same RPC. Verified to compile and 401 on invalid API key.
**Still needed:** a real QuestIT API key + a real company/policy row, raise a bounty, confirm
the quest is posted AND the Connects were actually deducted (single atomic operation now,
previously 3 separate un-locked writes).

### 4. Deep Intelligence panel plumbing (`DeepIntel_JSON` → `property.deepIntel`)
**Built:** 2026-07-02, earlier in the same session — `src/lib/airtable.js` now parses a new
`DeepIntel_JSON` Airtable column into `property.deepIntel` (expanded so both `DI_`-key lookups
and label lookups resolve), plus a fix to `ResidentialFlow.js`'s `DeepIntelWidget` to accept
both plain-label and `{key,label}` field shapes.
**Never verified in a browser** — this work was interrupted mid-verification (session pivot to
the Units/Security Core work) and picking Airtable back up is explicitly parked for later per
today's "pure codebase, connect Airtable later" instruction. **Re-verify once Airtable work
resumes**: open a Commercial property with real `DeepIntel_JSON` data, confirm the panel shows
real values instead of "Not recorded", confirm Residential's panel still works the same way.

---

## 🟢 New pure-codebase pieces this session — no bug suspected, just unverified end-to-end

### 5. Connects breakdown popover
**Built:** 2026-07-02 — `src/components/dashboard/ConnectsBreakdown.js`, wired into
`src/app/dashboard/page.js` (both desktop and mobile Connects pills).
**Tested so far:** clicked in a real running dev server with a seeded mock user, confirmed
correct bucket math (real numbers from `connectsWallet.js`, not placeholders), confirmed
click-outside-to-close. Verified for the Owner role only.
**Still needed:** click through as Broker / Seeker(buyer) / each Provider subtype
(photographer/researcher/designer) to confirm `walletRoleForMode()`'s mapping holds for all of
them, and confirm the header pill number and the popover total agree once a user goes through
the *real* login/init path (`handleUserLogin` → `initWalletIfEmpty` → `setConnects`) instead of
a synthetic test seed (today's test bypassed that path, which is why the header briefly showed
a stale number while the popover showed the correct one — not a bug, just an artifact of the
quick test).

---

## 🔵 Deferred data-model decision (resolved 2026-07-02 — not a quick fix, tracked separately)

### 6. `connect_balances` / `connect_transactions` have no `role` column
**Found:** 2026-07-02, while building the `spend_connects` RPC.
**The gap:** the live tables have one wallet per `user_id`, full stop — no `role` column.
**Resolved 2026-07-02 (re-read against `06_MONETIZATION/TIER_DISTINCTION.md`, the actual dated
spec):** per-role Connects wallets are a real, locked design (2026-06-25) — NOT a documentation
error to just delete. But `TIER_DISTINCTION.md §0` is explicit that per-role wallets are
downstream of **"the foundation refactor"**: storing `subscription_tier` per role
(`{seeker:"solar", owner:"starry", ...}`) instead of the current single account-wide tier field.
That foundation refactor **has not started** — `user_profiles.subscription_tier` is still one
value per account today, and there is **no payment provider wired at all** (checkout is a 404,
buy buttons are disabled "Coming Soon" per the same doc). Adding a `role` column to just the
Connects tables now would build one slice of a multi-file refactor (also touches
`entitlements.js`, `connectsWallet.js`, `spend_connects`, `ConnectsBreakdown.js`, every
tier-gate check) without its prerequisite, leaving a half-implemented, confusing state.
**Decision:** not built this session. This is correctly scoped as its own future foundation-
refactor project (see `TIER_DISTINCTION.md §0` and "What making it real requires"), not an E2E
fix-list item. Today's single-wallet-per-user reality is intentional-by-default until that
refactor happens, not a bug.

---

## How to use this file
- Don't fix items here as a drive-by while doing unrelated work — note them here instead
  (this is exactly how this file started).
- When the dedicated E2E pass happens, work top to bottom: fix #1 first (it blocks #2), then
  verify #2/#3 for real, then come back to #4/#5 once their prerequisite work (Airtable
  reconnection) resumes.
- Cross-reference: `NEXT_DAY_HANDOFF.md` (session-by-session history), `SCOUTIT_MASTER_BUILD_SPEC.md`
  (the active build order this all traces back to).
