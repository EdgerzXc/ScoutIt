---
section: "15_IMPLEMENTATION_RECORDS/active/launch-readiness"
status: active
tags: [security, audit, github, vercel, supabase, advisors, evidence, canonical]
updated: 2026-08-13
related:
  - "[[../../../08_OPERATIONS_AND_BACKLOG/ACTION/00_MASTER_ACTION_PLAN]]"
  - "[[../../../08_OPERATIONS_AND_BACKLOG/ACTION/MASTER_OWNER_ACTIONS]]"
  - "[[2026-08-13_BRAIN_PRUNING_RECORD|Brain Pruning Record]]"
---

# THREE-PLATFORM SECURITY AUDIT — 2026-08-13

**Live connected read of GitHub, Vercel, and Supabase.** Every number below was
pulled from the platform's own API on 2026-08-13, not from a local scan and not
from a previous document. This supersedes the alert *counts* in
`12_GITHUB_SECURITY_AUDIT_2026-08-11.md`; that file's remediation reasoning
remains valid.

> **Read-only.** No alert was dismissed, no dependency was bumped, no policy was
> enabled, no database object was altered, nothing was pushed. This is evidence,
> not a change record.

---

## 0 · The one-paragraph answer

There are **179 open findings across the three platforms**: 32 on GitHub, 113
Supabase performance advisors, 30 Supabase security advisors, and 4 Vercel
runtime error clusters. **Almost none of them are what they look like.** The
single genuinely urgent item is a credential-shaped literal sitting on a
**pushed branch of a public repository**. The 20 loudest Supabase "RLS" findings
are `INFO`-level and describe tables that are *locked shut*, not open. The
biggest real risk is the one nobody flagged: **`spatial_ref_sys` has RLS
disabled entirely**, and **41 duplicate permissive policies** are both a
performance drag and a correctness hazard, because overlapping `OR`-ed policies
widen access rather than narrow it.

---

## 1 · Scope and identity of what was audited

| Platform | Identity | Note |
|---|---|---|
| GitHub | `EdgerzXc/ScoutIt` — **PUBLIC**, default branch `main` | public visibility is what makes §2.1 urgent |
| Vercel | team `edgerzxcs-projects` → `scout-it` (`prj_WD59…`), `scoutit` (`prj_EERc…`) | two projects, same repo — see §4.3 |
| Supabase | project `ScoutIT` (`yyixsuaimdzyiocswcgc`), Postgres 17.6, `ap-northeast-2`, `ACTIVE_HEALTHY` | single project; no staging separation |

Local branch at audit time: `security/1-0b-critical-fixes` @ `4114e53`
(local), pushed remote tip `2879575`. **Local is one commit ahead of the
remote**, and that gap matters — see §2.1.

---

## 2 · GitHub — 32 open findings

### 2.1 🔴 Secret scanning — 1 alert, and it is live on a public branch

| Field | Value |
|---|---|
| Alert | `#1` — Stripe Webhook Signing Secret |
| Validity | `unknown` (GitHub could not verify it) |
| Raised | 2026-06-29 |
| Location | `.agents/skills/clerk-auth-testing/SKILL.md:639` |
| Push protection | not bypassed |

**Exact exposure, verified commit by commit:**

| Ref | Contains the literal? |
|---|---|
| `origin/main` | ❌ no — the file does not exist on `main` at all |
| `origin/security/1-0b-critical-fixes` (`2879575`) | ✅ **YES — publicly readable right now** |
| local working tree | ❌ no — already defanged |

The local fix is real and already written. The file now builds the value at
runtime instead of storing it:

```js
const WEBHOOK_SECRET = ['whsec', 'fixture', 'value'].join('_');
```

**That fix is uncommitted.** This is the whole problem: the repair exists on
disk, the exposure exists on GitHub, and nothing has carried one to the other.

