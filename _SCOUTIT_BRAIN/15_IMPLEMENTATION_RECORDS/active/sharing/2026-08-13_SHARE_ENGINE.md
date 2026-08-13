---
section: "15_IMPLEMENTATION_RECORDS/active/sharing"
status: active
tags: [sharing, mobile, attribution, viber, messenger, production-verification]
updated: 2026-08-13
related:
  - "[[08_OPERATIONS_AND_BACKLOG/ACTION/00_MASTER_ACTION_PLAN|MASTER ACTION PLAN]]"
  - "[[08_OPERATIONS_AND_BACKLOG/ACTION/MASTER_OWNER_ACTIONS|MASTER OWNER ACTIONS]]"
---

# Implementation Record — Share Engine Rebuild

**Date:** 2026-08-13
**Landed:** `origin/main` in merge `5289be5` (source commits `ce51bc9`, `d36d965`)
**Source work order:** executed root prompt retired after this record absorbed its durable content
**Owner decisions taken this session:** person-level `ref`; promo formats ungated in the share flow; do everything doable in-session.

---

## The headline problem, restated

Two Share buttons existed on a property page and did different things. The
curated one — the only one that used `buildShareText()` — lives inside a
`hidden md:block` container and is invisible at 375px. The mobile bottom bar's
Share button never imported `shareBriefing.js` at all: it scraped
`document.querySelector("h1")` for a title and handed the OS a bare link.

On the phones that carry most Philippine traffic, the curated share engine was
unreachable. Everything below follows from that.

---

## What changed

### New files

| File | Purpose |
|---|---|
| `src/lib/shareAttribution.js` | Per-channel UTM decoration + opaque person-level `ref`. |
| `src/lib/useCuratedShare.js` | The single curated share path, shared by both property flows. |
| `src/lib/__tests__/shareBriefing.test.js` | 24 tests, including the money compliance rule. |
| `src/lib/__tests__/shareAttribution.test.js` | 18 tests, including the "ref never leaks identity" set. |

### Modified files

| File | Change |
|---|---|
| `src/components/layout/BottomNav.js` | Share dispatches `scoutit:property-share` and only falls back to copying a bare link when no curated handler answers. |
| `src/components/property/CommercialFlow.js` | Inline share handler replaced by `useCuratedShare`; `aria-label` added; passes `property` to `ShareModal`. |
| `src/components/property/ResidentialFlow.js` | Same. **Also fixes a latent crash** — see below. |
| `src/components/property/ShareModal.js` | Rebuilt: Viber + Messenger, copy-then-open, attributed per-channel links, GA4 outcome event, the three promo formats, design tokens instead of raw hex. |
| `src/components/property/PromoteModal.js` | "X / WhatsApp" relabelled to "Viber / X"; note added about the server-side gate. |
| `src/lib/shareBriefing.js` | New `briefingShape()`; `buildShareText()` degrades to a compact honest form when no measured specs exist. |
| `src/lib/analytics.js` | `GA_EVENTS.SHARE_COMPLETED`. |
| `src/lib/__tests__/analytics.test.js` | Updated — it asserted an exact list of five events. |

---

## Task-by-task, with evidence

### Task 1 — mobile curated share ✅

`BottomNav` is a global layout component and holds no property data, so it asks
instead of guessing. It dispatches a `CustomEvent` carrying a mutable
`detail.handled` flag; the property flow owns the property object, runs the
curated path, and flips the flag. Listeners are synchronous, so `handled` is
readable on the next line.

**The sample rule survives by construction.** The flows call
`useCuratedShare(d, { enabled: !d.is_sample })`, and when disabled the hook
registers *no listener at all*. A sample listing therefore leaves `handled`
false and falls through to the old bare-link behaviour. Enforcement by absence
is harder to undo by accident than an `if` inside a handler.

**Evidence** — headless Chromium at 375×812, running the exact code
`BottomNav.handleShare` runs:

```
REAL listing:   modalBefore=false  detail.handled=true   modalAfter=true
   copy: "One E-Com Center — Commercial\nMall of Asia Complex, Pasay Ci"
SAMPLE listing: modalBefore=false  detail.handled=false  modalAfter=false
   copy: (none — BottomNav falls back to copying the bare link)
```

### Task 2 — Viber and Messenger ✅ (Messenger partially blocked)

Seven channels now, Viber and Messenger first: `viber://forward?text=`,
`fb-messenger://share?link=`, Facebook, LinkedIn, X, Email, Copy.

**Messenger is deliberately incomplete.** The proper send dialog needs a
Facebook App ID; there is none in this repo (the only `APP_ID` present is
`ALGOLIA_APP_ID`). The app scheme works on a phone with Messenger installed and
does nothing on desktop. Filed as an owner action rather than papered over.

### Task 3 — copy-then-open ✅

Facebook's `sharer.php` accepts only `u=` and discards any text parameter. So do
LinkedIn's share-offsite dialog and the Messenger app scheme. Those three are
flagged `prefill: false`: the briefing is written to the clipboard, a
`role="status"` line says *"Briefing copied — paste it into the Facebook post."*,
and only then does the platform open. Opening still happens if the clipboard is
blocked — a blocked clipboard must not also block the share.

