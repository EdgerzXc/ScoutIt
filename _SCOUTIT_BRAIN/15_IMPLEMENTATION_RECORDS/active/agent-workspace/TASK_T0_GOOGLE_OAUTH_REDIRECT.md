---
section: "15_IMPLEMENTATION_RECORDS/active/agent-workspace"
status: active
date: 2026-08-14
type: task
task-state: ready-for-build
task-id: T0-1.0D-GOOGLE-OAUTH-REDIRECT-2026-08-14
priority: "T0"
tags: [task, antigravity, google-calendar, oauth, redirect-uri]
updated: 2026-08-14
ai-first: true
related: ["[[00_MASTER_ACTION_PLAN]]", "[[MASTER_OWNER_ACTIONS]]", "[[CODEX_REVIEW_T0_CATEGORY_AUTHORITY_ACCEPTED]]"]
---

# Antigravity Start - Google OAuth Redirect Contract

## For future Claude

This is the next authorized local implementation task. Runtime inspection on 2026-08-14 found a concrete mismatch: ScoutIt's implemented Google OAuth callback is `/api/oauth/google/callback`, but the Master Action Plan names obsolete Calendar routes and the owner checklist instructs Google Cloud Console to authorize `/api/calendar/callback`.

## Authority

- State: `ready-for-build`
- Local code, tests, and surgical documentation correction: authorized
- Google Cloud Console, Vercel, credentials, commit, push, deploy, or any live/external change: not authorized
- Workflow: inspect -> establish one redirect contract -> regression tests -> reconcile instructions -> verify -> report

## Required reading

1. Repository `AGENTS.md`
2. `_SCOUTIT_BRAIN/00_START_HERE.md`, `00_SOP.md`, and `00_MASTER_SYNC.md`
3. Master Action Plan section 1.0D Google Calendar item
4. `MASTER_OWNER_ACTIONS.md` current checkpoint and section 1.8
5. Canonical `STRUCTURE.md`, `DATA_DICTIONARY.md`, and `USER_FLOWS.md`
6. Relevant installed Next.js Route Handler documentation under `node_modules/next/dist/docs/`
7. All scoped source and existing tests found by search

Run `git status --short` before editing and preserve every unrelated change.

## Verified runtime facts to re-check

- `src/app/api/calendar/sync/route.js` performs event synchronization; it is not the OAuth callback.
- No `src/app/api/calendar/callback/route.js` exists.
- The real callback is `src/app/api/oauth/google/callback/route.js`.
- `src/lib/calendar/googleOAuth.js#getRedirectUri()` currently produces `${SITE_URL}/api/oauth/google/callback`.
- Both consent URL generation and token exchange use `getRedirectUri()`.
- `MASTER_OWNER_ACTIONS.md` currently lists the wrong `/api/calendar/callback` path in more than one place.

Stop and report if the current runtime materially differs.

## Outcome

Establish one tested OAuth redirect URI contract using the real callback route, and correct the owner instructions so Google Cloud receives the exact URI ScoutIt sends. Leave the external Google Console verification as an explicit owner action.

## Included work

- Inspect the start route, callback route, OAuth helper, canonical site URL helper, and relevant tests.
- Use the canonical `siteUrl()` helper for the redirect URI if it expresses the existing stable behavior without changing the selected production host.
- Ensure consent generation and code exchange use the identical redirect URI.
- Add focused Vitest coverage for:
  - the exact real callback path;
  - consent URL `redirect_uri`;
  - token exchange form `redirect_uri`;
  - the callback route/source contract when useful.
- Surgically reconcile the Master Action Plan item after verification: close the local code audit, name the actual route, and leave live Google Console proof owner-gated.
- Surgically replace every stale `/api/calendar/callback` URI in `MASTER_OWNER_ACTIONS.md` with `/api/oauth/google/callback`, preserving unrelated edits and the owner-only completion checkboxes.
- Create `ANTIGRAVITY_REPORT_T0_GOOGLE_OAUTH_REDIRECT.md` in this folder.

## Excluded work

- Adding a second callback alias merely to preserve stale documentation.
- Changing OAuth scopes, token encryption/storage, state signing, sync behavior, credentials, domains, or calendar UI.
- Opening Google Cloud Console, changing Vercel variables, deploying, or claiming the live handshake passed.
- Unrelated cleanup, commit, or push.

## Invariants

- OAuth redirect URIs require exact matching; code and owner instructions must name the same path.
- The production redirect host comes from ScoutIt's canonical site URL configuration, not arbitrary request origin or preview deployment hosts.
- Secrets and OAuth tokens must never enter tests, logs, chat, or documentation.
- The owner action remains open until Google Console configuration and a real handshake are verified by the owner.

## Acceptance criteria

- [ ] One canonical callback path exists in the contract: `/api/oauth/google/callback`.
- [ ] Consent and token exchange send the identical canonical redirect URI.
- [ ] Focused automated tests exercise the real OAuth helper behavior without network calls or secrets.
- [ ] No active ScoutIt instruction tells the owner to authorize `/api/calendar/callback`.
- [ ] The Master Action Plan distinguishes locally verified code from owner-only live configuration.
- [ ] Focused tests, scoped lint, full unit suite, and scoped diff checks pass.
- [ ] No live/external or unrelated change occurs.

## Verification

- Focused Vitest for the new/changed OAuth redirect test.
- Scoped ESLint for every changed JavaScript file.
- `npm.cmd run test:unit`.
- Source scan for stale `/api/calendar/callback` in active code and active owner/action documentation; historical archives may remain unchanged if clearly historical.
- Scoped `git diff --check` and final scoped diff review.
- Repository-wide `git diff --check`, reporting pre-existing unrelated findings separately.

## Report contract

Create `ANTIGRAVITY_REPORT_T0_GOOGLE_OAUTH_REDIRECT.md` with exact files, commands, results, acceptance checks, residual risks, and explicit confirmation that no Google Console/Vercel change, credential operation, commit, push, deploy, migration, or external mutation occurred.

## Stop conditions

Stop instead of guessing if the canonical production host is contradicted by runtime configuration, tests would require real credentials/network access, the doc edits cannot be isolated from unrelated work, or completion requires live Google Console access.

## Owner note

<!-- @user:start -->
The owner authorized bounded local continuation on 2026-08-14. External OAuth configuration remains owner-only.
<!-- @user:end -->
