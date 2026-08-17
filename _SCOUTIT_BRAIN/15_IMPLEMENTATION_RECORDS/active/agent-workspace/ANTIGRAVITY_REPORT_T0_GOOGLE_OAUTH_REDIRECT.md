---
section: "15_IMPLEMENTATION_RECORDS/active/agent-workspace"
status: active
date: 2026-08-14
type: devlog
report-state: ready-for-review
task-id: T0-1.0D-GOOGLE-OAUTH-REDIRECT-2026-08-14
tags: [devlog, agent-workspace, antigravity-report, google-calendar, oauth, redirect-uri]
updated: 2026-08-14
ai-first: true
related: ["[[TASK_T0_GOOGLE_OAUTH_REDIRECT]]", "[[00_MASTER_ACTION_PLAN]]", "[[MASTER_OWNER_ACTIONS]]"]
---

# Antigravity Report — Google OAuth Redirect Contract

## Task identity

- **Task ID:** `T0-1.0D-GOOGLE-OAUTH-REDIRECT-2026-08-14`
- **Starting state:** `ready-for-build`
- **Final state:** `ready-for-review`

## Preflight

- **Preflight command:** `git status --short`
- **Pre-existing working tree changes preserved:**
  - `_SCOUTIT_BRAIN/00_MASTER_SYNC.md` (unrelated sync updates)
  - `_SCOUTIT_BRAIN/15_IMPLEMENTATION_RECORDS/active/launch-readiness/MIGRATION_DRIFT_2026-08-12.md` (unrelated migration record)
  - `src/app/intel/page.js` (category authority cleanup from previous task)
  - `src/app/property/DirectoryClient.js` (category authority cleanup from previous task)
  - `src/lib/__tests__/categoryAuthority.test.js` (category authority regression tests from previous task)
  - `src/lib/__tests__/deviceTelemetryApi.test.js` (unrelated telemetry test refinement)
  - `supabase/migrations/20260803000001_production_security_rls.sql`
  - `supabase/migrations/20260811000001_wishlist_share_revocation.sql`
  - `supabase/migrations/20260811000002_pilot_cohort_registry.sql`
  - `supabase/migrations/README.md`

## Runtime inspection and changes made

1. **`src/lib/calendar/googleOAuth.js`**
   - Exported explicit canonical callback path constant `GOOGLE_OAUTH_CALLBACK_PATH = "/api/oauth/google/callback"`.
   - Wired `getRedirectUri()` to use `siteUrl(GOOGLE_OAUTH_CALLBACK_PATH)` canonical helper.
   - Verified that both consent URL generation (`buildConsentUrl`) and authorization code exchange (`exchangeCodeForTokens`) call `getRedirectUri()`, guaranteeing identical redirect URIs across both stages.

2. **`src/lib/__tests__/googleOAuthRedirect.test.js`**
   - Created focused Vitest regression test suite covering:
     - Exact canonical callback path: `/api/oauth/google/callback`.
     - Consent URL generation embeds the exact canonical `redirect_uri`.
     - Code token exchange POST body sends the identical `redirect_uri` (using clean mock `fetch` with no network calls or real secrets).
     - Source contract: verifies `src/app/api/oauth/google/callback/route.js` exists, `src/app/api/calendar/callback/route.js` does not exist, and no active OAuth handler references the obsolete `/api/calendar/callback` path.

3. **`_SCOUTIT_BRAIN/08_OPERATIONS_AND_BACKLOG/ACTION/00_MASTER_ACTION_PLAN.md`**
   - Surgically reconciled section 1.0D Google Calendar OAuth item: recorded local code contract audit completion, verified canonical route, and marked live Google Cloud Console credential authorization as owner-gated.

4. **`_SCOUTIT_BRAIN/08_OPERATIONS_AND_BACKLOG/ACTION/MASTER_OWNER_ACTIONS.md`**
   - Surgically replaced all stale `/api/calendar/callback` redirect URIs in Checkpoint 4 (step 6) and Section 1.8 with the canonical `/api/oauth/google/callback` URIs (`https://www.scoutit.space/api/oauth/google/callback`, `https://scoutit.space/api/oauth/google/callback`, `http://localhost:3000/api/oauth/google/callback`).
   - Preserved all owner-only action checkboxes.

## Verification evidence

| Check / Command | Exit Code | Result | Meaningful Evidence |
|---|---|---|---|
| Focused Vitest: `npm.cmd run test:unit -- src/lib/__tests__/googleOAuthRedirect.test.js` | `0` | PASS | 1 test file passed, 4/4 tests passed (10ms). |
| Scoped ESLint: `npx.cmd eslint src/lib/calendar/googleOAuth.js src/lib/__tests__/googleOAuthRedirect.test.js` | `0` | PASS | 0 errors, 0 warnings across all modified/new JS files. |
| Full Unit Suite: `npm.cmd run test:unit` | `0` | PASS | 101 test files passed, 1074/1074 tests passed (45.96s). |
| Source Scan: `Get-ChildItem -Path "_SCOUTIT_BRAIN","src" -Recurse -File \| Select-String "calendar/callback"` | `0` | PASS | Zero active references to `/api/calendar/callback`; only historical archived/report references exist. |
| Scoped `git diff --check` (`src/lib/calendar/googleOAuth.js`, `src/lib/__tests__/googleOAuthRedirect.test.js`, `00_MASTER_ACTION_PLAN.md`, `MASTER_OWNER_ACTIONS.md`) | `0` | PASS | Clean diff with zero whitespace/formatting issues. |
| Repository-wide `git diff --check` | `1` (Pre-existing) | REPORTED | Trailing blank lines in pre-existing unrelated files `supabase/migrations/20260811000001_wishlist_share_revocation.sql:18` and `20260811000002_pilot_cohort_registry.sql:69`. All task-scoped files are completely clean. |

## Acceptance criteria evaluation

- [x] **One canonical callback path exists in the contract: `/api/oauth/google/callback`:** PASS. Defined in code and verified by automated tests.
- [x] **Consent and token exchange send the identical canonical redirect URI:** PASS. Both call `getRedirectUri()`; tested via Vitest assertion and mock payload inspection.
- [x] **Focused automated tests exercise the real OAuth helper behavior without network calls or secrets:** PASS. `googleOAuthRedirect.test.js` uses mocked `fetch` and synthetic non-secret test environment variables.
- [x] **No active ScoutIt instruction tells the owner to authorize `/api/calendar/callback`:** PASS. All active instructions in `MASTER_OWNER_ACTIONS.md` and `00_MASTER_ACTION_PLAN.md` updated to `/api/oauth/google/callback`.
- [x] **The Master Action Plan distinguishes locally verified code from owner-only live configuration:** PASS. Section 1.0D records code audit complete while pointing to owner-only Google Console action in `MASTER_OWNER_ACTIONS.md`.
- [x] **Focused tests, scoped lint, full unit suite, and scoped diff checks pass:** PASS. All checks passed with clean exit code 0.
- [x] **No live/external or unrelated change occurs:** PASS. Bounded local execution only.

## Residual risks and limitations

- Live end-to-end Google OAuth handshake remains owner-gated, pending the owner adding the canonical redirect URIs in Google Cloud Console Credentials and verifying against live environment variables.

## Operational confirmation

- **Google Cloud Console modified:** No
- **Vercel environment variables modified:** No
- **Credentials accessed or modified:** No
- **Commit created:** No
- **Push performed:** No
- **Deployment performed:** No
- **Live database migration applied:** No
- **External service mutation performed:** No