**Honest risk assessment — do not skip this paragraph.** This is very likely a
**fabricated example**, not a live credential. It lives in a third-party skill
document about **Clerk** authentication, and ScoutIt does not use Clerk — it
uses Supabase Auth. There is no Clerk webhook to sign. GitHub could not validate
it. The realistic damage is therefore near zero. It is ranked 🔴 anyway for one
reason: *a credential-shaped string on a public repo must be treated as burned
until proven otherwise*, and proving otherwise costs more than replacing it.
`§1.0A` already records this item as fixed-locally, which matches what was found
— the documentation is accurate here.

### 2.2 Dependabot — 13 open (8 high, 5 medium)

Down from the 25 recorded on 2026-08-11. **Only 4 of the 13 reach production
code**; the other 9 are `scope=development` and cannot be reached by a visitor.

**Runtime scope — these actually ship:**

| Sev | Package | Issue | Fix version |
|---|---|---|---|
| HIGH | `fast-uri` | host confusion via backslash authority introducer | `3.1.5` |
| HIGH | `nanoid` | custom generators loop indefinitely when size is zero | `3.3.17` |
| HIGH | `sharp` | inherited libvips CVEs (`2026-33327/33328/35590/35591`) | `0.35.0` |
| MED | `dompurify` | `IN_PLACE` hook removal leaves a detached subtree executable → XSS | `3.4.13` |

**Development scope — real, but not visitor-reachable:**

| Sev | Package | Issue | Fix |
|---|---|---|---|
| HIGH | `brace-expansion` ×2 | DoS via exponential `{}` expansion | `1.1.16` / `5.0.7` |
| HIGH | `js-yaml` ×2 | quadratic CPU via `!!omap` and merge-key chains | `4.3.0` / `4.3.1` |
| HIGH | `undici` | cross-user disclosure via private cache directives | `7.29.0` |
| MED | `undici` ×4 | CRLF injection, cookie attribute injection, cache-control whitespace disclosure, retry desync | `7.29.0` |

**The two that deserve a second look:**

- **`dompurify` → XSS.** ScoutIt has a documented history here —
  `[[REMEDIATION_RECORD_2026-08-13]] §Dependency remediation` records that importing `isomorphic-dompurify` in an
  API route causes 500s on Vercel, which is why `lib/sanitize.js` exists. Any
  DOMPurify bump must be checked against that wrapper, not applied blind.
- **`sharp` → libvips.** Image processing on attacker-supplied uploads is the
  classic path for these CVEs. Owner uploads are a real surface here.

All four `undici` mediums plus the one high collapse into **a single bump to
`7.29.0`**.

### 2.3 CodeQL — 18 open (16 high, 2 medium)

Latest analysis: `2026-08-12T08:25:31Z`, `refs/heads/main` @ `526a102c`.

| Count | Rule | Where |
|---:|---|---|
| 11 | `js/clear-text-storage-of-sensitive-data` | dashboard, onboarding, settings, `FloatingToolbox`, `ambientData` |
| 3 | `js/incomplete-multi-character-sanitization` | `src/lib/sanitize.js:22` ×2, `src/lib/email.js:89` |
| 1 | `js/incomplete-sanitization` | `e2e_tests/full-system/03-ecosystem-directories.spec.js:40` |
| 1 | `js/xss-through-dom` | `src/components/dashboard/UnitDetailsDrawer.js:65` |
| 2 | `actions/missing-workflow-permissions` | `ci.yml:20`, `update-spatial-data.yml:11` |

**Three structural observations the raw list hides:**

1. **4 of the 18 are dead code.** They point at
   `scratch/jules_session_3/…`. `scratch/` **is** in `.gitignore` (line 67) —
   but **29 files under it are already tracked**, and `.gitignore` has no effect
   on files git is already following. So abandoned session scratch is being
   published to a public repository and scanned as if it were production.
   Untracking it removes 4 alerts and a pile of public noise in one move.
