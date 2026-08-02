---
section: "15_IMPLEMENTATION_RECORDS"
status: active
tags: [implementation-record, handoff, spatial-osint, intel]
updated: 2026-08-02
related: ["[[15_IMPLEMENTATION_RECORDS/README|Implementation Records]]", "[[OSINT_INTEL_ARCHITECTURE]]", "[[08_OPERATIONS_AND_BACKLOG/NEW_IDEAS|NEW_IDEAS]]"]
---

# HANDOFF — SPATIAL OSINT SIGNALS & ARTICLE PIPELINE (§23)

**Written:** 2026-07-31 · **For:** Antigravity / Gemini
**Backlog ref:** `_SCOUTIT_BRAIN/08_OPERATIONS_AND_BACKLOG/NEW_IDEAS.md` §23
**Goal:** Build a bank of publish-ready Intel articles NOW, then layer spatial
intelligence on top.

---

## 0. READ THIS FIRST — THE SCOPE IS SMALLER THAN §23 SUGGESTS

**The article engine already exists and works. Do not rebuild it.**

Verified present in the codebase as of commit `1052721`:

| What | Where | Status |
|---|---|---|
| Document → article pipeline | `src/app/api/intel/ingest/route.js` | ✅ working |
| Universal block schema + validators | `src/lib/articleSchema.js` | ✅ working |
| Article list page | `src/app/intel/page.js` | ✅ working |
| Article detail page | `src/app/intel/[article-slug]/page.js` | ✅ working |
| Public CMS feed | `src/app/api/cms/route.js` → `bundle.intel` | ✅ working |
| Airtable table | `INTEL_CMS` | ✅ exists |

`/api/intel/ingest` already accepts `multipart/form-data` with a `file`
(`.pdf` `.csv` `.txt` `.md`) **or** a `text` field, runs Gemini to structure it
into blocks, and creates an `INTEL_CMS` record.

**Existing Airtable field names — use these exactly, do not invent new ones:**
```
Title, Slug, SpaceCategory, IntelType, Date, City,
Excerpt, Lead, Recommendation, Body_JSON, Approved_For_Live_Site
```

**Existing enums — do not extend without owner approval:**
```
SpaceCategory : Residential | Commercial | STR | Hospitality | Restaurants | Venues | General
IntelType     : BRIEFING | MARKET INTEL | AREA GUIDE | COMMERCIAL SIGNAL | INSIGHT
```

**What is MISSING (this is the actual work):**
1. Automated ingestion from public sources — today it is manual upload only.
2. Geotagging — no `lat`/`lng`/radius on a signal.
3. Property matching — no link from a signal to nearby listings.
4. MMC review queue — no approve/edit/reject UI.
5. Map overlay + Discover (Layer 2) integration.

---

## 1. NON-NEGOTIABLE RULES

These come from `AGENTS.md` / `CLAUDE.md`. Violating them causes silent data
corruption or breaks the public site.

1. **Dual-CMS Golden Rule.**
   - **Airtable = public, read-only content.** Anything a visitor can see.
     Read via `/api/cms`. Never query Airtable directly from a client component.
   - **Supabase = private user data + operational state.** Review queues,
     ingestion logs, dedupe hashes, moderation status.
   - A signal that is *published* lives in Airtable. A signal *awaiting review*
     lives in Supabase. Do not blur this.

2. **Design DNA.** Always dark. `#0d0d0d` / `#121212` surfaces, gold accents
   `#E8AE3C` (`--accent`), `#F7C64E` (`--accent-bright`), `#6E531A`
   (`--accent-muted`). **Always CSS variables, never raw hex in components.**

3. **Auth.** Use `resolveUserId(request)` from `@/lib/serverAuth` — never
   hand-roll token parsing. Admin routes must additionally check the MMC admin
   gate (copy the pattern in `src/app/api/admin/property/route.js`).

4. **Rate limiting is automatic.** `src/middleware.js` covers all `/api/*`.
   Do not add per-route limiters. `/api/ai/*` already has a dedicated limiter.

5. **Server-authoritative gating.** If any part of this is tier-gated, resolve
   the tier server-side. Copy `resolveTier()` in `src/app/api/ai/promote/route.js`.
   **Never read `tier` or `role` from a request body.**

