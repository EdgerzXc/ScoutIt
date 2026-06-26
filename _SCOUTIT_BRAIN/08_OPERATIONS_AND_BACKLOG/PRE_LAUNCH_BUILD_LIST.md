# ScoutIt — Pre-Launch Build List
> Confirmed with owner (Jerzel) 2026-06-26. These are the exact things to build before launch.
> Ordered by priority. Do not add features outside this list without owner confirmation.

---

## NORTH STAR
**200 real, approved property listings before subscriptions and Connects economy go live.**
One city. One category (residential) first. Prove the model. Then expand.

---

## BUILD QUEUE (in order)

### 1. CSV Bulk Importer — Backend Connection
**What it is:** For properties with many units (a building with 40 floors, a condo with 200 units). Owner exports from Excel → uploads CSV → unit grid auto-populates.
**What's built:** UI is complete (BulkImporterMode.js). Backend is a fake 2-second delay.
**What to build:** Wire `/api/dashboard/bulk-insert` to actually receive CSV data and store it in `details.units_inventory` JSONB in Supabase.
**Effort:** Low. The UI and backend route already exist.

---

### 2. PDF Concierge (Feature A) — Wire Real AI
**What it is:** Owner drops a PDF pitch deck → AI reads it → auto-fills the listing form fields. Owner reviews, edits, submits.
**What's built:** `/api/ai/assimilate` exists but returns mock/simulated data.
**What to build:** Replace mock with real Gemini 2.5 Flash call. Extract facts only — no invention, no guessing. Blank fields stay blank.
**Model:** Gemini 2.5 Flash (already wired in codebase for blueprint mapping)
**Cost:** ~₱0.05–0.10 per PDF. 200 listings = ₱10–20 total. Not a concern.
**Rule (inherited from Listing Engine):** No source in PDF → field stays blank. Never invent.
**Status:** Feature A. Build now.

> ⚠️ This is NOT the same as the AI buyer chatbot (Feature B). See below.

---

### 3. Spatial Vault — Video Upload Button + Luma Integration
**What it is:** Non-techy owners need a simple upload button. They record a walkthrough on their phone, upload it, ScoutIt processes it through Luma AI, embed link goes into the listing.
**The flow:**
1. Owner clicks "Upload Video" in dashboard
2. Video uploads to Supabase Storage (temporary bucket)
3. Mission Control gets a notification (new video pending)
4. Admin/team uploads video to Luma AI manually
5. Luma returns embed URL (iframe link)
6. Admin pastes embed URL into property's `media_link` field
7. Original video deleted from Supabase Storage
8. Owner sees "Your Spatial Tour is ready"

**For techy owners:** They can also just paste a Luma embed link or Google Drive link directly — the `media_link` field already supports this.

**Storage cost:** Video stored temporarily (1–3 days max). ~200–500MB per video. Deleted after Luma processes it. Cost = nearly zero.
**Luma cost:** ~$20–30/month Pro plan. Unlimited captures, no watermark.
**Who does this at scale:** QuestIT photographers (verified, paid via Connects). For pre-launch, the founder/team handles manually.
**Tier gate:** Cluster+ (already set in entitlements.js)

---

### 4. PRC License Verification — Manual SOP
**What it is:** When a broker activates their broker role, they submit their PRC license number. It needs to be verified as real.
**Current state:** Client-side format check only (5+ digits). No real verification.
**Pre-launch solution:** Manual verification process.

**SOP:**
1. Broker submits PRC license number in dashboard
2. Status flips to `pending_verification` in Supabase `broker_profiles`
3. Admin receives notification in Mission Control
4. Admin checks PRC number at prc.gov.ph manually
5. If valid → flip `verified = true` in Supabase → broker gets verified badge
6. If invalid → notify broker, ask to resubmit
7. Target turnaround: 1–3 business days

**Future (when volume demands):** Automated check via prc.gov.ph scrape or official API if available.

---

### 5. Chat Disclaimer UI (Legal Shield)
**What it is:** A one-line disclaimer that must appear inside every chat window before messages can be sent.
**Text (exact):**
> *"This conversation is temporary and will be deleted when closed. ScoutIt is not a party to any agreement made here."*
**Why:** This is our legal protection under RA 9646 and RA 10173. Non-negotiable before chat goes live.

---

### 6. Message Deletion on Chat Close
**What it is:** When a chat closes (handshake completed OR either party walks away), all `deal_messages` rows for that `deal_id` are hard-deleted from Supabase immediately.
**Why:** Ephemeral by design. No stored private conversations. Legal and privacy protection.
**Where:** In `/api/deals/[id]/handshake` route and any "end chat" action.

---

### 7. Fake Data Removal Checklist
Run this before any public launch:
- [ ] Remove `Simulate Unlock` backdoor from dashboard
- [ ] Remove all test broker records from Airtable BROKERS_CMS
- [ ] Remove all mock properties from Airtable PROPERTIES_CMS
- [ ] Remove mock data fallbacks from `src/data/` (or keep as dev-only, never reach production)
- [ ] Verify all routes return real data, not fallback data
- [ ] Confirm `Approved_For_ScoutIt = true` on every live property
- [ ] Verify no hardcoded test user IDs anywhere in API routes

---

### 8. CMS Proxy Cache Layer
**What it is:** Right now if Airtable hiccups, the entire public site goes blank. Need a short cache.
**Simple fix:** Cache the last good Airtable response for 60 seconds in memory or Redis.
**Next.js option:** Add `revalidate = 60` to the CMS route for ISR (Incremental Static Regeneration).
**When:** Before launch, after the listing count starts growing.

---

## FEATURE A vs FEATURE B CLARIFICATION (locked 2026-06-26)

These are two completely different features. Do not confuse them.

| | Feature A | Feature B |
|---|---|---|
| **Name** | PDF Concierge / Ingest Extractor | In-App AI Concierge |
| **Who uses it** | Property owners listing a property | Buyers searching for properties |
| **What it does** | Reads a PDF pitch deck → auto-fills listing form fields | Answers natural language queries → returns matching properties from database |
| **When it runs** | Once per listing (at submission) | Every buyer query (potentially hundreds/day) |
| **Cost** | ~₱0.05–0.10 per PDF. Cheap. | Scales with query volume. Plan carefully. |
| **Status** | Build now (wire real Gemini) | Plan carefully before building |
| **Model** | Gemini 2.5 Flash | Claude Sonnet or Gemini Pro |
| **Route** | `/api/ai/assimilate` | Not built yet |

---

## LISTING PIPELINE (confirmed operational map)

```
Owner has a property
        │
        ├─ Has PDF pitch deck? → PDF Concierge (Feature A) → auto-fills form
        ├─ Has CSV of units? → Bulk CSV Importer → populates unit grid
        └─ Has nothing? → Live Editor (manual) → types it in
                │
        Live Editor (edit + preview side by side)
                │
        Owner submits → Supabase `properties` (pipeline_status: pending)
                │
        Admin reviews in Mission Control
                │
        Admin approves → Airtable PROPERTIES_CMS (Approved_For_ScoutIt: true)
                │
        Property goes live on public site
```

---

## WHAT WE ARE NOT BUILDING YET
- Full AI Council / Phase 2 Listing Engine (too expensive per listing at this stage)
- Automated PRC scraping (manual is fine at low broker volume)
- Luma API automation (manual processing is fine pre-launch)
- Feature B buyer AI chatbot (plan carefully before building)
- Double-Blind Privacy Shield (future)
- Bounty Hunts (future)

---

> Last updated: 2026-06-26 by Claude (operations session with Jerzel)
