# New-Session Kickoff Prompt — Full Context Load, No Shortcuts

> Paste the block below into a fresh ScoutIt session. Updated 2026-07-03 after the owner said
> directly: "it is getting annoying when there is failure on coding because it keeps shortcutting
> things and not knowing everything first." This version makes full context-loading the explicit
> first step, not an assumption — see the saved memory `working-style-and-deploys.md` for why.

---

# ═══════ PASTE FROM HERE ═══════

You are resuming work on **ScoutIt** — the Philippines' first spatial commerce platform. This is a
**modified Next.js 16.2.7** app (App Router, Turbopack) — APIs may differ from your training data.

## Step 0 — Load full context. Do not skip or skim any part of this. No shortcuts.

This is not optional and not a formality. Recent coding mistakes (inventing a "50-year" flood
dataset that doesn't exist; briefly misdiagnosing a real, already-designed QuestIT schema as
"unbuilt" because a search wasn't thorough enough) came directly from acting on partial or
remembered context instead of actually checking the current state first. Do the following in
order, completely, before writing a single line of code:

1. **Use the `obsidian-second-brain` skill on the real vault at `C:\Users\jerze\my-vault` — read
   it for real, don't skim it.** If the vault's ScoutIt notes look stale against what you find in
   the repo, refresh them (`/obsidian-architect` or equivalent) before relying on them, so the
   next session doesn't inherit the same staleness.
2. `_SCOUTIT_BRAIN/00_START_HERE.md` — the map.
3. `_SCOUTIT_BRAIN/NEXT_DAY_HANDOFF.md` — the resume pointer.
4. `_SCOUTIT_BRAIN/08_OPERATIONS_AND_BACKLOG/SESSION_HANDOFF_2026-07-03.md` — **read the whole
   file, not just the top "RESUME HERE" block.** Part 5 specifically lists work that was built
   but never verified in a browser because of a tool outage — treat every claim in it as unproven
   until you've checked it yourself.
5. `_SCOUTIT_BRAIN/SCOUTIT_MASTER_BUILD_SPEC.md` — §3 (Mission Control) and §9 (Unit Delegation,
   built) at minimum; skim the rest for anything relevant to what you're about to touch.
6. `_SCOUTIT_BRAIN/08_OPERATIONS_AND_BACKLOG/PLAN_STAFF_ENTERPRISE_ANALYTICS_NOTIFICATIONS.md` —
   the approved plan for Mission Control / Enterprise / analytics / notifications / Google Sign-In.
7. Before touching any *specific* feature area (a component, a table, an API route), grep and
   read the actual current source for that area. Don't assume a doc is still accurate without
   checking the running code against it — this repo's own rule is code + `_SCOUTIT_BRAIN` win over
   anything else, always.
8. Cross-check anything schema-related against the live Airtable base (`appWFRqR0wy6hSR6h`) and
   live Supabase project (`yyixsuaimdzyiocswcgc`) directly — don't trust a doc's field list without
   confirming it.

Only after all of that: confirm in plain language that you're up to speed, and say what you found
that was stale or different from what the docs claimed, if anything.

## Step 1 — Current state (verify each claim, then trust it)

- **Solid, verified, live on both `scoutit.vercel.app` and `scout-it.vercel.app`:** everything
  through commit `c9c17dd`. This includes Unit Delegation & Co-Working Operators (§9, fully
  built + E2E-verified), Track 1 Notifications (persisted bell, stale-listing cron,
  broker-on-change alerts), the QuestIT documentation correction (it's a real future platform,
  explicitly parked, don't touch — see `_SCOUTIT_BRAIN/QUESTIT_FUTURE/README.md`), and 5 fixed
  E2E test failures (all pre-existing test/config drift, none were real app bugs).
- **Unverified — built but never checked in a browser, because of a tool outage mid-session (Part
  5 of the session handoff):**
  1. Footer audit fixes (`src/components/layout/Footer.js`) + new `src/app/enterprise/page.js`.
  2. A Mission Control dev-preview (`src/components/dashboard/MissionControlMode.js`) with a
     staff lens (near-global property access) and an enterprise lens (scoped to own portfolio),
     reachable only via a new section in the dev toolbox (`src/components/ui/FloatingToolbox.js`)
     — **explicitly not production-safe**, real Enterprise isolation still needs the RLS reset.
  3. NOAH historical flood-risk range tabs (`src/components/property/FloodHeatmapMap.js`) — 5-yr/
     25-yr/100-yr, matching NOAH's real published return periods (there is no 50-year dataset).
     **Unconfirmed whether the 5yr/25yr PMTiles files actually exist** at the same Hugging Face
     path as the working 100yr one — check this before trusting the new tabs work.
  4. Six fully-populated master mock properties (one per category) — **not started at all**, fully
     scripted and ready to run: `_tmp-master-properties.js` + `_tmp-deepintel-schema.json` at the
     repo root (throwaway, delete after running).
- Verify all four Part-5 items for real before building anything further on top of them, and
  before committing or asking to push.

## Step 2 — Non-negotiable rules (break these and you break the product)

- **Design DNA:** ~95% dark / ~5% gold, **CSS variables only, never raw hex** (`--accent #E8AE3C`,
  `--accent-bright #F7C64E`, `--accent-muted #6E531A`). Count the gold before adding more.
- **Dual-CMS:** Airtable = public read-only via the one proxy `src/app/api/cms/route.js`. Supabase
  = private user state. Never mix, never call Airtable from the client.
- **Never invent data** — no source → blank field, never a plausible-sounding guess. This applies
  to flood-risk numbers, financial figures, and now confirmed to apply to external API filenames
  too (verify a resource exists before hardcoding a URL to it).
- **Never push to `main`/Vercel without the owner's explicit say-so**, every time, even if a prior
  push was approved — approval doesn't carry forward automatically. The owner is non-technical —
  explain in plain language.
- **RLS is still effectively disabled on 15+ Supabase tables — deliberately parked.** Don't build
  Enterprise-accounts data isolation, and don't "fix" this as a drive-by; it's its own future reset.
- **QuestIT is explicitly off-limits** unless the owner says otherwise — see
  `_SCOUTIT_BRAIN/QUESTIT_FUTURE/README.md` before touching anything with "questit" in the name.
- Mission Control and real Enterprise accounts (beyond the existing dev-preview) each still need
  their own dedicated session — don't casually expand either mid-task.

## Step 3 — Then, before building anything new

Report back what you verified from Step 1's unverified list (what worked, what didn't), fix
anything broken, run the master-properties script, and only then ask the owner what's next —
don't assume the plan below is still the priority without checking.

# ═══════ END — STOP COPYING HERE ═══════

---

*If you want a tighter or broader scope for the next session, edit Step 1/Step 3 before pasting.*
