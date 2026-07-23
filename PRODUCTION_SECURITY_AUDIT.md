# ScoutIt — Production & Cybersecurity Readiness Audit

_Read-only audit of the live code + Supabase config. 2026-07-23. Verdict: solid foundation, a short
list of real gaps — the most important being no malware scanning on user uploads._

---

## Executive summary
ScoutIt is further along on security than most pre-launch products: you have a full security-header
suite, real server-side auth on uploads, RLS enforced across tables, edge caching, and error
monitoring. The launch-blocking gaps are focused: (1) **no malware/content scanning on the files
users upload** — the thing you flagged; (2) file-type checks trust the client's word (spoofable);
(3) rate limiting has holes; (4) backups + a few security toggles are unconfirmed. None require a
re-architecture. Below: what's solid, the ranked gaps, the "double security" upload pipeline design,
and an attack-response plan.

---

## ✅ What's already SOLID (don't touch)
- **Security headers / CSP** (`next.config.mjs`): a locked CSP (`object-src 'none'`,
  `frame-ancestors 'none'`, `base-uri 'self'`, `form-action 'self'`, `upgrade-insecure-requests`),
  `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, Referrer-Policy, Permissions-Policy.
  Strong — most apps lack this.
- **Upload routes authenticate** (`/api/storage/upload`, `/api/ai/read-pdf`): verify the JWT, require
  `owner_id === user.id`, block path traversal, enforce size caps and an extension+MIME allowlist.
- **Database:** RLS enabled on all real tables; sensitive `SECURITY DEFINER` functions locked to
  service-role (fixed this project); the public bucket's file-listing removed (anti-scraping).
- **Caching:** ISR (60s) + Upstash Redis + `cmsCache` on `/api/cms` — pages serve from Vercel's edge.
- **Monitoring:** Sentry wired. **Bot check:** Cloudflare Turnstile present. **Secrets:** `.env*`
  is git-ignored (not committed).

---

## 🔴🟠 GAPS — ranked

### 🔴 1. No malware / content scanning on uploads (your concern — real)
Uploads (PDF portfolios, videos, images) are checked for size, extension, and declared MIME — but
that is **not** malware scanning. A valid `.pdf` can carry embedded JavaScript/exploits; a valid
`.mp4` can be a malformed-codec exploit; "polyglot" files pass naive type checks. Today a malicious
file would sit in storage and could be **downloaded by staff** in Mission Control with no scan
between the uploader and you. → Full pipeline design in the next section.

### 🔴 2. File-type validation trusts the client-declared MIME (spoofable)
The routes check `file.type` (what the browser *says* it is) and the filename extension. An attacker
sets both to whatever they like. Real fix: sniff the actual **magic bytes** server-side and reject
mismatches. (Part of the pipeline below.)

### 🟠 3. Anonymous uploads still allowed to `property_photos`
The `storage.objects` policy `"Allow public uploads"` lets an unauthenticated client insert into the
public `property_photos` bucket — a spam/malware vector. It couldn't be removed earlier because the
old end-user auth was localStorage-based; now that real Supabase auth exists, restrict uploads to
authenticated users. (Gated — pairs with the auth work.)

### 🟠 4. Rate limiting has holes
`src/middleware.js` runs Upstash sliding-window limits — but only **in production**, only on
`/api/*`, and it **fails open** (if Redis is unavailable, the shield is off). Consider: a
Cloudflare/WAF layer in front, fail-closed on the most sensitive routes (auth, upload, AI), and the
Masked IP Anomaly Guard (Phase 2) for velocity blocking.

### 🟠 5. Backups / disaster recovery unconfirmed
Confirm **Point-in-Time Recovery (PITR)** is enabled on Supabase (paid feature). This is your
"undo a catastrophe" and the second "rope" if a key is ever compromised.

### 🟡 6. Missing storage buckets referenced by code
Only `property_photos` exists live. The code references `property-videos-temp`
(`/api/storage/upload`) and `chat_attachments` (`src/lib/storage.js`) — those buckets don't exist, so
those upload paths currently error. Create + lock them (private) as part of the pipeline work.

### 🟡 7. Smaller hardening
- CSP allows `'unsafe-inline'` + `'unsafe-eval'` on scripts (needed by some libs, but widens XSS
  surface — tighten later with nonces if feasible).
- Leaked-password protection: OFF (one dashboard toggle).
- No enforced 2FA for staff/admin identities.
- Email/SMTP provider not configured → real signups can't confirm (also a launch blocker); owner's
  intended fix is Google Sign-In (blocked on a Google Cloud billing card).

---

## 🛡️ The "Double Security" upload pipeline (your design, spec'd)
Goal: a user's uploaded portfolio is scanned BEFORE it can reach staff, and re-verified AGAIN before
staff can download it. Two independent gates + isolation.

**Key distinction:** an **antivirus engine** finds malware; an **AI check** judges legitimacy/content
(is this a real property portfolio vs. junk/abuse). They catch different things — use both.

```
[User uploads portfolio/video]
        │
        ▼
STAGE 0 — QUARANTINE. Land the file in a PRIVATE `quarantine` bucket (never public, never staff-
        visible yet). DB row: status = 'pending_scan'. No signed URL issued.
        │
        ▼
STAGE 1 — PRE-ADMIN SCAN (automated, before it ever appears in Mission Control):
   a) True file-type check — verify magic bytes, reject if they don't match the claimed type.
   b) Antivirus scan — hash the file, look it up (VirusTotal API); if unknown, submit for scan.
      (Alternatives: a ClamAV service, or a commercial file-scan API.)
   c) Sanitize — for PDFs, flatten/re-render to strip active content (JS/embedded objects) or
      convert to images; for images, re-encode to strip payloads/metadata.
   d) AI legitimacy check — an LLM confirms it's a genuine property document, not spam/abuse.
   → Verdict written to DB: 'clean' | 'suspicious' | 'infected'. Only 'clean' advances.
        │
        ▼
STAGE 2 — MISSION CONTROL. Only 'clean' files appear in the Concierge Ingest / Media queue, each
        showing a "Scanned clean by <engine> at <time>" badge. 'suspicious'/'infected' are shown as
        quarantined and are NOT downloadable; the uploader is flagged; verdict logged to the audit.
        │
        ▼
STAGE 3 — PRE-DOWNLOAD RE-CHECK (the "second AI recheck"). When staff click download, DON'T hand out
        a permanent public URL — re-verify (re-confirm the clean hash / quick re-scan), then issue a
        SHORT-LIVED signed URL (minutes). Optionally serve through a sanitized proxy. Log the download.
```

**Where it runs:** a Supabase Edge Function (or a Next API route / queue worker) triggered on upload,
which calls the AV API and the AI, then updates the row. **Tables:** add `scan_status`,
`scan_verdict`, `scan_engine`, `scanned_at` to the upload/queue tables (or a dedicated `file_scans`
table). **Buckets:** a private `quarantine` bucket; nothing user-uploaded goes to a public bucket
until it's cleared (and portfolios/source decks should stay private permanently — served via signed
URLs, never public).

---

## 🚨 "If we get attacked" — response plan (what to have ready)
- **Global kill switch / read-only mode** — a `feature_flags` toggle (`global_read_only`) the public
  site honors, to freeze writes instantly without a redeploy. (Flag exists conceptually; wire the
  read.)
- **IP velocity blocking** — the Masked IP Anomaly Guard: flag + one-click block abusive hashed IPs
  (table ready; HUD + middleware are the build).
- **Key rotation** — be able to rotate `SUPABASE_SERVICE_ROLE_KEY` / Airtable keys from the cloud
  dashboards in minutes (treat `.env.local` as disposable).
- **Restore** — Supabase PITR to roll the DB back to any minute (confirm it's on).
- **Isolation** — Master Mission Control behind the Vercel/Cloudflare gate so admin power isn't
  publicly reachable even if the public site is under attack.
- **Monitoring** — Sentry alerts on error spikes; add alerting on the Security Center's flagged-IP
  events.

---

## Prioritized pre-launch hardening checklist (by lane)
**Founder (dashboard clicks):** enable Supabase PITR · enable Leaked Password Protection · turn on
the Vercel gate for Mission Control · (near-launch) email provider / Google Sign-In.
**Cowork (me, live DB — I can do now):** create the private `quarantine` bucket + scan-status
columns · restrict `property_photos` uploads to authenticated (gated with the auth work) · confirm
RLS on any new tables.
**Claude Code (build):** the upload scan pipeline (Stages 0-3) · magic-byte type checking · Security
Center + IP guard middleware · wire `feature_flags` (incl. `global_read_only`) into the public site ·
create the missing `quarantine`/video/attachment buckets in code + lock them.
