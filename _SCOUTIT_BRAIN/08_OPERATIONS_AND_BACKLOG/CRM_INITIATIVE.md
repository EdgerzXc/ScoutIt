# CRM Initiative — Relationship Intelligence, Not Contact Management

**Status: CAPTURED, NOT SCOPED, NOT BUILT.** Source: owner-authored "ScoutIT Strategic Product
System Prompt" (`2 Core Ideas.docx`, provided 2026-07-03). This doc records the philosophy and
constraints the owner wants any future ScoutIt CRM to follow, plus what already exists in the
codebase that a real build would extend. Nothing here is an implementation plan — no schema,
no UI, no phased build order yet. That's the next conversation, not this doc.

## 1. The core instruction: what ScoutIt's CRM is NOT

> "Do NOT think of ScoutIT as a CRM competitor. ScoutIT is initially a System of Intelligence,
> not merely a System of Record."

ScoutIt's moat is intelligence (opportunity scoring, lead scoring, market heat detection,
predictive matching, close probability), **not** CRM feature parity with Salesforce/HubSpot/Zoho.
A ScoutIt CRM is allowed to exist, but only in service of workflow gravity (§2) — it should never
become the product's center of gravity on its own.

### Allowed CRM-like features
- lead stages
- deal pipeline
- notes
- reminders
- interaction history
- follow-up recommendations

### Explicitly avoid
- replicating enterprise CRM complexity
- "contact management" framing — think **relationship intelligence** instead: every CRM surface
  should connect back to a ScoutIt-native signal (a deal's close probability, a lead's match
  score) rather than being a bare system of record for names/emails/notes.

## 2. Strategic framing: Workflow Gravity

The owner's broader strategic lens for evaluating *any* new ScoutIt feature, CRM included:

```
ENTRY → DEPENDENCY → WORKFLOW CENTRALIZATION → NETWORK LOCK-IN → OPERATING SYSTEM
```

- **Entry** — why does a user come to ScoutIt at all (premium listings, property intelligence,
  lead gen).
- **Dependency** — why do they come back *daily* (a CRM is a strong dependency-driver by nature —
  brokers checking a pipeline is exactly the kind of recurring habit this phase wants).
- **Workflow Centralization** — which *external* tool does this replace. For brokers specifically,
  the doc names the exact tools in play: spreadsheets, WhatsApp, and lightweight CRM tools. A
  ScoutIt CRM's success metric isn't "brokers use it," it's "brokers stop needing a spreadsheet
  + WhatsApp + a separate CRM for ScoutIt-sourced deals."
- **Network Lock-in** — a broker's deal history, notes, and relationship data living inside
  ScoutIt (not portable elsewhere) is itself a lock-in mechanism — be aware this is a real
  incentive at play, not just a UX nicety.
- **Operating System** — end state: *"I run my [brokerage] business on ScoutIt."*

Evaluation rule for any proposed CRM feature: does it improve at least one of
Entry/Dependency/Workflow-Centralization/Network-Lock-in/Intelligence-Quality? If not,
deprioritize.

The doc's "fangs" concept applies directly here: a fang is a high-impact capability hidden behind
a simple interface that makes a user think *"I don't want to leave this platform."* Named
examples directly relevant to a CRM: **AI proposal generator, deal room, close probability
scoring, automated client presentation builder.**

## 3. What already exists (real head start, not a from-scratch build)

A minimal deal-pipeline skeleton already exists — this initiative extends it, it doesn't replace
it:

- **`deals` table (Supabase)** — real rows today, `status` enum-like text
  (`pending`/`invited`/`accepted`/`declined`), gained `unit_id` (FK → `property_units.id`) in the
  2026-07-03 Unit Delegation work. See `04_DATA_AND_SCHEMA/DATA_DICTIONARY.md §3` for the live
  shape.
