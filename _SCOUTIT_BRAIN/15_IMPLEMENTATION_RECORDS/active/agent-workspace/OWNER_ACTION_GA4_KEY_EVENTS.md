---
section: "15_IMPLEMENTATION_RECORDS/active/agent-workspace"
status: active
date: 2026-08-14
type: decision-record
report-state: owner-action-required
task-id: T0-AGENT-SAFE-HARDENING-BATCH-1-2026-08-14
tags: [owner-action, agent-workspace, analytics, ga4, key-events]
updated: 2026-08-14
ai-first: true
related: ["[[TASK_T0_AGENT_SAFE_HARDENING_BATCH_1]]", "[[00_MASTER_ACTION_PLAN]]"]
---

# Owner Action: Mark GA4 Conversion Outcomes as Key Events

## 1. Overview & Code Delivery

In accordance with `TASK_T0_AGENT_SAFE_HARDENING_BATCH_1.md` Stage 5, the ScoutIt client application emits six core conversion outcome events with automated client-side PII sanitization via `src/lib/analytics.js`:

1. **`signup_completed`**: Dispatched upon successful onboarding completion.
2. **`board_save`**: Dispatched when a property is saved to a user's board.
3. **`inquiry_sent`**: Dispatched when a deal intro or broker inquiry is submitted.
4. **`connect_spent`**: Dispatched when Connects are deducted for a pitch or handshake.
5. **`property_published`**: Dispatched when a listing is published.
6. **`share_completed`**: Dispatched when a listing URL is copied, shared via Web Share API, or launched to external channels.

All events pass through `sanitizeAnalyticsParams()`, ensuring zero contact details (emails, phone numbers, names, or messages) reach GA4.

## 2. Required Owner Action in Google Analytics Console

Because code can only dispatch events, marking these events as conversion **Key Events** requires owner action within the Google Analytics Admin Console:

1. Log into **[Google Analytics](https://analytics.google.com/)** for the property configured under `NEXT_PUBLIC_GA_ID`.
2. Navigate to **Admin** (gear icon in lower left) -> **Data display** -> **Events**.
3. Locate each of the 6 events in the list:
   - `signup_completed`
   - `board_save`
   - `inquiry_sent`
   - `connect_spent`
   - `property_published`
   - `share_completed`
4. Toggle the switch in the **Mark as key event** column to **ON** for each event.
5. (Optional) If an event has not yet been triggered in live traffic, click **Create event** or **Add key event** and type the exact event name.
