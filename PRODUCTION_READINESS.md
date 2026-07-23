# ScoutIt — Production Readiness (Road to Human Testing)

_Last updated: 2026-07-23. Owner: Jerzel. Maintained by working sessions with Claude._

## ✅ 2026-07-23 — Master-brief execution session (see CLAUDE_CODE_MASTER_BRIEF.md)

**Mission Control (deployed live at mission-control-sigma-one-89.vercel.app):**
- A3 publishing loop closed: "Approve & Publish to live site" now syncs Airtable
  (`Approved_For_ScoutIt`) first, reads back the computed Slug, then marks approved. Airtable
  failure = not approved.
- B1 malware pipeline built + E2E-verified live: private `quarantine`/`property-videos-temp`/
  `chat_attachments` buckets + `file_scans`/`video_upload_queue` tables (additive migration);
  magic-byte scan engine (+ optional VirusTotal via `VIRUSTOTAL_API_KEY`); staff File Security
  panel; tamper-checked 5-min signed-URL downloads; CRON-protected worker route.
- A7 Phase 1 Security Center: flagged/high-velocity masked IPs + block/unblock ban list (audited).
- A5 instant navigation: client sidebar active-state, catch-all loading skeleton + error
  boundaries, gold token system. A6: real recharts metrics + Daily/Weekly/Monthly toggle.
- A2: Google sign-in button (needs the provider toggled on in Supabase) + Staff IAM
  "grant access to an existing account by email". Fixed a latent `updated_at` bug in staff actions.
- DB: `log_masked_access` RPC (service-role-locked) + `global_read_only` kill-switch flag seeded
  (off); `touch_calendar_events_updated_at` search_path pinned.

**Main site — GATED batch BUILT & build-green, NOT pushed (awaiting founder go):**
- Middleware: masked-IP guard (privacy-preserving hashes, 403 for banned, fail-open) +
  fail-CLOSED rate limiting on auth/upload/AI routes + `global_read_only` kill switch +
  `ai_search`/`deep_intel` gates that honor `pre_launch_free_mode` (no behavior change today).
- B2 magic-byte validation on /api/storage/upload and /api/ai/read-pdf; video uploads now
  register in the scan pipeline. `IP_SALT` set on both Vercel projects + local env.
- B3 ready-to-run: drop storage policy `"Allow public uploads"` (all photo-upload callers
  verified login-gated).

This doc tracks what has to be true before we let real humans test ScoutIt, written in plain
language first. Each item says **what it is**, **why it matters**, and **status**. Technical detail
is at the bottom so the top stays readable.

---

## The one-paragraph picture

ScoutIt is far along — this is a real, mature platform, not a prototype. The public site, the
dashboard, the CRM, the Connects wallet, and the staff console all exist and work. What's left
before human testing is mostly **safety and stability**: closing security holes so testers (or bad
actors watching testers) can't break or steal things, making sure a bad code change can't reach the
live site, and cleaning up a handful of known visible bugs. Think of it as "the house is built —
now we lock the doors and fix the wobbly steps before guests arrive."

---

## ✅ Done (this session, 2026-07-22)

### 1. Closed the "anyone can mess with the wallet" hole — DONE
**Plain version:** There's a hidden back door in the database that let *anybody on the internet*
change any user's Connects balance (your in-app currency / money layer) without logging in. We shut
it. Only your own server can touch it now.
**Why it mattered:** This is the single most dangerous thing we found. During testing, one curious
person could have drained or inflated balances.
**Status:** Fixed and verified live. Nothing broke — your server still works exactly as before.

### 2. Stopped scrapers from listing every uploaded photo — DONE
**Plain version:** Your property-photo storage was set up so an outsider could ask for a full list
of *every* file you've ever uploaded and copy them in bulk. We removed the "list everything"
ability. Normal photos on the site still load fine — you just can't enumerate the whole vault
anymore.
**Why it mattered:** This is exactly the "people scraping our data" threat you're worried about.
**Status:** Fixed and verified live.

---

## 🔴 Must fix before humans test

### 3. Turn on "leaked password protection"
**Plain version:** One switch in Supabase that blocks people from signing up with passwords already
known to hackers. Zero downside.
**Why:** Free, instant security win.
**Status:** TODO — it's a toggle, not code. Supabase Dashboard → Authentication → Policies →
enable "Leaked password protection."

