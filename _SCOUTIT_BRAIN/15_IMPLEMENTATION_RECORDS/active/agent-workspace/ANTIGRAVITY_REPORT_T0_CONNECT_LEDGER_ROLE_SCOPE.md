---
section: "15_IMPLEMENTATION_RECORDS/active/agent-workspace"
status: active
date: 2026-08-14
type: devlog
report-state: ready-for-review
task-id: T0-1.0D-CONNECT-LEDGER-ROLE-SCOPE-2026-08-14
tags: [devlog, agent-workspace, antigravity-report, connects, role-scope, migration-proposal]
updated: 2026-08-14
ai-first: true
related: ["[[TASK_T0_CONNECT_LEDGER_ROLE_SCOPE]]", "[[00_MASTER_ACTION_PLAN]]", "[[DATA_DICTIONARY]]"]
---

# Antigravity Report — Connect Ledger Role Scope Audit & Migration Proposal

## Task identity

- **Task ID:** `T0-1.0D-CONNECT-LEDGER-ROLE-SCOPE-2026-08-14`
- **Starting state:** `ready-for-build`
- **Final state:** `ready-for-review`

## Preflight and working tree baseline

- **Preflight command:** `git status --short`
- **Pre-existing changes preserved:**
  - `_SCOUTIT_BRAIN/00_MASTER_SYNC.md`
  - `_SCOUTIT_BRAIN/15_IMPLEMENTATION_RECORDS/active/launch-readiness/MIGRATION_DRIFT_2026-08-12.md`
  - `src/app/intel/page.js`
  - `src/app/property/DirectoryClient.js`
  - `src/lib/__tests__/categoryAuthority.test.js`
  - `src/lib/__tests__/deviceTelemetryApi.test.js`
  - `src/lib/calendar/googleOAuth.js`
  - `src/lib/__tests__/googleOAuthRedirect.test.js`
  - `supabase/migrations/20260803000001_production_security_rls.sql`
  - `supabase/migrations/20260811000001_wishlist_share_revocation.sql`
  - `supabase/migrations/20260811000002_pilot_cohort_registry.sql`
  - `supabase/migrations/README.md`

---

## 1. Forensic Mapping of Tables, RPCs, and Callers

### A. Legacy Tables (`connect_balances` & `connect_transactions`)
- **`public.connect_balances`:**
  - *Schema:* Single-row per user (`user_id text PRIMARY KEY, granted_balance int4, purchased_balance int4, earned_balance int4, total_balance int4, last_granted_reset text/date, updated_at timestamptz`).
  - *Active Callers:*
    - `src/app/api/auth/complete-onboarding/route.js` (lines 104–113): Provisions initial allowance via `upsert({ user_id, granted_balance, ... }, { onConflict: "user_id" })`.
    - `src/app/api/admin/connects-refund/route.js` (line 48): GET selects user balance via `.eq("user_id", userId).maybeSingle()`.
    - `supabase/migrations/20260805000013_system_error_connect_refund.sql`: Updates `connect_balances` inside `refund_connects_system_error`.
    - `mission-control/src/app/dashboard/metrics/page.js` & `mission-control/src/lib/databaseSecurityReadiness.js`: Queries and guards `connect_balances`.
- **`public.connect_transactions`:**
  - *Schema:* Append-only transaction log without role column (`id uuid PK, user_id text, kind text, bucket text, amount int4, reason text, ref_type text, ref_id text, created_at timestamptz`).
  - *Active Callers:*
    - `src/app/api/admin/connects-refund/route.js` (line 53): Selects recent transactions for audit.
    - `supabase/migrations/20260805000013_system_error_connect_refund.sql`: Inserts refund audit record.
    - `mission-control/src/app/dashboard/metrics/page.js`: Summarizes transaction counts.

### B. Canonical Role-Scoped Tables (`user_connect_wallets` & `connect_wallet_ledger`)
- **`public.user_connect_wallets`:**
  - *Origin:* Defined in LR-03 migration `supabase/migrations/20260802000003_connects_wallet_and_tiers.sql`.
  - *Schema:* `id uuid PK, user_id text, role text DEFAULT 'seeker', granted_balance int4, granted_month text (YYYY-MM), purchased_balance int4, reward_balance int4, created_at, updated_at, UNIQUE(user_id, role)`.
  - *Role Scoping:* Strictly role-scoped per persona (`seeker`, `owner`, `broker`, `photographer`, `researcher`).
