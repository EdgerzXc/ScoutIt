# Master Mission Control — Gap Analysis (what's missing & the next natural step)

_From a deep read of the mission-control app + `_SCOUTIT_BRAIN` (OS architecture, master build spec
§3, Mission Control SOP, MMC & Brain vision, staff/enterprise plan). 2026-07-23._

## What Master Mission Control is SUPPOSED to be (4 sources agree)
1. **Master Build Spec §3** (canonical) — the operational cockpit: Overview, **Approval Queue that
   flips the LIVE `Approved_For_ScoutIt` gate**, Trust & Badges, **Disputes**, Content, Monetization,
   Badges, Team & Access, Economy — gated by fine-grained permission keys + `permission_grants`.
2. **Mission Control SOP** — the daily ritual is **The Gate**: approve a property → it goes live on
   the public site. Everything points at `PROPERTIES_CMS`; nothing is public until its approval
   checkbox is ticked.
3. **Master Mission Control Blueprint** — the 17-module "NASA Cockpit" (Disputes Hub, IP Anomaly
   Guard, DEFCON kill switch, Mission Inbox, etc.) — idea reference.
4. **MMC & Brain Vision** — MMC is the "nervous system" wired to the **Brain**: a **Team WIKI / RAG
   search** where staff ask natural-language questions and an LLM answers from your Obsidian
   knowledge graph (via pgvector). This is MMC's signature differentiator.

## What's actually built today (the real app)
Auth + 3-tier RBAC · Overview (live) · Property Review Queue (Supabase `properties` only) · User CRM
(staff moderation) · Badges catalog · Metrics · Audit Log · Feature Flags · Staff IAM · Concierge
Ingest · Notifications · CSV import. Solid CRUD foundation.

## THE GAPS — why it feels incomplete

### 🔴 #1 — It can't actually publish a listing to the live site (the core loop is open)
The single most important job of Mission Control is **The Gate**: approve a property so it appears on
the public site. That gate is the Airtable field `Approved_For_ScoutIt` on `PROPERTIES_CMS`. The
current app only approves the **Supabase** `properties` table — which does NOT publish anything
public. So today you literally cannot make a listing go live from Mission Control; that still
requires the old Airtable Interface. **This is the biggest reason it feels like "just a shell" — the
supply→approve→live loop isn't closed.**

### 🔴 #2 — It's not connected to the Brain (its defining feature is absent)
The vision's whole point is MMC = the Brain-connected nerve center with a **Team WIKI / RAG search**
("what's our playbook when an owner can't upload a commercial property?"). None of that exists — the
app is a CRUD panel, not the AI-connected intelligence layer. This is likely the "soul" you feel is
missing.

### 🟠 #3 — Missing whole modules the spec/blueprint call for
- **Disputes Hub** (broker-vs-broker slot conflicts, broker-vs-owner authority) — not built.
- **Trust & Verification Center** (PRC license approvals, Verified/Price_Verified_By) — not a queue.
- **Content management** (Board, Categories, Collections, About, Homepage) — still Airtable-only.
- **Monetization config** (Tiers, Connect costs/packs, Bounties) — still Airtable-only.
- **Economy / Financial Center** (connect_balances ledger, refunds) — not built.
- **Security Center / IP Anomaly Guard** — planned this session (table now created), not built.
- **Mission Inbox** (one daily triage list), **1-Click Undo**, **Circuit Breaker** — not built.

### 🟡 #4 — Toggles don't reach the public site yet
Feature Flags and Badges are managed in MMC, but the **live public site doesn't read them yet**, so
flipping a flag currently changes nothing publicly. The plumbing is one-sided.

### 🟡 #5 — The permission model is simpler than spec'd (by deliberate choice)
Spec calls for named roles + granular permission keys (`approval_queue.publish`, `intelligence.edit`,
`trust.badge_override`, `disputes.mediate`…) + per-user `permission_grants`. The app uses a simpler
3-tier model. Fine for now; the finer model is what later lets "a Researcher edit intelligence but
not publish."

### 🟡 #6 — The publish pipeline isn't automated
Supabase→Airtable sync of approved submissions is manual/concierge; the Edge-Function/Make.com sync
is unbuilt.

## Recommended NEXT NATURAL STEP
**Close the publishing loop first (#1).** Bring the Airtable `Approved_For_ScoutIt` gate into Mission
Control's Property Review Queue so a staff member can approve a Supabase draft AND publish it live in
one place. Until this exists, everything else is polish on a tool that can't yet do its main job.
This also finally makes Concierge Ingest end-to-end (owner uploads → staff synthesizes → **approve →
live**).

### Suggested sequence after that
1. **Publish gate** (close the loop) — highest impact.
2. **Wire the public site to read `feature_flags`** (make toggles real) — small, high leverage.
3. **Security Center / IP Anomaly Guard** (the "second wall" — table is ready).
4. **Trust & Verification Center** + **Mission Inbox** (daily-ops backbone).
5. **Brain/RAG Team Wiki** (the signature intelligence layer) — bigger, do when the ops core is solid.
6. Disputes Hub, Economy/Financial Center, Enterprise accounts (now unblocked since RLS landed).

## Note: two different "Mission Controls" — don't conflate
- **Master Mission Control** (this app) = ScoutIt staff run the platform.
- **Enterprise Mission Control** = a paying client (e.g. Megaworld) manages their own portfolio —
  lives on the MAIN site as a dashboard mode (`organizations`/`organization_members`), was parked on
  the RLS reset, which is now done, so it's unblocked as a separate future track.
