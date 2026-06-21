# ScoutIT — Schematics

> Visual maps of how ScoutIT fits together. One diagram per system. Each `.svg` opens in any
> browser / the file viewer. Keep them in sync with reality (the code/live data win) — update the
> diagram when the system changes. Pair each with its detailed spec elsewhere in `_SCOUTIT_BRAIN`.

## Index

| # | Schematic | File | Status | Detailed spec |
|---|---|---|---|---|
| 1 | **Mission Control** (founder cockpit: supply → gate → public + 6 zones) | `mission-control.svg` | ✅ done | `08_OPERATIONS_AND_BACKLOG/MISSION_CONTROL_SOP.md` |
| 2 | Dual-CMS architecture (Airtable ↔ app ↔ Supabase, where each datum lives) | _todo_ | ⏳ | `04_DATA_AND_SCHEMA/` |
| 3 | Connects economy + handshake (initiator pays; broker / owner / quest) | _todo_ | ⏳ | `06_MONETIZATION/CONNECTS_AND_BROKER_HANDSHAKE.md` |
| 4 | Listing pipeline (wizard / concierge PDF → draft → approve → live) | _todo_ | ⏳ | `NEXT_DAY_HANDOFF.md` |
| 5 | Owner editor flow (live page → section edit → Draft → Publish gate) | _todo_ | ⏳ | `07_FEATURES_AND_FLOWS/USER_EXPERIENCES.md` |
| 6 | QuestIT (raise → nudge/Guild → fulfill → verify → fill) | _todo_ | ⏳ | (decisions in `NEXT_DAY_HANDOFF.md §2`) |
| 7 | Persona map (the 6 user types + their dashboards) | _todo_ | ⏳ | `07_FEATURES_AND_FLOWS/USER_EXPERIENCES.md` |

## Conventions
- Dark canvas (`#0e0e0e`), warm off-white text (`#f0ede8`), gold accent (`#ffb800`) for the key
  step/flow — matches the brand (95% dark / 5% gold).
- Sparse boxes; detail lives in the linked spec, not the diagram.
- Filename = kebab-case of the system (`mission-control.svg`).