- **`public.connect_wallet_ledger`:**
  - *Origin:* Defined in `20260802000003_connects_wallet_and_tiers.sql`.
  - *Schema:* `id uuid PK, user_id text, role text, amount int4, transaction_type text, source text, reason text, reference_id text, spend_order jsonb, before_granted, after_granted, before_purchased, after_purchased, before_reward, after_reward, is_refundable bool, created_at`.

### C. Connect Spend and Refund RPCs
- **`public.spend_connects_atomic` (`20260802000003_connects_wallet_and_tiers.sql`):**
  - Thread-safe spend function using Postgres advisory lock `pg_advisory_xact_lock`.
  - Enforces exact locked 3-bucket spend priority:
    1. Role Monthly Granted (expiring on calendar month rollover)
    2. Account-wide Purchased (permanent)
    3. Account-wide Reward (permanent)
  - Operates on `user_connect_wallets` and inserts audit rows into `connect_wallet_ledger`.
- **`public.spend_connects` (`20260803000001_production_security_rls.sql`):**
  - Canonical wrapper alias delegating to `spend_connects_atomic`.
- **`public.refund_connects_system_error` (`20260805000013_system_error_connect_refund.sql`):**
  - Applied to production 2026-08-05.
  - Dedicated admin system-error refund procedure requiring `p_staff_id` and reason.

---

## 2. Assessment of Backlog Item in Master Action Plan

**Master Action Plan line 859 stated:**
> `- [ ] 🟡 connect_balances / connect_transactions have no role column. Owner-resolved 2026-08-02; the migration was never written`

### Forensic Findings:
1. **Factually Obsolete Phrasing:**
   - The role-scoped schema was **already written** on 2026-08-02 in `20260802000003_connects_wallet_and_tiers.sql` via dedicated tables `user_connect_wallets` and `connect_wallet_ledger`.
2. **Destructive Risk of Altering Legacy Tables:**
   - Appending a `role` column to legacy `connect_balances` and making `(user_id, role)` the composite key would break existing production code that relies on `connect_balances.user_id` as a single primary key (e.g. `complete-onboarding` upsert, `connects-refund` single-row fetch, and `refund_connects_system_error`).
3. **Conclusion:**
   - The backlog item was misconceived as an instruction to alter legacy single-wallet tables.
   - The correct engineering approach is **Role Scope Unification**:
     - Normalize `buyer` -> `seeker` across all runtime layers.
     - Keep `user_connect_wallets` + `connect_wallet_ledger` as the canonical target.
     - Provide an additive, idempotent migration proposal with preflight, dual-system sync for refunds, and non-destructive backfill.

---

## 3. Role Normalization and Backfill Contract

### A. Buyer vs. Seeker Normalization Contract
- **Contract Rule:** In the UI persona layer, the role is `buyer`. In the internal Connects economy and monthly allowance ledger, the canonical role key is `seeker`.
- **Implementation:**
  - Exported `normalizeConnectRole(role)` in `src/lib/connectsWallet.js`:
    ```javascript
    export function normalizeConnectRole(role) {
      const r = String(role || "seeker").trim().toLowerCase();
      if (r === "buyer") return "seeker";
      return r;
    }
    ```
  - Wired normalization into `getWallet`, `spendConnects`, `addPurchasedConnects`, `addEarnedConnects`, `initWalletIfEmpty`, and `spendConnectsServer`.
  - Wired normalization into `src/lib/entitlements.js` (`monthlyAllowance`, `canUseAnonymityShield`, and `anonymityShieldDefaultsOn`).
  - Added SQL normalization function `public.normalize_connect_role(p_role TEXT) RETURNS TEXT` in the migration proposal.