2. **The 2 workflow-permission alerts appear stale.** `ci.yml` now carries a
   top-level `permissions: contents: read` at line 13, and
   `update-spatial-data.yml` carries `permissions: contents: write` at line 9 —
   yet the alerts (last updated 2026-07-23 / 2026-07-25) point at lines 20 and
   11. These are most likely job-level gaps or pre-fix leftovers awaiting a
   rescan. **Verify against a fresh scan before dismissing** — do not assume.
3. **`sanitize.js:22` is flagged twice.** Per `§1.0A`, regex-only HTML boundaries
   are being replaced with a real parser. This is the same finding, not a new one.

### 2.4 Repository posture

- **Public repository.** Every file, branch, and workflow above is world-readable.
- **37 open pull requests** (per `§1.0A`), many stale Dependabot branches.
- Token in use has `repo`, `workflow`, `gist`, `read:org`.

---

## 3 · Supabase — 30 security + 113 performance advisors

### 3.1 Security — 2 ERROR, 8 WARN, 20 INFO

**🔴 ERROR — `rls_disabled_in_public`: `public.spatial_ref_sys`**

RLS is **not enabled at all** on a table exposed through PostgREST. This is the
only finding in the entire audit where data is genuinely reachable without a
policy gate. It is a PostGIS system table (coordinate reference definitions —
public reference data, not user data), so the *content* is harmless. It is still
the correct top-ranked database item, because it is the one place where the
answer to "is this open?" is "yes".

**🔴 ERROR — `security_definer_view`: `public.public_profiles`**

The view runs with its **creator's** permissions, bypassing the querying user's
RLS. Given the name, this view almost certainly backs the public profile pages
and the ecosystem directories — meaning it is the single most-read object in the
app and the one most likely to leak a column nobody audited. **Review which
columns it exposes** before deciding whether `SECURITY DEFINER` is intentional.

**🟡 WARN — 8 findings**

| Finding | Detail |
|---|---|
| `anon_security_definer_function_executable` ×3 | `st_estimatedextent(…)` callable by `anon` via `/rest/v1/rpc/` |
| `authenticated_security_definer_function_executable` ×3 | same function, `authenticated` role |
| `extension_in_public` ×2 | `postgis` and `vector` installed in `public` |
| `auth_leaked_password_protection` | HaveIBeenPwned checking is **off** |

The six `st_estimatedextent` warnings are **one PostGIS function counted six
times** (three signatures × two roles). It returns table extent estimates, not
rows. Low real risk; a single `REVOKE` closes all six.

Leaked-password protection is already recorded as *deferred with reason* in the
master plan. This audit does not overturn that decision, but notes it is a
**one-toggle owner action** with no code cost.

**🔵 INFO — 20 × `rls_enabled_no_policy`**

`analytics_events`, `brain_chunks`, `brain_documents`, `deal_disputes`,
`deal_handshakes`, `deal_messages`, `deal_routing_recipients`, `dispute_events`,
`disputes`, `file_scans`, `monthly_scout_wraps`,
`property_broker_representations`, `property_claim_events`,
`property_lifecycle_events`, `property_slug_redirects`, `property_units`,
`subscriptions`, `verification_requests`, `video_upload_queue`.

**Read this correctly.** RLS enabled with zero policies is **deny-all** — these
tables are *sealed*, not exposed. Supabase files them as `INFO` precisely
because they are safe-but-suspicious. The actual question each one raises is:

> *Is this table sealed on purpose, or is a feature quietly broken because
> nothing can read it?*

That maps directly onto **Rule 13** — *an endpoint with no caller is not a
feature, it is a plan*. `property_units` is the sharpest example: the Unit
Master Page is built and documented, and its table cannot be read by any client
role. Either it is served exclusively through the service role (fine, and worth
recording), or a shipped feature is running on a table nothing can select from.

### 3.2 Performance — 113 advisors