- **`BrokerMode.js`'s Deal File Workspace** — `activeDealId` state opens a per-deal view with a
  status badge and a notes scratchpad (`dealNotes`). **Gap: `dealNotes` is local React state
  only, never persisted to Supabase** — refreshing the page loses every note. This is the most
  direct, lowest-risk first extension point if the CRM work starts small: persist notes to a real
  table before building anything bigger.
- **`/api/deals/initiate`, `/api/deals/[id]/close`, `/api/deals/[id]/messages`,
  `/api/deals/[id]/schedule`** — deal lifecycle routes already exist (initiate, close, in-deal
  messaging, scheduling). A CRM build should audit these first rather than assume nothing is
  there.
- **`ConciergeAI.js`, `ChatBox.js`** — existing AI/chat-adjacent dashboard components worth
  checking for overlap before building a new "Scout Insight"-style module (see
  `03_DESIGN/DASHBOARD_ATMOSPHERE_FRAMEWORK.md` §2 Layer 3) — a CRM's "follow-up
  recommendations" and the dashboard framework's "Scout Insight" are likely the same underlying
  capability serving two different UI surfaces, not two separate builds.
- **`DelegationRequests.js`** — the existing operator-handshake accept/decline pattern is a
  reasonable structural precedent for a future lead-stage pipeline UI (list + accept/decline +
  detail view), already proven in this codebase.

## 4. Open questions (owner decisions needed before scoping a build)

None of these are answered yet — flagging them here so the next planning conversation starts from
a real list instead of re-discovering them:

1. **Who is this CRM for?** The framework doc implies Broker first (deal pipeline, hot leads,
   close probability are all Broker-framed), but Owner's "manage inquiries" and Service
   Provider's "bookings" are CRM-adjacent too. Single-role first, or shared infrastructure across
   roles from day one?
2. **Lead source.** Does a "lead" in this CRM mean an inbound buyer inquiry
   (`src/app/api/inquiries/route.js` — currently a literal stub, per
   `SESSION_HANDOFF_2026-07-03.md` §4/`PLAN_STAFF_ENTERPRISE_ANALYTICS_NOTIFICATIONS.md`), a
   Connects-spend deal initiation, or both? The inquiries stub being unbuilt is a real blocker for
   any "lead stage" concept that starts before a deal exists.
3. **Scoring/intelligence data source.** "Close probability," "lead scoring," and "market heat
   detection" all need real historical deal-outcome data to be honest numbers rather than
   guesses — same instrumentation dependency already flagged for Scout Insight
   (`DASHBOARD_ATMOSPHERE_FRAMEWORK.md` §7.3). Worth deciding whether an early version ships with
   transparently rule-based scoring (e.g. "3 of 5 profile fields complete") while real ML/stats
   scoring waits for enough data volume.
4. **Scope boundary vs. Mission Control / Enterprise accounts.** A CRM pipeline view sits close
   to the already-approved-but-unbuilt Mission Control / Enterprise-accounts plan
   (`PLAN_STAFF_ENTERPRISE_ANALYTICS_NOTIFICATIONS.md`) — needs a clear line drawn on whether CRM
   pipeline data is per-broker-private, staff-visible (Mission Control), or client-visible
   (Enterprise accounts), rather than assuming one implies the others.
5. **Build sequencing vs. the Dashboard Atmosphere Framework.** These two initiatives were
   handed over together and clearly interlock (Scout Insight ≈ CRM follow-up recommendations,
   Broker's atmosphere = "Tactical Velocity" = pipeline urgency). Recommend treating them as one
   combined planning pass for Broker mode specifically, rather than two independent builds that
   might duplicate the same underlying data/UI.

## 5. Next step

This doc is deliberately a capture-and-flag, not a plan. The next action is a dedicated planning
conversation (owner + AI) that turns §4's open questions into real decisions, then produces a
phased build doc in this same style as `PLAN_STAFF_ENTERPRISE_ANALYTICS_NOTIFICATIONS.md` before
any schema or code gets written.
