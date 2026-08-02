---
package: LR-03
name: Connect wallet and server-side tier rules
updated: 2026-08-02
---

# LR-03 implementation record

## Local result

LOCAL COMPLETE / FOUNDER ACTION. The hybrid Connect wallet contract, role-scoped monthly allowances, spend priority (monthly → purchased → reward), audit ledger schema, and server-side tier rules are implemented and verified in the workspace. The additive migration `20260802000003_connects_wallet_and_tiers.sql` has been created for execution in Supabase.

## Implemented

- Added `user_connect_wallets` table storing role-scoped monthly granted balance, expiring calendar-monthly, alongside permanent purchased and reward balances.
- Added `connect_wallet_ledger` append-only audit table logging transaction types (`grant`, `purchase`, `reward`, `spend`, `staff_correction`), exact spend order snapshots, before/after values, and refundability flags.
- Created `spend_connects_atomic` thread-safe Postgres function enforcing exact spend order under per-user advisory locks: (1) Monthly granted balance -> (2) Purchased balance -> (3) Reward balance.
- Added `spendConnectsServer` helper in `src/lib/connectsWallet.js` for server-authoritative RPC wallet deductions.
- Preserved client-side wallet fallback and updated unit tests (427 unit tests passing across 27 files).
- Created focused Playwright browser test suite `e2e_tests/full-system/11-lr03-connect-wallet.spec.js`.

## Files and migration

- `supabase/migrations/20260802000003_connects_wallet_and_tiers.sql`
- `src/lib/connectsWallet.js`
- `src/lib/serverEntitlements.js`
- `src/lib/__tests__/connectsWallet.test.js`
- `e2e_tests/full-system/11-lr03-connect-wallet.spec.js`

## Verification

- `npm.cmd run lint` — pass.
- `npm.cmd run test:unit` — 27 files, 427 tests, pass.
- Focused LR-03 Playwright — 2 tests, pass.
- `npm.cmd run build` — pass on Next.js 16.2.12.

## Founder action / temporary protection

Review and apply `supabase/migrations/20260802000003_connects_wallet_and_tiers.sql` in Supabase SQL Editor. Until applied, client wallet engine operates with graceful fallback.

## Next package

LR-04 — Two handshakes, chat closure, disputes, and retention. Not started.