6. **ISR.** Public article pages use `export const revalidate = 3600`.

7. ⚠️ **VERIFY BEFORE WRITING `Slug`.** `AGENTS.md` states Airtable's `Slug` is
   a **formula field** and must never appear in a write payload. But
   `intel/ingest/route.js` currently writes `Slug: article.slug`. Either
   `INTEL_CMS.Slug` is a plain text field (fine) or this write is silently
   failing/being ignored. **Confirm in the Airtable schema before building on
   it.** If it is a formula, strip `Slug` from the payload.

---

## 2. PHASING — ARTICLES FIRST, SPATIAL SECOND

The owner's priority: *"create articles so whatever happens we already have our
articles ready to deploy."* Therefore **Phase 1 must produce publishable
articles without any of the spatial machinery.** Do not build the map overlay
before articles exist.

Ship each phase independently. Do not start a phase until the previous one is
deployed and verified.

---

## PHASE 1 — SOURCE FEED → DRAFT ARTICLE BANK
> **Outcome:** a growing bank of draft Intel articles in Airtable, all
> `Approved_For_Live_Site = false`, ready for a human to approve.

### 1.1 New Supabase table — `intel_sources`
Operational config, not public content → Supabase.
```sql
create table public.intel_sources (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,              -- "DPWH Bulletins"
  feed_url     text not null,
  feed_type    text not null,              -- 'rss' | 'atom' | 'html'
  category     text,                       -- maps to SpaceCategory
  intel_type   text,                       -- maps to IntelType
  is_enabled   boolean not null default true,
  last_run_at  timestamptz,
  created_at   timestamptz not null default now()
);
alter table public.intel_sources enable row level security;
-- service-role only; no client access
```

### 1.2 New Supabase table — `intel_ingest_log`
Dedupe + auditability. **Without this you will republish the same article daily.**
```sql
create table public.intel_ingest_log (
  id             uuid primary key default gen_random_uuid(),
  source_id      uuid references public.intel_sources(id) on delete set null,
  source_url     text not null,
  content_hash   text not null,            -- sha256 of normalized body
  airtable_id    text,                     -- INTEL_CMS record id, null if skipped
  status         text not null,            -- 'created' | 'duplicate' | 'failed'
  error          text,
  created_at     timestamptz not null default now()
);
create unique index idx_intel_ingest_hash on public.intel_ingest_log(content_hash);
alter table public.intel_ingest_log enable row level security;
```

### 1.3 New route — `POST /api/cron/intel-harvest`
- **Auth:** `CRON_SECRET` bearer check. Copy
  `src/app/api/cron/check-stale-listings/route.js` exactly.
- For each enabled `intel_sources` row: fetch feed → parse entries → for each
  entry compute `sha256(normalized text)` → skip if hash exists in
  `intel_ingest_log` → otherwise pass the text through the **existing**
  structuring logic and create an `INTEL_CMS` record with
  `Approved_For_Live_Site = false`.
- **Refactor, don't duplicate:** extract the Gemini structuring +
  `createIntelRecord` logic out of `intel/ingest/route.js` into
  `src/lib/intelPipeline.js` and have both routes call it.
- Log every outcome to `intel_ingest_log`.
- Register in `vercel.json` crons — **daily, not hourly.** Gemini calls cost money.

### 1.4 Editorial rule — bake into the prompt
ScoutIt **never reposts** external articles. Every record must be a ScoutIt
synthesis with the original as a footnote. Extend `STRUCTURE_PROMPT` in
`intelPipeline.js`:
- Final block must be a `paragraph`: `Source: <publisher> — <url>`
- Rules 1 and 2 of the existing prompt (facts only, never invent) stay verbatim.

### 1.5 Acceptance criteria
- [ ] Manual `POST /api/cron/intel-harvest` with a valid `CRON_SECRET` creates ≥1 draft
- [ ] Running it twice creates **zero** duplicates (second run logs `duplicate`)
- [ ] Drafts do **not** appear on `/intel` (they are unapproved)
- [ ] Flipping `Approved_For_Live_Site` in Airtable makes one appear within 1 hour (ISR)
- [ ] `npx next build` passes · existing tests still green

---

## PHASE 2 — GEOTAGGING & PROPERTY MATCHING
> **Outcome:** each signal knows where it is and which listings it affects.