### B. Safe Backfill Contract
- When migrating legacy `connect_balances` rows to `user_connect_wallets`:
  - Determine primary role from `user_profiles` (`primary_mode` -> `role` -> default `'seeker'`).
  - Map `granted_balance` to current month `to_char(now(), 'YYYY-MM')`.
  - Map `purchased_balance` and `earned_balance` (as `reward_balance`) to the primary role wallet.
  - **Invariant:** Do not duplicate purchased or reward balances across multiple roles.
  - **Idempotency:** Use `ON CONFLICT (user_id, role) DO NOTHING`.

---

## 4. Migration Proposal Details

Created additive, idempotent migration proposal at:
`supabase/migrations/20260814000002_connect_wallets_role_scope_unification.sql`

### Structure & Key Safeguards:
1. **Clear Header:** Marked explicitly as `PROPOSAL ONLY — NOT APPLIED TO LIVE DATABASE`.
2. **Preflight Instructions:** Read-only SQL queries to inspect existing tables, count unmigrated balances, and check for duplicate user/role pairs.
3. **Rollback Instructions:** Clear instructions to revert helper functions without dropping data tables.
4. **Idempotent Tables:** `user_connect_wallets` and `connect_wallet_ledger` created with `IF NOT EXISTS` and RLS policies (`auth.uid() = user_id`).
5. **Role Normalization & Allowance Helpers:** `normalize_connect_role` and `get_role_connect_allowance`.
6. **Thread-Safe Spend RPC:** `spend_connects_atomic` with `pg_advisory_xact_lock` and strict 3-bucket priority.
7. **Dual-Sync Refund RPC:** `refund_connects_system_error` updates `user_connect_wallets` + `connect_wallet_ledger`, while maintaining backward-compatible sync with `connect_balances` + `connect_transactions` if they exist.
8. **Idempotent Backfill Procedure:** `backfill_legacy_connect_balances()` safely backfills legacy rows without balance duplication.
9. **Strict Security:** Revokes execution from `anon`/`authenticated` and grants only to `service_role`.

---

## 5. Verification Evidence

| Check / Command | Exit Code | Result | Meaningful Evidence |
|---|---|---|---|
| Focused Vitest: `npx.cmd vitest run src/lib/__tests__/connectsRoleNormalization.test.js src/lib/__tests__/connectsWallet.test.js` | `0` | PASS | 2 test files passed, 26/26 tests passed (1.46s). |
| Scoped ESLint: `npx.cmd eslint src/lib/connectsWallet.js src/lib/entitlements.js src/lib/__tests__/connectsRoleNormalization.test.js` | `0` | PASS | 0 errors, 0 warnings across all modified and new JS files. |
| Full Unit Suite Baseline | `0` | PASS | 101 test files passed, 1074/1074 tests passed (44.40s). |
| Migration Proposal Static Validation | `0` | PASS | Validated preflight, rollback, idempotency, role normalization, and dual-sync sections via automated test suite. |

---

## 6. Acceptance Criteria Evaluation

- [x] **Every legacy and canonical Connect table, RPC, and caller is mapped with evidence:** PASS. Complete inventory documented in §1.
- [x] **The conclusion is explicit (stale item, documentation-only correction, or migration required):** PASS. Conclusion documented in §2; backlog item reconciled in Master Action Plan.
- [x] **Any proposal is additive, idempotent, history-preserving, and includes preflight/backfill/rollback notes:** PASS. Prepared in `supabase/migrations/20260814000002_connect_wallets_role_scope_unification.sql`.
- [x] **Focused tests prove the selected role-normalization contract without live mutation:** PASS. Verified via `src/lib/__tests__/connectsRoleNormalization.test.js`.
- [x] **The relevant Master Action Plan item is reconciled only if supported by evidence:** PASS. Section 1.0D in `00_MASTER_ACTION_PLAN.md` reconciled.
- [x] **No live/external or unrelated change occurs:** PASS. Zero live database mutations or external service modifications.

---

## 7. Operational Confirmation

- **Live database migration applied:** No (Proposal only)
- **Production data mutated:** No
- **Credentials accessed or modified:** No
- **Git commit / push / deployment performed:** No
- **External provider or settings changed:** No
