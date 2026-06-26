# Session Handoff — 2026-06-26

> Resume point for the next Claude session. Read this first before touching anything.
> This session covered: full brain audit, vulnerability review, vision locking, and operational feature builds.

---

## What ScoutIt Is (The Real Vision — locked this session)

ScoutIt is the **operating system for Philippine real estate** — not a listings site.

It puts all brokers in the same arena for the first time. Owners don't need to hire large sales teams. Brokers don't need their own websites. Everyone competes on quality inside ScoutIt's ecosystem. ScoutIt never touches transactions — it is the intelligence + authorization layer above everything.

**Category:** Spatial Commerce = Space · Intelligence · Technology (S.I.T.)
**Compliance:** RA 9646 clean — Connects is an authorization layer, not brokerage. Verified this session.
**North star:** 200 real approved listings before monetization and subscriptions go live.

**Design rules (locked, never break):**
- 95% dark (`#0e0e0e`), 5% gold. Always CSS variables — never raw hex.
- `--accent: #E8AE3C` · `--accent-bright: #F7C64E` · `--accent-muted: #6E531A`
- Dark mode only. Tailwind allowed in dashboards. Vanilla CSS for public site.

---

## Dual CMS — Do Not Mix

- **Airtable** = public read-only. All live properties, brokers, articles. One proxy: `src/app/api/cms/route.js` (has 60s ISR cache — already working)
- **Supabase** = private user data. Submissions, connects, deals, profiles. Auth is still localStorage mock — Supabase Auth is next phase.

---

## What Was Built This Session

### 1. CSV Bulk Importer — Real Backend Wired
**File:** `src/components/dashboard/BulkImporterMode.js`
- Was: fake 2-second setTimeout
- Now: calls `/api/ai/blueprint` to normalize headers → transforms rows → POSTs to `/api/dashboard/bulk-insert`
- Note: BulkImporterMode is for **unit-heavy properties** (buildings with many floors/units), NOT for importing multiple separate properties. That's the OwnerMode bulk flow using Papa.parse + blueprint.