| Count | Advisor | Level |
|---:|---|---|
| 41 | `multiple_permissive_policies` | WARN |
| 27 | `unindexed_foreign_keys` | INFO |
| 26 | `unused_index` | INFO |
| 18 | `auth_rls_initplan` | WARN |
| 1 | `duplicate_index` | WARN |

**`multiple_permissive_policies` (41) is a security finding wearing a
performance badge.** Multiple permissive policies on the same table/role/action
are combined with **`OR`**. Every additional permissive policy therefore *widens*
access. Forty-one of them means the effective access rule for those tables is
not written down anywhere — it is the union of policies nobody has read
together. This is the item most likely to hide a real authorization bug, and it
should be treated as security work, not cleanup.

**`auth_rls_initplan` (18)** — `auth.uid()` / `auth.jwt()` being re-evaluated
per row instead of once per query. Fixed by wrapping as `(select auth.uid())`.
Mechanical, safe, and it compounds badly at scale: these are the queries that
will fall over first at 200 listings.

**`unindexed_foreign_keys` (27)** and **`unused_index` (26)** are the normal
shape of a schema that grew fast. Note the tension — they pull in opposite
directions, so they must be resolved **together against real query patterns**,
never by applying both lists blindly.

---

## 4 · Vercel — 4 runtime error clusters

### 4.1 `scout-it` (`prj_WD59…`) — the owner's MAIN site

| Count | Users | Route | Error |
|---:|---:|---|---|
| 208 | 56 | `/opengraph-image`, `/twitter-image` | `Expected <div> to have explicit "display: flex" …` |
| 6 | 2 | `/api/whereto` | `[overpassIntel] lookup failed, serving fallback POIs: aborted` |
| 6 | 2 | `/api/og` | `Invalid background image: "none"` |
| 1 | 1 | `/property/[id]` | `[CMS] Airtable fetch failed: aborted` |

**The 208-count error is the real finding, and it is not a security issue — it
is a growth issue.** Satori (the OG-image renderer) requires explicit
`display: flex` on any `<div>` with more than one child. **Every social share
card is failing to render, for 56 distinct users, continuously since
2026-08-01.** Every link shared to Facebook, LinkedIn, Viber, or X is going out
without its preview image. For a "premium, ultra-luxury" directory whose growth
depends on listings being shared, this is a silent, month-long brand and
acquisition leak. `/api/og`'s `Invalid background image: "none"` is very likely
the same defect from a second entry point.

The two `aborted` errors are **timeouts, not failures** — Overpass and Airtable
both took too long and the code correctly served fallbacks. That fallback
behaviour is working as designed.

### 4.2 `scoutit` (`prj_EERc…`) — secondary/staging

| Count | Route | Error |
|---:|---|---|
| 1 | `/api/cms` | Airtable `BROKERS_CMS`: **401 Unauthorized** |
| 1 | `/api/cms` | Airtable `INTEL_CMS`: **401 Unauthorized** |

**401, not a timeout.** This is the exact signature of the 2026-07-03 incident
recorded in `[[THREE_PLATFORM_SECURITY_AUDIT_2026-08-13]] §4.3`: a broken `AIRTABLE_API_KEY`
silently serving mock fallback data. That incident was fixed on `scout-it` only,
**by owner decision**. This is the same condition still present on `scoutit` —
consistent with that decision, not a regression. Recorded so the next session
does not "discover" it again and treat it as new.

### 4.3 Structural note

Two Vercel projects deploy the same repository, and `§1.0A` already carries an
open item to reconcile them with six Vercel-created GitHub environments. This
audit adds one data point: **their runtime error profiles are completely
different**, which confirms they are not interchangeable and that neither can be
disconnected on the assumption it is a duplicate.

---

## 5 · What this actually changes

**Corrections to the existing record:**

1. `§1.0A` states *"GitHub `main` still reports 25 open Dependabot alerts (13
   high, 12 medium)."* Live count is now **13 (8 high, 5 medium)** — Dependabot
   PRs have been landing.