### Task 4 — attribution ✅

Every outbound link now carries
`?utm_source=<channel>&utm_medium=share&utm_campaign=property_share&ref=<code>`,
and the text is rebuilt against that URL so the link *inside* the copy matches
the link the platform receives. Stale parameters are stripped on re-share rather
than stacked.

`ref` is opaque and non-reversible: `"u" + SHA-256(user id)` truncated for
signed-in people, `"v" + random` kept in localStorage for anonymous visitors.
A reader of a public post learns only that the sharer was an account holder or
not, and that two links came from the same sharer. `refLooksSafe()` is the
machine-checkable form of the rule and is tested against emails, UUIDs, and
names.

`SHARE_COMPLETED` fires on the **outcome** — clipboard resolved, OS sheet
resolved, or platform window opened. An `AbortError` from a dismissed share
sheet is correctly not counted.

### Task 5 — thin briefings ✅ + the data answer

`briefingShape()` returns `compact` when `factSpecs()` is empty. The compact form
drops the "MARKET INTELLIGENCE BRIEFING" header and the "complete operational
briefing" promise, and states only what is true. **Nothing is invented to reach
the richer shape** — that is asserted by test.

**Measured against the live Airtable base (`appWFRqR0wy6hSR6h`), 2026-08-13:**
of the **7 approved listings, exactly 1 lacks a floor area** — One E-Com Center.
It is the only listing that falls to the compact shape. The other six each carry
at least one measured spec.

### Task 6 — one entry point ✅

`buildPromoPack()`'s three formats now appear inside `ShareModal` under a
collapsible "Ready-to-post formats", each with its own copy button, **ungated**
per the owner's ruling.

⚠️ **Nothing was un-gated server-side.** These are the deterministic formats
built client-side from the listing's own recorded facts — no API call, no key,
no tier resolution. The AI route `/api/ai/promote` keeps its server-side tier
check, which §45 deliberately moved out of the UI, and is open to everyone today
anyway while `pre_launch_free_mode` is on. Re-adding a client-side gate would
recreate the exact hole §45 closed.

### Task 7 — tests ✅

42 tests, all passing.

```
 Test Files  3 passed (3)
      Tests  42 passed (42)
   Duration  2.68s
```

One test caught a real mistake in my own work: the money-detection regex started
as "any 4+ digit number", which flagged `1500 sqm`. A rule that fails honest copy
gets loosened until it catches nothing, so it was narrowed to currency symbols,
currency words, comma-grouped amounts, and cents — and documented as such.

### Task 8 — small ✅

`aria-label="Share this property's briefing"` on both curated Share buttons;
`role="dialog"` + `aria-modal` on the modal; labels on every channel tile and
copy button. `ShareModal` also moved off raw hex (`#E8AE3C`, `#0a0a0a`) onto the
design tokens, per the AGENTS.md rule.

---

## Two findings the work order did not contain

1. **`ResidentialFlow.js` had a latent crash.** It called `buildShareText(d, cleanUrl)`
   at line 2288 but **never imported it** — clicking Share on any residential
   listing would throw a `ReferenceError`. The refactor removes the call
   entirely, so it is fixed, but it means residential share was broken on
   *desktop* too, not just mobile.

2. **`UnitMasterPage.js` has dead share state.** It imports `buildShareText`,
   declares `shareTextOpen`, and renders `ShareModal` — but nothing ever calls
   `setShareTextOpen`, so that modal is unreachable. Left untouched (out of
   scope, and unit pages are not matched by the bottom action bar's
   `^/property/<slug>$` route). Worth a decision: wire it up or delete it.

---

## Verification method, production follow-up, and limits

- **Full repository checks:** the follow-up terminal session ran lint successfully
  after the minimal React Compiler exclusion in `d36d965`, then ran **1057/1057
  unit tests across 98 files**. The earlier isolated 42/42 result is therefore no
  longer the highest available evidence.
- **Layout:** rendered against the repo's **real compiled Tailwind** (its own
  `tailwind.config.js` + `globals.css`) at 375×812. `document.scrollWidth` is
  375 in every state, including with the formats expanded — no horizontal
  overflow.
- **Production commercial listing:** after merge, the real mobile bottom-bar
  Share action opened the curated modal; Viber and Messenger appeared first;
  ready-to-post formats expanded without horizontal overflow.
- **Sample branch:** verified locally to leave `detail.handled === false` and
  avoid opening the curated modal, preserving bare-link fallback.
- **Correction on the record:** an earlier overflow measurement of 616px was an
  artefact of a harness that had failed to load any CSS. With real CSS both
  `break-words` and `overflow-wrap:anywhere` hold the line. The comment in
  `ShareModal.js` was rewritten to say what was actually measured.

Still open because the previous session ended at its usage limit: verify a real
residential property in production, verify one attributed outbound URL plus the
copy-then-open clipboard notice, decide the dead Unit Master Page share state,
and add the desktop Messenger send-dialog branch only after a real Facebook App
ID exists.
