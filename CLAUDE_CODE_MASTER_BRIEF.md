# ScoutIt — Master Brief for Claude Code (everything)

**This is the single source of truth for Claude Code.** It supersedes `MMC_CLAUDE_CODE_BRIEF.md` and
all `HANDOFF_PROMPT_*.md`. Full detail for the big items lives in `MMC_GAP_ANALYSIS.md` and
`PRODUCTION_SECURITY_AUDIT.md` (read them when a task points there). Work by priority; each task is
actionable and self-contained.

---

## The two codebases
- **Main public site** — repo root, `./src/` (Next.js 15 App Router, deployed to
  `scout-it.vercel.app`).
- **Master Mission Control** — `./mission-control/` (SEPARATE Next.js 15 app, staff console, deployed
  to `mission-control-sigma-one-89.vercel.app`).
Both use the LIVE Supabase project `yyixsuaimdzyiocswcgc`. MMC also talks to Airtable (public CMS).

## Standing rules (never break)
- **No `git add/commit/push` in the mission-control repo without the founder's explicit go-ahead.**
- `SUPABASE_SERVICE_ROLE_KEY` / admin client stay server-only, never in a client bundle.
- **Anything touching the LIVE PUBLIC SITE (`./src/`) or live traffic is GATED** — show the diff and
  wait for explicit go-ahead before applying.
- Dual-CMS rule: Airtable = public content; Supabase = private state. A published property's `Slug`
  is an Airtable formula field — read it back, never write it.
- Never pass a plain function from a Server Component to a Client Component (past crash). Pattern:
  `mission-control/src/components/dashboard/BulkSelectManager.js`.
