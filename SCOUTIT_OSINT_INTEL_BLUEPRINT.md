# ScoutIt OSINT Intel & 3D Spatial Radar Master Architecture Blueprint

> **CRITICAL ARCHITECTURE REFERENCE:**
> This document is mirrored from [`_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/OSINT_INTEL_ARCHITECTURE.md`](file:///c:/Users/jerze/ScoutIt/_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/OSINT_INTEL_ARCHITECTURE.md).

---

## 1. EXECUTIVE VISION & OPERATIONAL MODEL

ScoutIt Intel is an **OSINT (Open Source Intelligence) Spatial Radar Platform** designed to give property buyers, commercial tenants, and investors actionable spatial signals before mainstream media reports them.

### Key Operational Rules:
1. **AI Search Engine Ingestion:** Uses AI Search Engines (Exa / Perplexity / Tavily) to semantically query live web indexes for real-time Philippine commercial, residential, and infrastructure signals.
2. **Hybrid Ingestion:** Combines automated AI Search & Scheduled Scrapers with a 30-second **Manual Quick-Input Form** in Mission Control.
3. **Subscribed AI Processing (Zero API Overhead):** Leverages existing AI subscriptions (ChatGPT Pro / Claude / Gemini Pro) via Mission Control's **1-Click Master Prompt Generator**.
4. **Human-in-the-Loop Verification:** You review and approve every `"Our Take"` briefing before publishing.

---

## 2. THE 4-STEP OPERATIONAL DATA FLOW

```
[1. HYBRID RAW OSINT INGESTION]  ──> AI Search Engine / Scheduled Scraper / Manual Input
                                     Saves to Supabase `intel_sources` table
                                     
[2. PROMPT GENERATOR]            ──> Mission Control 1-Click Copy Master AI Prompt
                                     (Calls SQL function generate_osint_master_prompt)
                                     
[3. SUBSCRIBED AI SYNTHESIS]     ──> You paste prompt to ChatGPT / Claude / Gemini Pro
                                     AI returns "Our Take" summary & JSON block schema
                                     
[4. ONE-CLICK PUBLISH]           ──> Paste JSON back to Mission Control → Click Publish
                                     - Saves to Supabase `intel_briefings` & Airtable `INTEL_CMS`
                                     - Updates Live OSINT Flash Ticker
                                     - Highlights 3D Map location in glowing gold (#F7C64E)
                                     - Renders on /intel page and /intel/[article-slug]
```

---

## 3. KEY FILES & SCHEMAS

- **Master SQL Schema Script:** [`supabase_osint_intel_schema.sql`](file:///c:/Users/jerze/ScoutIt/supabase_osint_intel_schema.sql)
- **Mission Control Admin API:** [`src/app/api/admin/osint/route.js`](file:///c:/Users/jerze/ScoutIt/src/app/api/admin/osint/route.js)
- **Live OSINT Flash Ticker:** [`src/components/intel/OSINTFlashTicker.js`](file:///c:/Users/jerze/ScoutIt/src/components/intel/OSINTFlashTicker.js)
- **Intel Hub Main Page:** [`src/app/intel/page.js`](file:///c:/Users/jerze/ScoutIt/src/app/intel/page.js)

---

## 4. MISSION CONTROL PRODUCTION SECURITY & VERCEL PRO TRANSITION

> **FUTURE DEVELOPMENT CHECKLIST:**
> Execute these 5 security steps when upgrading to Vercel Pro / Paid tier and attaching your custom subdomain (`mc.scoutit.space`).

1. **Vercel Deployment Protection / Password Gate:**
   - Enable **Password Protection** or **Vercel SSO** on `mc.scoutit.space` in Vercel Project Settings.
   - Prevents unauthenticated web crawlers or unauthorized visitors from probing the login interface (`/`).
2. **Strict Internal API Secret Header (`x-mmc-secret`):**
   - Add `MMC_SECRET_KEY` env var in Vercel.
   - Enforce `req.headers.get("x-mmc-secret") === process.env.MMC_SECRET_KEY` on `/api/admin/osint` and `/api/admin/property` to reject unauthorized external requests.
3. **Cloudflare Turnstile Bot Shield:**
   - Add Cloudflare Turnstile widget to Mission Control login page to block credential stuffing and automated brute-force attempts.
4. **8-Hour Session TTL:**
   - Configure Supabase Auth JWT expiration to 8 hours (1 workday) for staff sessions.
5. **Instant Emergency Access Revocation:**
   - Setting `admin_users.active = false` in Supabase immediately revokes access for a compromised or departing staff member across all active sessions.

