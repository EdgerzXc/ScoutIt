# Using _SCOUTIT_BRAIN as your Obsidian vault

> You don't need to build a knowledge base — you already have one. This whole `_SCOUTIT_BRAIN`
> folder is plain Markdown, which is exactly what Obsidian reads. Point Obsidian at it and your
> business brain becomes a connected, searchable, visual map. Here's how.

---

## 1. Open it (5 minutes, one time)

1. Download **Obsidian** (free) from obsidian.md.
2. "Open folder as vault" → choose:
   `C:\Users\jerze\ScoutIt\_SCOUTIT_BRAIN`
3. That's it. Every doc is now a note. `00_START_HERE.md` is your home page.

> Obsidian only reads files — it won't touch the website or the code. It's a safe reading/writing
> layer on top of the same folder. When an AI session updates a brain doc, it shows up in Obsidian
> automatically (and vice-versa).

---

## 2. The one habit that makes it powerful: `[[links]]`

In any note, wrap another note's name in double brackets to link them:

- `[[00_SOP]]` → links to the operating SOP.
- `[[BRAND_VOICE_AND_COPY_SOP]]` → links to the voice rules.
- `[[ORIGIN_STORY_SCROLLYTELLING]]` → links to the parked scrollytelling spec.

Type `[[` and Obsidian autocompletes from your existing notes. Over time these links form a **graph**
(Graph View, left sidebar) — a literal map of how every part of the business connects. That's the
"never lose our way" picture, visual.

---

## 3. The structure you already have

```
00_START_HERE.md        ← the map + 30-second cheat sheet (home)
00_SOP.md               ← how we work each turn (the operating contract)
00_COUNCIL.md           ← the decision panel (5 seats + specialists + Council Pro)
MASTER_CONTEXT.md       ← the single-file complete project bible
01_IDENTITY_AND_VISION/ ← what ScoutIt is, the bible, future ideas
02_ARCHITECTURE…/       ← tech, folder map, AI rules
03_DESIGN/              ← visual DNA + BRAND_VOICE_AND_COPY_SOP
04_DATA_AND_SCHEMA/     ← Airtable + Supabase schemas, data SOPs, rebuild guide
05_AUTOMATIONS/         ← listing engine, PDF extractor specs
06_MONETIZATION/        ← tiers, Connects, pricing
07_FEATURES_AND_FLOWS/  ← user journeys, the parked scrollytelling spec, handshake-chat spec
08_OPERATIONS…/         ← build order, fix list, session handoffs
```

---

## 4. Suggested light workflow (don't over-engineer it)

- **Start any work session** by opening `00_START_HERE` → then the latest session handoff in `08_…`.
- **Big decision?** Open `00_COUNCIL`, convene the relevant seats (or ask the AI to), and **write the
  ruling into the relevant doc** so it's never re-litigated.
- **New idea?** Drop it in `01_IDENTITY_AND_VISION/NEW_IDEAS.md` so it isn't lost.
- **Something changed in the product?** Update the matching brain doc the same day (SOP rule #8).
- Optional Obsidian plugins worth it later: **Daily Notes** (a dated log of what happened each day)
  and **Kanban** (a simple board for the backlog). Core app is enough to start.

---

## 5. The golden rule (same as the code)

**The running code + live data always win over any document.** These docs are the plan and the
memory — but when a doc and reality disagree, fix the doc. Keeping this vault honest is what makes it
trustworthy. A wrong SOP is worse than no SOP.

---

## 6. SOP index (your "how do we do X" compass)

| Need to know how to… | Read |
|---|---|
| Work a session without breaking things | `00_SOP.md` |
| Make a product/UX decision | `00_COUNCIL.md` |
| Write or edit any copy | `03_DESIGN/BRAND_VOICE_AND_COPY_SOP.md` |
| Enter property data correctly | `04_DATA_AND_SCHEMA/SCOUTIT_AIRTABLE_SOP.md` + `PROPERTY_CATEGORY_SOP.md` |
| Rebuild Supabase after the reset | `04_DATA_AND_SCHEMA/SUPABASE_REBUILD_GUIDE.md` |
| Understand the whole project fast | `MASTER_CONTEXT.md` |
| Resume the parked origin scrollytelling | `07_FEATURES_AND_FLOWS/ORIGIN_STORY_SCROLLYTELLING.md` |
| Build the broker handshake/chat (after reset) | `07_FEATURES_AND_FLOWS/BROKER_HANDSHAKE_CHAT.md` |