- ScoutIt DNA: 95% black (#0d0d0d/#121212), gold #E8AE3C / hover #F7C64E / muted #6E531A; mono
  UPPERCASE small labels; dense, dark-luxury.
- Read `node_modules/next/dist/docs/` before writing Next code.

## Run + verify
- MMC: `npm --prefix mission-control run dev -- --port 3001` → localhost:3001. Founder is Tier 3
  (`jerzelguerra26@gmail.com`).
- Main site: its own dev per repo README.
- After each task: verify affected routes load with no console/server errors; report files changed.

## Preserve — do NOT revert (built this session)
MMC: Overview (live data), Feature Flags (uses **`feature_flags`**, not `feature_gates`),
Notifications (`private_notifications`), Concierge Ingest (`dashboard/media` + `lib/ingestSchema.js`).
Live DB already has: `admin_users` (tier-based), `mission_control_actions`, `feature_flags` (7
seeded), `blocked_access`, `private_notifications`, `security_access_logs` (empty, for the IP guard).
No `loading.js`/`error.js` yet; MMC `globals.css` still has default tokens (add the gold system).

---

# TRACK A — Master Mission Control

**A1 · Run locally + verify/debug navigation.** Confirm sidebar links navigate; fix any hydration
console errors; confirm the Overview top stat cards are non-interactive by design (not a bug).

**A2 · Access model (Vercel gate + magic-link + Google — code parts).** Login page `src/app/page.js`:
offer "Sign in with Google" (`signInWithOAuth`) AND the existing magic-link (`signInWithOtp`); ensure
`src/lib/supabase.js` uses `@supabase/ssr` `createBrowserClient` so the session persists for SSR.
Staff IAM: add Super-Admin "grant staff access by email" (look up auth user → insert `admin_users`
row + `logAction`). Do NOT build email+password (superseded). Founder handles the Vercel gate +
Supabase Google provider in the dashboard.

**A3 · Close the publishing loop (THE core gap) 🔴.** Today `dashboard/cms` only approves the Supabase
`properties` row, which does NOT publish to the live site — the live gate is Airtable
`Approved_For_ScoutIt` on `PROPERTIES_CMS`. Extend `dashboard/cms/actions.js` `approveProperty` to
also sync to Airtable and set `Approved_For_ScoutIt = true` (reuse `src/lib/airtable.js` /
`/api/dashboard/publish` pattern from the main app), read the computed `Slug` back, save it to
Supabase. Add an explicit "Approve & Publish to live site" button. On Airtable failure, do NOT mark
approved. Completes Concierge Ingest end-to-end. Detail: `MMC_GAP_ANALYSIS.md` #1.

**A4 · Make feature flags affect the public site (GATED — `./src/`).** Add a cached server-side reader
of `feature_flags` (public-readable) in the main app and gate real features (`ai_search`,
`deep_intel`) + honor `pre_launch_free_mode`. Also wire a `global_read_only` flag the site honors to
freeze writes instantly (kill switch). Show the diff first.

**A5 · Visual redesign + instant navigation.** Add `loading.js` skeletons + `error.js` boundaries per
route; extract the sidebar to a `"use client"` component using `usePathname()` for instant
active-state (layout stays a Server Component doing tier gating); wrap slow data in `<Suspense>`;
define the gold token system in `globals.css` and refactor off scattered hex. Keep all Server Action
forms working — restyle, don't remove.

**A6 · Metrics redesign.** Replace the CSS bars in `dashboard/metrics` with real bar charts (add
`recharts`; fall back to Chart.js/SVG) + a Daily/Weekly/Monthly toggle (properties created, connects
volume, staff actions per period + status/role breakdowns). Add `loading.js`/`error.js`; keep the
5,000-row cap and Ops-Manager (2)+ gate.

**A7 · Security Center / Masked IP Anomaly Guard.** Table `security_access_logs` exists; bans in
`blocked_access` (type='ip'). **Phase 1 (safe):** `dashboard/security/` page (Ops Manager 2+) — HUD of
flagged/high-velocity masked IPs + blocked entries; `blockHash`/`unblockHash` actions (reason +
`logAction`); add "Security" to the sidebar; `loading.js`/`error.js`. **Phase 2 (GATED — `./src/
middleware.js`):** hash IP (`'ip_anon_'+sha256(ip+IP_SALT)`), upsert-increment `security_access_logs`
per (masked_ip, route), flag > ~120/min, 403 any masked_ip in `blocked_access`; add `IP_SALT` env;
fail-open on error; never log raw IPs. Show diff first.

---

# TRACK B — Production & Cybersecurity Hardening
Full detail + rationale: `PRODUCTION_SECURITY_AUDIT.md`.

**B1 · Upload malware "double security" pipeline (priority) 🔴.** Two independent gates + isolation:
- **Stage 0 — Quarantine:** user uploads land in a PRIVATE `quarantine` bucket, DB row
  `scan_status='pending_scan'`; no signed URL yet; not visible to staff.
- **Stage 1 — Pre-admin scan (automated):** (a) verify real file type by magic bytes (reject on
  mismatch); (b) antivirus scan (VirusTotal API by hash then upload, or a ClamAV service); (c)
  sanitize (flatten PDFs to strip active content; re-encode images); (d) AI legitimacy check (is it a
  real property doc). Write verdict `clean|suspicious|infected`; only `clean` advances. Run as a
  Supabase Edge Function or API route/queue worker.
- **Stage 2 — Mission Control:** only `clean` files appear in Concierge Ingest/Media, with a "scanned
  clean by <engine> at <time>" badge; suspicious/infected shown as quarantined, NOT downloadable,
  uploader flagged, verdict logged.
- **Stage 3 — Pre-download re-check:** on staff download, re-verify (re-confirm clean hash / quick
  re-scan), then issue a SHORT-LIVED signed URL (never a permanent public URL). Log the download.
- Add columns `scan_status, scan_verdict, scan_engine, scanned_at` to the upload/queue tables (or a
  `file_scans` table). (Cowork will create the `quarantine` bucket + columns — see Track C.)

**B2 · Magic-byte file-type validation** on all upload routes (`/api/storage/upload`,
`/api/ai/read-pdf`, `src/lib/storage.js`) — stop trusting the client-declared MIME.

**B3 · Restrict anonymous uploads (GATED).** Remove the `storage.objects` `"Allow public uploads"`
policy so only authenticated users can upload to `property_photos`; confirm the upload flow uses an
authenticated session first so legit uploads don't break.

**B4 · Rate-limiting robustness.** In `src/middleware.js`, fail-CLOSED on the most sensitive routes
(auth, upload, AI) if Redis is unavailable; document a Cloudflare/WAF layer as the front wall.

**B5 · Create + lock the missing buckets.** Only `property_photos` exists live; code references
`property-videos-temp` and `chat_attachments` (they error today). Create them PRIVATE, plus the new
`quarantine` bucket; serve via signed URLs, never public. Source portfolios/decks stay private
permanently.

**B6 · CSP tightening (later).** Move script-src off `'unsafe-inline'`/`'unsafe-eval'` toward nonces
where feasible.

---

# TRACK C — Handled outside Claude Code (dependencies, don't duplicate)
- **Founder (dashboard):** enable Supabase PITR backups; enable Leaked Password Protection; turn on
  the Vercel gate for Mission Control; enable Supabase Google provider; (near-launch) email provider
  / Google Sign-In.
- **Cowork (live DB, on request):** create the private `quarantine` bucket + scan-status columns;
  apply the `property_photos` upload-restriction policy alongside B3; any additive migration/seed;
  run security advisors.

---

## Recommended order
A1 → A3 (publish loop) → B1 (malware pipeline) → A7 Phase 1 (Security HUD) → A5 (redesign/instant nav)
→ A6 (metrics) → A2 (Google login) → A4/B3/A7-Phase2/B2/B4/B5 (gated public-site items, batched with
founder go-ahead). Report after each; flag anything needing a founder decision or dashboard step.
