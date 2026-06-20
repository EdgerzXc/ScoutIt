# ScoutIt — Automations

Home for every ScoutIt automation **spec** (the design/playbook for each one).
Specs live here first; runnable implementations (skills, app code, Airtable
automations, watchers) get built *from* these specs. Update the spec before changing
the implementation, so this folder never drifts from reality.

> Read alongside `../docs/AIRTABLE_IMPLEMENTATION_PLAN.md` (the data model) and
> `../SCOUTIT_BIBLE.md` (the brand rules every automation must respect).

---

## Registry

| Automation | Spec | Engine | Status |
|---|---|---|---|
| **Listing Engine** (PDF → researched, council-reviewed listing) | [LISTING_ENGINE.md](LISTING_ENGINE.md) | AI council + Arbiter (Stage 2) | Spec'd · not built |
| PDF → fields extractor (the simple foundation of the above) | [INGEST_EXTRACTOR.md](INGEST_EXTRACTOR.md) | Claude, interactive | Spec'd · ready to test (Phase 1) |
| Board ranking refresh | _TBD_ | Rules (Airtable automation / app) | Planned |
| Auto-email / notifications | _TBD_ | Rules (Airtable automation) | Planned |
| Verification & re-check (double-system) | _TBD_ | AI + rules, escalating | Planned |

---

## Shared principles (apply to every automation here)

1. **AI only for judgment; rules for everything else.** Ranking, emails, timestamps =
   deterministic automations. Reading/extracting/assessing = AI. Never pay AI to do math.
2. **No source → no fact.** Nothing is auto-filled unless it can be extracted or cited.
   A confident guess is the one output ScoutIt cannot ship ("the signals are real").
3. **Layers must fail differently.** Redundant checks only help if they're different in
   nature (AI generator → deterministic rule validator → AI critic → human).
4. **Human is the final gate.** Everything lands **unapproved** in the Mission Control
   Approval Queue. Automations draft and verify; people approve.
5. **Expensive once, cheap after.** Heavy AI work runs at creation; updates are light.
6. **Cost rides on monetization.** User-facing AI features are gated to paid tiers, so
   the AI spend sits behind a paying customer.