### 2. PDF Concierge (Feature A) — Real Gemini Extraction
**File:** `src/app/api/ai/assimilate/route.js`
- Was: mock returning fake confidence scores
- Now: real Gemini 2.5 Flash call with full ScoutIt schema prompt
- Extracts: title, location, space_category, price, floor_sqm, beds, baths, furnishing, tenure, description, media_link + puts unknowns into details JSONB
- Returns: confidence score (0–1) + gaps array (fields that couldn't be found)
- Fallback: naive keyword mapping if GEMINI_API_KEY is missing
- **Rule (non-negotiable):** No source in PDF → field stays blank. Never invent.

**File:** `src/components/dashboard/OwnerMode.js` — concierge wizard
- Was: called addConciergeListing() mock
- Now: reads PDF as text → calls /api/ai/assimilate → creates real draft listing in Supabase with ai_confidence and ai_gaps in details

### 3. Spatial Vault Video Upload — Real Storage
**File:** `src/app/api/storage/upload/route.js` (NEW)
- Accepts multipart form (file + owner_id + property_id)
- Validates file type (mp4, mov, avi, webm, mkv) and size (max 500MB)
- Uploads to Supabase Storage bucket: `property-videos-temp`
- Inserts a row into `video_upload_queue` table (admin sees this in Mission Control)
- Original video deleted after admin processes it through Luma AI

**File:** `src/components/dashboard/OwnerMode.js` — vault "Submit for Processing" button
- Was: called addConciergeListing() mock
- Now: POSTs to /api/storage/upload with real FormData

**The Luma flow (manual for now):**
1. Owner uploads video → Supabase Storage temp bucket
2. Admin gets notified via `video_upload_queue` table
3. Admin uploads to Luma AI → gets embed URL
4. Admin pastes embed URL into property's media_link field
5. Original video deleted from storage

---

## What Still Needs Manual Action Before Next Session

### Supabase (do before testing video upload)
1. Create Storage bucket: `property-videos-temp` (private, not public)
2. Run this SQL migration: `_SCOUTIT_BRAIN/04_DATA_AND_SCHEMA/VIDEO_UPLOAD_QUEUE_MIGRATION.sql`
3. Set `SUPABASE_SERVICE_ROLE_KEY` env var in Vercel (needed by storage upload route)

### PRC Broker Verification (no code needed — it's a manual SOP)
- Broker submits PRC license number
- Admin checks prc.gov.ph manually
- Flip `verified = true` in Supabase `broker_profiles`
- Target turnaround: 1–3 days
- Automate later when volume demands it

---

## Feature A vs Feature B (Critical — Do Not Confuse)

| | Feature A | Feature B |
|---|---|---|
| **Name** | PDF Concierge / Ingest Extractor | In-App AI Concierge (buyer chatbot) |
| **Who uses it** | Owners listing a property | Buyers searching properties |
| **Cost** | ~₱0.05–0.10 per PDF. Cheap. | Scales with query volume. Plan carefully. |
| **Status** | ✅ Built this session | Not built yet — plan before building |
| **Route** | `/api/ai/assimilate` | Does not exist yet |

---

## Legal Decisions Locked This Session

- **Connects = authorization layer, NOT brokerage.** RA 9646 concern resolved.
- **Chat is ephemeral — delete all messages on close.** Never store permanently.
- **Required UI disclaimer inside every chat window:**
  > *"This conversation is temporary and will be deleted when closed. ScoutIt is not a party to any agreement made here."*
- **ScoutIt resolves platform disputes only** — never transaction disputes.
- All of this is documented in `_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/BROKER_HANDSHAKE_CHAT.md`

---

## Pre-Launch Build Queue (remaining items)

From `_SCOUTIT_BRAIN/08_OPERATIONS_AND_BACKLOG/PRE_LAUNCH_BUILD_LIST.md`:

- [ ] Chat disclaimer UI inside every chat window (one line, required before chat goes live)
- [ ] Message hard-delete on chat close (in `/api/deals/[id]/handshake` route)
- [ ] Supabase reset — new tokens, RLS on from day one before any data goes in
- [ ] Fake data removal checklist (before launch week — written checklist, not memory)
- [ ] `video_upload_queue` SQL migration + Supabase Storage bucket creation (manual)

---

## GTM + Operations Confirmed This Session

- **200 listings before monetization** — non-negotiable north star
- **Seed:** Residential brokerage partner (confirmed). One city first.
- **Content angle:** Deep intel, not "this property is good." Show foot traffic, anchors, business potential, neighborhood data. That's what makes it shareable.
- **Social:** Dark editorial luxury. Launch accounts next week with sneak peeks.
- **SEO:** Primary long-term channel. Founder has CRE SEO track record (ranked from 0 → top 1-5 Google).
- **Listing pipeline:** PDF Concierge → CSV Bulk Import → Live Editor (manual). All three now wired.

---

## Key Files to Know

| File | What it does |
|---|---|
| `src/app/api/ai/assimilate/route.js` | PDF/CSV → real Gemini extraction (built this session) |
| `src/app/api/ai/blueprint/route.js` | CSV header → ScoutIt schema mapping (Gemini, was already real) |
| `src/app/api/storage/upload/route.js` | Video upload to Supabase Storage (NEW this session) |
| `src/app/api/dashboard/bulk-insert/route.js` | Bulk Supabase insert (was already real, frontend now calls it) |
| `src/components/dashboard/BulkImporterMode.js` | CSV import UI (wired this session) |
| `src/components/dashboard/OwnerMode.js` | Owner dashboard + all listing wizards (updated this session) |
| `src/app/api/cms/route.js` | Airtable proxy (60s ISR cache already in place) |
| `src/lib/airtable.js` | Airtable fetch helpers |
| `src/lib/entitlements.js` | Feature gates by tier |
| `_SCOUTIT_BRAIN/01_IDENTITY_AND_VISION/SCOUTIT_BIBLE.md` | Full vision + legal + design + GTM (updated this session) |
| `_SCOUTIT_BRAIN/08_OPERATIONS_AND_BACKLOG/PRE_LAUNCH_BUILD_LIST.md` | Confirmed build queue |
| `_SCOUTIT_BRAIN/08_OPERATIONS_AND_BACKLOG/VULNERABILITY_AUDIT_2026-06-26.md` | Risk map + resolved items |

---

## What This Session Did NOT Push Yet

The code builds were made but **not yet committed or pushed to GitHub/Vercel** — owner asked to push at end of session but we wrote this handoff first. Push all staged changes in one commit before closing.

Commit message suggestion:
```
feat: wire real Gemini extraction, CSV importer backend, and Spatial Vault video upload

- /api/ai/assimilate: replace mock with real Gemini 2.5 Flash extraction
- BulkImporterMode: wire real blueprint → transform → bulk-insert pipeline
- OwnerMode: PDF concierge calls real assimilate API, creates real draft listing
- OwnerMode: vault video upload calls real /api/storage/upload endpoint
- /api/storage/upload: new route — validates, uploads to Supabase Storage temp bucket, notifies admin via video_upload_queue
- Brain: SCOUTIT_BIBLE, BROKER_HANDSHAKE_CHAT, PRE_LAUNCH_BUILD_LIST, VULNERABILITY_AUDIT all updated
```

---

> Last updated: 2026-06-26 | Session with Jerzel (EdgerzXc)
> Next session: push to GitHub → Vercel deploys automatically → run Supabase SQL migration → create storage bucket