### 4. The login system is fake-ish and needs to become real
**Plain version:** Right now the public site "remembers who you are" using a note saved in the
browser, not a real secure login. That means a technical person could *pretend to be someone else*
fairly easily. Some parts of the site trust that browser note.
**Why it matters:** Until this is real, some of our other locks can't fully work, and testers'
accounts aren't truly protected. This also blocks fixing item #5 below.
**Status:** TODO — this is a **project, not a quick patch**. Recommend scoping it as its own effort.
It's the biggest single thing standing between "demo" and "trustworthy product."

### 5. Anonymous file uploads (waiting on #4)
**Plain version:** Anyone can currently upload files to our photo storage without logging in — a
spam/abuse risk. We *didn't* fix this yet on purpose, because the fix depends on the real-login work
in #4. Fixing it now would break legitimate photo uploads.
**Why:** Locking it before real login exists would lock out real users too — the thing you asked me
to avoid.
**Status:** BLOCKED on #4. Do them together.

### 6. Nothing checks code before it goes live
**Plain version:** You have a good set of automated tests, but no robot that *runs* them before a
new version ships. So a broken change can reach the live site unnoticed.
**Why:** During testing you'll be changing things fast; this is your safety net.
**Status:** TODO — add a CI pipeline (GitHub Actions) that runs your tests + build on every push.
Low effort, high payoff.

### 7. Known visible bugs
**Plain version:** A few pages still show old wording or throw an error. Testers *will* notice these.
- `/discover` — a page error (the "useSearchParams / Suspense" one)
- `/wishlist` — still says "Personal Ledger" (old name)
- `/brokers` — old names in the body copy
- Homepage — the "Open Your Ledger" button uses old wording
**Status:** TODO — small, cosmetic, but do them before testers see them.

---

## 🟡 Should fix soon (not blockers)

- **Rate-limiting only runs in production and "fails open."** Your bot/scrape shield turns off if the
  Redis service hiccups. Fine for uptime, worth knowing. Consider a Cloudflare layer in front.
- **Database hygiene warnings:** PostGIS lives in the wrong schema, a couple of functions have a
  loose setting (`search_path`), and a PostGIS system table (`spatial_ref_sys`) shows a warning.
  These are low-risk and partly false alarms — clean up when convenient.
- **`deal_messages`, `property_units`, `subscriptions`** are locked to server-only access. That's
  safe, but confirm those features read through the server so nothing silently breaks in testing.

---

## Technical appendix (for engineers)

**Applied 2026-07-22 (two migrations, live project `yyixsuaimdzyiocswcgc`):**
- `harden_anon_rpc_exec_and_storage_listing` — dropped `storage.objects` policy `"Public Access"`
  (property_photos is a public bucket, so `getPublicUrl` is unaffected; only `.list()` enumeration
  is removed). App verified to never call `.list()` on this bucket.
- `lock_sensitive_functions_to_service_role` — `REVOKE EXECUTE ... FROM PUBLIC, anon, authenticated`
  then `GRANT EXECUTE ... TO service_role` on `spend_connects`, `increment_broker_profile_views`,
  `audit_record_changes`, `handle_new_auth_user`. Verified via `has_function_privilege`:
  anon=false, authenticated=false, service_role=true. All `spend_connects` call sites confirmed to
  use `supabaseAdmin` (service role), so no app breakage.

**Still open (from Supabase security advisors):**
- `auth_leaked_password_protection` — dashboard toggle.
- End-user auth is localStorage-based (`user_id` = text `usr-...`, not `auth.uid()`), so
  `supabase_rls_hardening.sql`'s `owner_id = auth.uid()` policies can't fully enforce on end-user
  tables. Re-architecture to real Supabase Auth sessions is the unblock.
- `storage.objects` policy `"Allow public uploads"` (anon INSERT to property_photos) — remove only
  after real auth exists, otherwise client uploads break.
- `st_estimatedextent` SECURITY DEFINER warnings — PostGIS-internal, accepted/low-risk.
- `function_search_path_mutable`, `extension_in_public` (postgis) — hygiene.

**CI:** only `.github/dependabot.yml` exists. Add a workflow running `npm run lint`, `npm test`
(Vitest), `next build`, and optionally the Playwright suite in `e2e_tests/`.
