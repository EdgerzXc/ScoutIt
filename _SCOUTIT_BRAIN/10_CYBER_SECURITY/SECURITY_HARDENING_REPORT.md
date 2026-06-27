# ScoutIt Cyber Security Hardening Report

**Date:** June 2026
**Status:** ✅ Fully Hardened & Deployed

This document details the security layers implemented across ScoutIt to ensure the platform is robust against scraping, DDoS attacks, unauthorized data mutation, and search-path injection.

---

## 1. Edge-Level Protection (Upstash Redis Rate Limiting)
To protect the site from bot traffic and API abuse, we implemented **Upstash Redis** rate limiting.

### Global Edge Limiter (`middleware.js`)
- **Scope:** All traffic hitting `/api/*`.
- **Rules:** 20 requests per 10 seconds per IP.
- **Action:** Returns `429 Too Many Requests` when limits are exceeded.
- **Why:** Prevents basic volumetric scraping and basic DDoS on our serverless functions.

### Granular API Endpoint Limiters
- **Scope:** High-value mutation endpoints (`/api/dashboard/update`, `/api/dashboard/publish`, `/api/dashboard/bulk-insert`, etc.).
- **Rules:** 5 requests per 10 seconds per user token (using `upstash/ratelimit` within the route handlers).
- **Why:** Protects against aggressive scripting from authenticated users while keeping normal usage fluid.

---

## 2. API Hardening & Payload Constraints
We secured the Next.js API route handlers to prevent unauthorized role elevation.

- **Strict JWT Verification:** Used `@supabase/ssr` to verify the actual user token server-side before processing any edits or publishing actions.
- **Payload Stripping:** When updating a listing (`/api/dashboard/update`), we explicitly extract only the allowed fields (e.g., `details`, `price`, `media_link`). 
- **Owner Verification:** We enforce that the user modifying a property matches the `owner_id` recorded in the Supabase `properties` table.

---

## 3. Deep E2E Council Verification (Playwright)
We deployed the "Council" through automated Playwright testing (`e2e_tests/council-verification.spec.js`) to ensure our security layers do not degrade the actual user experience.

- **Owner POV:** Automated the complete flow of opening the "+ New Property File" wizard.
- **Buyer POV:** Simulated opening a Property Dossier and triggering the "Schedule a Viewing" modal.
- **Broker POV:** Navigated the deal pipeline and opened private workspace details.
- **Result:** The system sustained rapid automated interactions without triggering false-positive rate limits on normal workflows, and all modals rendered flawlessly.

---

## 4. Supabase SQL Hardening (Row Level Security)
The database was moved from "dev-open" (`FOR ALL USING (true)`) to a production-hardened state via a comprehensive SQL patch (`supabase_advisor_fixes.sql`).

- **Search Path Protection:** Applied `SET search_path = public` to critical functions (`search_properties_in_radius()`, `audit_record_changes()`) to prevent search-path injection attacks.
- **RLS Policy Lockdown:** Dropped all permissive `USING (true)` and `WITH CHECK (true)` policies across user and system tables.
- **Role-Based Policies:** Recreated strict policies for tables like `broker_profiles`, `privacy_settings`, `bounty_claims`, and `error_reports`.
  - Authenticated users can only `INSERT` and `UPDATE` records where the data belongs to them.
  - Internal system tables like `connect_balances` were locked down (`FOR UPDATE USING (false)`) so only the server-side Edge Functions can modify ledger numbers.
- **Known Exceptions:** `spatial_ref_sys` triggers an "RLS Disabled" warning in the Security Advisor. This is an internal PostGIS table protected by Supabase; the warning is safely ignored.

---

## 5. Next Steps
- Move onto building the **QuestIT** framework (Data Bounty layer).
- Secure the upcoming Webhooks (e.g., PayMongo/payment processors) once implemented.