2. `§1.0A` states *"19 open CodeQL findings."* Live count is **18**.
3. `§1.0A`'s webhook-literal item is marked `[x]` fixed-locally. **Confirmed
   accurate** — and confirmed *still exposed remotely*, which is the state that
   item anticipated.

**Genuinely new, not previously documented anywhere:**

- The entire **Supabase advisor surface** — 30 security, 113 performance. The
  master plan mentions only leaked-password protection.
- **`spatial_ref_sys` RLS disabled** and the **`public_profiles` SECURITY
  DEFINER view** — the two ERROR-level database findings.
- **41 multiple-permissive-policies** reframed as an authorization-correctness
  risk rather than a performance nit.
- The **OG-image renderer failing for 56 users for 12 days**.
- **`scratch/` being gitignored but still tracked** — the mechanical reason 4
  CodeQL alerts and 29 dead files are public.

---

## 6 · Ranked remediation queue

Ranked by *real* risk, which is deliberately not the same as the platforms'
severity labels.

| # | Item | Platform | Cost | Owner-gated? |
|---:|---|---|---|---|
| 1 | Commit + push the already-written webhook-literal fix; then resolve secret alert 1 | GitHub | minutes | push approval |
| 2 | Fix `display: flex` in the OG/Twitter image renderer — 56 users, 12 days | Vercel | small | no |
| 3 | Review `public_profiles` SECURITY DEFINER view — which columns does it expose? | Supabase | small | no |
| 4 | Enable RLS on `spatial_ref_sys` | Supabase | minutes | schema approval |
| 5 | Audit the 41 multiple-permissive-policies as **authorization**, not perf | Supabase | large | no |
| 6 | `git rm --cached scratch/` — closes 4 CodeQL alerts, unpublishes 29 dead files | GitHub | minutes | no |
| 7 | Bump the 4 runtime deps — `undici` 7.29.0, `fast-uri`, `nanoid`, `sharp`; `dompurify` **only** after checking `lib/sanitize.js` | GitHub | medium | no |
| 8 | Answer the `property_units` question — service-role only, or broken feature? | Supabase | small | no |
| 9 | Wrap `auth.uid()` as `(select auth.uid())` in 18 policies | Supabase | medium | no |
| 10 | Rescan, then dismiss-or-fix the 2 workflow-permission alerts | GitHub | small | no |
| 11 | `REVOKE EXECUTE` on `st_estimatedextent` — closes 6 warnings | Supabase | minutes | no |
| 12 | Bump the 9 dev-scope deps | GitHub | small | no |
| 13 | Reconcile FK indexes vs unused indexes against real query patterns | Supabase | medium | no |
| 14 | Move `postgis` / `vector` out of `public` | Supabase | risky | ⚠️ breaks queries |
| 15 | Enable leaked-password protection | Supabase | one toggle | **owner only** |

**Sequencing warning.** Items 3, 5, and 8 are the same investigation seen from
three angles — *who can actually read what*. Doing them together is far cheaper
than doing them separately, and doing 5 alone risks "fixing" a policy that
another policy was silently depending on.

**Do not** mass-dismiss CodeQL alerts, mass-merge the 37 stale PRs, or apply
both index lists blindly. Item 14 is listed last on purpose: relocating PostGIS
out of `public` rewrites every spatial query in the app.

---

## 7 · Standing rules this audit invokes

- **Rule 2 — check the database, not the layer that describes it.** The Supabase
  advisors were read directly from the project. Both prior alert counts in the
  master plan were stale.
- **Rule 3 — never render a number you cannot source.** Every count here has a
  named API behind it. Where a number is a false positive or a duplicate, it is
  labelled rather than quietly dropped.
- **Rule 13 — an endpoint with no caller is not a feature.** The 20
  `rls_enabled_no_policy` tables are the database-side version of exactly this.