### 2.1 Airtable additions to `INTEL_CMS`
```
Latitude          (number, precision 6)
Longitude         (number, precision 6)
Impact_Radius_KM  (number)          -- default 1.5
Impact_Score      (number 1-10)
Linked_Properties (long text)       -- comma-separated property slugs
```
Add to the `/api/cms` intel mapper so they reach the client.

### 2.2 Enrichment step in the pipeline
After structuring, before the Airtable write:
1. Ask Gemini to extract a Philippine place name from the article body.
2. Geocode it — **reuse the existing Mapbox geocoding call**
   (`api.mapbox.com/geocoding/v5/mapbox.places`, already used in the codebase).
   ⚠️ The Mapbox token is now **URL-restricted** (set 2026-07-31). Server-side
   calls send no `Origin`, so they are unaffected — but if geocoding starts
   returning 401, that restriction is the first thing to check.
3. Match listings: pull property coords from the CMS bundle, compute haversine
   distance, keep those within `Impact_Radius_KM`. Write slugs to
   `Linked_Properties`.
4. If no location can be extracted, still create the record — leave geo fields
   empty. **A signal without coordinates is still a valid article.** Do not drop it.

### 2.3 Acceptance criteria
- [ ] An article mentioning a known Metro Manila location gets lat/lng
- [ ] `Linked_Properties` contains only slugs actually within the radius
- [ ] An article with no detectable location still publishes, geo fields blank

---

## PHASE 3 — MMC REVIEW QUEUE
> **Outcome:** the owner approves signals from Mission Control, not Airtable.

Mission Control is a **single page**: `src/app/admin/page.js`. Add a section;
do not create a parallel admin app.

- **`GET /api/admin/intel-queue`** — drafts where `Approved_For_Live_Site = false`.
  Admin-gated (copy `src/app/api/admin/property/route.js`).
- **`PATCH /api/admin/intel-queue`** — actions: `approve` | `reject` | `edit`.
  `approve` sets `Approved_For_Live_Site = true`.
- **UI:** card per draft showing title, lead, excerpt, detected location, matched
  properties, impact score, source link. Buttons: `[ Approve & Publish ]`
  `[ Edit Take ]` `[ Reject ]`.
- Design DNA applies. Use CSS variables.

### 3.1 Acceptance criteria
- [ ] Queue lists only unapproved drafts
- [ ] Approve → live on `/intel` within the ISR window
- [ ] Non-admin session receives 403
- [ ] Reject removes it from the queue and does not publish

---

## PHASE 4 — MAP OVERLAY & DISCOVER (LAYER 2)
> **Outcome:** signals appear spatially. Do this last.

- `[📡 SIGNALS]` toggle layer on the existing MapLibre surface.
- Radar nodes at signal coords, radius circle = `Impact_Radius_KM`.
- Property dossier: "Nearby signals" section reading `Linked_Properties` in reverse.
- `/discover` Layer 2 feed, filterable by `SpaceCategory` / `IntelType`.

⚠️ **Performance constraint.** Property pages were optimised on 2026-07-30 —
maps are lazy-mounted via `src/components/ui/InViewport.js` because maplibre
costs ~1 MB and 1.7 s of CPU. **Any new map layer must mount inside
`InViewport` too.** Do not regress LCP/TBT. Re-run Lighthouse mobile after this
phase; performance is currently **83** and must not drop below 80.

---

## 5. WHAT NOT TO DO

- ❌ Do not build a new article CMS. `INTEL_CMS` + `Body_JSON` is the schema.
- ❌ Do not write public content to Supabase or private state to Airtable.
- ❌ Do not repost external articles verbatim — synthesis + source footnote only.
- ❌ Do not add per-route rate limiting; middleware handles it.
- ❌ Do not read tier/role from a request body.
- ❌ Do not run the harvest hourly. Daily. Gemini costs money per call.
- ❌ Do not mount new map layers eagerly.

---

## 6. ENVIRONMENT

Already configured — reuse, do not add new secrets:
```
AIRTABLE_API_KEY · AIRTABLE_BASE_ID · GEMINI_API_KEY
NEXT_PUBLIC_SUPABASE_URL · SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN · CRON_SECRET
```

Run `npx next build` before every commit. Existing test suite must stay green.
