# Feature Spec — Connect → Chat → Handshake → Represent

> Status: **DESIGNED, not yet built.** Locked in this session (2026-06-26).
> Build target: **after the Supabase reset + Supabase Auth + Realtime are live** (needs real identities and live updates — see Dependencies).
> Owner decisions locked: two-key handshake · multiple brokers per property · design-now/build-after-reset.

---

## 1. What it is (plain language)

After an owner and a broker **connect** (the handshake already costs 1 Connect today), a **chatbox opens** between them. They talk. If both are happy, **each sends the handshake gesture** — a two-handed confirm. A gold animation fires, and the relationship becomes **linked**:

- the property now appears on the **broker's public profile** as one of their listings, and
- the broker appears in the owner's **verified brokers** for that property.

This is the human "initiation rite" that turns a cold connection into a working representation — without ScoutIt ever brokering the transaction itself (RA 9646: *Intelligence First. Transactions Never.*).

---

## 2. The state machine

```
connected ──► chatting ──► handshake_offered ──► linked
     │            │              │                  │
     │            │              └──(declined)──► chatting
     └────────────┴──────────────────────────► (either party can walk away)
```

| State | Meaning |
|---|---|
| `connected` | A Connect was spent; the deal exists; chat is open but empty |
| `chatting` | At least one message exchanged |
| `handshake_offered` | One party tapped the gesture; waiting on the other (TWO-KEY) |
| `linked` | Both confirmed → `PROPERTY_BROKERS` flipped to active → animation fired |
| `declined` | Other party declined the gesture → returns to `chatting` |

**Two-key rule (locked):** the link only happens when **both** `owner_confirmed` AND `broker_confirmed` are true. Either party may offer; the other must accept. Like a real handshake, it takes two hands.

---

## 3. Data model

### `deals` (Supabase — extend the existing table)
Already the "broker pitch / handshake workspace." Add:

| Column | Type | Notes |
|---|---|---|
| `relationship_status` | text | connected \| chatting \| handshake_offered \| linked \| declined |
| `handshake_offered_by` | text | user_id of whoever offered the gesture |
| `owner_confirmed` | boolean | default false |
| `broker_confirmed` | boolean | default false |
| `linked_at` | timestamptz | set when both confirm |

### `deal_messages` (Supabase — NEW table)
```sql
create table deal_messages (
  id          uuid primary key default gen_random_uuid(),
  deal_id     uuid not null references deals(id) on delete cascade,
  sender_id   text not null,                 -- user_id (text until Auth → uuid later)
  sender_role text not null,                 -- owner | broker
  body        text not null,
  created_at  timestamptz default now(),
  read_at     timestamptz
);
create index on deal_messages (deal_id, created_at);
alter table deal_messages enable row level security;
-- HARDEN AT LAUNCH: only the two parties of the parent deal may read/insert.
create policy "dev open" on deal_messages for all using (true);
```

### `PROPERTY_BROKERS` (Airtable — existing)
On `linked`, create/activate the record (status = active/represented, linked_at). This is the table the broker profile and the owner's verified-brokers list already read from — so once it's active, the listing surfaces on both sides automatically. **Multiple brokers per property is allowed** (locked) — one `PROPERTY_BROKERS` row per (property, broker); ties into the per-tier listing caps in the pricing model.

---

## 4. What each side unlocks on `linked` (the "access they need from each other")

| Owner gains | Broker gains |
|---|---|
| Broker added to the property's verified-brokers list | Property appears on their public profile as a listing |
| Broker contact + Scout Rating visible | Routed the inquiries/leads for that property |
| Can route inquiries to this broker | Shown as "Represented by" on the property page |

**Edit rights (v1 proposal):** the listing stays **owner-owned** — the broker represents and is visible, but does not edit the listing unless the owner later grants co-edit (future). Confirm before build.

---

## 5. Guardrails (locked invariants — do not violate)

- **Representation ≠ Scout Rating.** Being listed as a verified broker on a property is visibility only. **Scout Rating is earned by verified closures ONLY** — never granted by a handshake. Keep these two completely separate in UI and data.
- **Connects:** connecting already costs 1 Connect (existing `invite/route.js` / pitch flow). The handshake gesture itself is **free** (it's the culmination, not a new paywall). — confirm.
- **Transactions Never:** the chat is for coordination and trust-building, not for ScoutIt to facilitate or take a cut of the sale.

---

## 6. API routes (build post-reset, server-only, service-role)

- `POST /api/deals/[id]/messages` — send a message (validates the sender is a party to the deal)
- `GET  /api/deals/[id]/messages` — list thread (paginated)
- `POST /api/deals/[id]/handshake` — body `{ action: "offer" | "accept" | "decline" }`; sets the confirm flags; when both true → set `linked`, stamp `linked_at`, write `PROPERTY_BROKERS`, return the linked payload so the client can fire the animation.

All writes through API routes only (never client INSERT) — consistent with the locked Connects rule.

---

## 7. UI pieces

- **ChatBox** — lives in the dashboard deal view (and/or a slide-over). Message list + composer. Shows the other party's name/role + Scout Rating (read-only).
- **Handshake gesture** — a prominent button: "Offer handshake 🤝". After offering, shows "Waiting for {other party}…". The receiver sees "Accept handshake / Decline".
- **The animation** — gold (now `#E8AE3C`) two-hands-meet / seal moment on mutual confirm. Brief, cinematic, on-brand. Respects **Lite Mode** (skip the animation when lite).
- **Linked state** — chat stays open; a banner "You're linked — this property now appears on {broker}'s profile."

---

## 8. Realtime

- **Live chat + state:** Supabase Realtime subscriptions on `deal_messages` (insert) and `deals` (update). Requires Supabase Auth for per-user identity + RLS.
- **Fallback** if ever built before Realtime: short-interval polling on the two endpoints.

---

## 9. Dependencies / blocked-on (why "build after reset")

1. **Supabase reset** complete (run `SUPABASE_REBUILD_GUIDE.md`, add `deal_messages` + the new `deals` columns).
2. **Supabase Auth** — chat needs real, attributable identities (not the `usr-…` localStorage mock) for sender attribution + RLS.
3. **RLS hardening** — message rows must be readable only by the two parties of the parent deal (PII + private comms).
4. **Realtime enabled** on the project.

Until then: spec is frozen here; no half-built chat on a dev-open database.

---

## 10. Build checklist (when unblocked)

- [ ] Add `deal_messages` table + new `deals` columns to `SUPABASE_REBUILD_GUIDE.md`, run SQL
- [ ] `POST/GET /api/deals/[id]/messages`
- [ ] `POST /api/deals/[id]/handshake` (two-key → PROPERTY_BROKERS write)
- [ ] ChatBox UI + composer
- [ ] Handshake gesture + Lite-Mode-aware animation
- [ ] Realtime subscriptions (+ polling fallback)
- [ ] RLS: parties-only read/write on `deal_messages`
- [ ] Safety: report/block, basic rate-limit on send
- [ ] Verify: linked property shows on broker profile + owner verified list; Scout Rating untouched

---

## 11. Still to confirm before build

- Handshake gesture free vs costs a Connect? (proposed: free)
- Broker edit rights on a linked listing? (proposed: owner-only for v1)
- Unlink flow — can either party end representation, and does the listing drop off the broker profile? (proposed: yes, either party; status → ended)
- Multiple brokers display on the property page — list all "Represented by", or owner picks a primary? (proposed: list all)
