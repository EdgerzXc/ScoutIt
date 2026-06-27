# New-Session Kickoff Prompt — Launch Readiness

> Paste the block below into a fresh ScoutIt session to get the agent fully up to speed on the
> whole project and pointed at **launch readiness**. It tells the agent what to read, what's
> already done, what's off-limits (security is parked), and to come back with a prioritized plan
> before building. Saved 2026-06-27.

---

# ═══════ PASTE FROM HERE ═══════

You are resuming work on **ScoutIt** — the Philippines' first spatial commerce platform. This is a
**modified Next.js 16.2.7** app (App Router, Turbopack) — APIs may differ from your training data.

## Step 1 — Read everything before doing anything

Read these, in order, and treat the **running code + live data as the source of truth over any
doc** (verify, don't assume):

1. `_SCOUTIT_BRAIN/00_START_HERE.md` — the map
2. `_SCOUTIT_BRAIN/00_SOP.md` — how we work each turn (the operating contract)
3. `_SCOUTIT_BRAIN/00_COUNCIL.md` — the decision panel for product/UX calls
4. `_SCOUTIT_BRAIN/MASTER_CONTEXT.md` — the single-file complete project bible
5. `_SCOUTIT_BRAIN/01_IDENTITY_AND_VISION/SCOUTIT_BIBLE.md` — what ScoutIt *is*
6. `_SCOUTIT_BRAIN/08_OPERATIONS_AND_BACKLOG/SESSION_HANDOFF_2026-06-27.md` — the latest resume point
7. `_SCOUTIT_BRAIN/08_OPERATIONS_AND_BACKLOG/PRE_LAUNCH_BUILD_LIST.md` — the confirmed build queue
8. Key code: `src/lib/entitlements.js` (gating source of truth), `src/context/DashboardContext.js`
   (dashboard state), `src/app/api/cms/route.js` (Airtable proxy), `src/components/dashboard/OwnerMode.js`
   (owner dashboard + Concierge + Vault wizard), `src/app/globals.css` (design tokens).

Then confirm in plain language that you're up to speed.

## Step 2 — Current state (verify, then trust)

- Latest pushed commit is `c676ec7` (hero CTA refined to amber + a "not yet legally reviewed" draft
  banner on the legal pages). Confirm you have it (`git log --oneline -3`). Both Vercel projects
  (`scoutit` and `scout-it`) auto-deploy `main`.
- **Legal pages (`/terms`, `/privacy`) are DRAFTS** currently being reviewed by a PH AI lawyer. When
  the revised text comes back, drop it into `src/app/{terms,privacy}/page.js` (the pages are
  data-driven via `src/components/legal/LegalDoc.js`) and update the effective date + draft banner.
- **`GEMINI_API_KEY` is unset** (owner's small to-do) — the listing tools work mechanically but fall
  back to dumb keyword mapping without it.

## Step 3 — The mission: LAUNCH READINESS (non-security)

North star: **200 real, approved listings before monetization.** Build the arena before the
gladiators. Your lane is **everything EXCEPT security** — the security overhaul (Supabase reset,
real Auth, RLS, token rotation, Connects Edge Functions, input validation) is **PARKED on purpose**
as one deliberate final pass. **Do not start it. Keep any data-layer touch additive and reversible.**

Likely launch-readiness work (confirm/re-prioritize with the owner — don't assume):
- **Public-site polish / "nothing looks broken or fake":** extend the discover image-fallback
  pattern site-wide; fix the guest-visible dashboard demo state (a logged-out visitor lands on a
  seeded "15 Connects" dashboard — gate it or make it read as a preview); sweep for any other
  fake/placeholder-looking surfaces.
- **Claude editorial descriptions (the SEO/brand moat):** after extraction, pass the structured
  payload to Claude to write the honest, compelling property write-up. Needs `ANTHROPIC_API_KEY`.
  Most on-strategy feature.
- **Owner editor / publish flow:** verify upload → draft → review → Publish → Airtable mirror is
  smooth end-to-end.
- **Getting toward 200 listings:** reduce friction in the listing/intake flow (PDF concierge + CSV
  importer are proven; make them effortless).
- **Founding-cohort badges**, **Mapbox geocode write-back** (before listing count passes ~50), and
  the manual Airtable `Active_Listings_Count` rollup.
- Deferred unless the owner asks: payments (after 200 listings), email, the in-app buyer Concierge /
  vector search, QuestIT standalone.

## Step 4 — The non-negotiable rules (break these and you break the product)

- **Design DNA:** ~95% dark / ~5% gold, **CSS variables only, never raw hex** (`--accent #E8AE3C`
  amber, `--accent-bright #F7C64E`, `--accent-muted #6E531A`). Count the gold before adding more.
- **Dual-CMS:** Airtable = public read-only via the one proxy `src/app/api/cms/route.js`. Supabase =
  private user state. **Never mix**, never call Airtable from the client.
- **Never invent property data** — no source → blank field (a blank is honest; a fake value is not).
- **Never push to `main`/Vercel without the owner's explicit say-so.** The owner is non-technical —
  explain in plain language. `main` must always be deployable (`next build` is the gate).
- **Connects writes go through API routes only** (service role), never client-side. **Scout Rating =
  verified closures only.** Tailwind allowed in dashboards; public site stays vanilla CSS.
  Three.js/WebGL backgrounds allowed but must degrade via Lite Mode. The UFO stays.

## Step 5 — Then, before building

Convene the relevant Council seats, produce **one prioritized launch-readiness punch list** (smallest
additive changes first, public-trust items before deep features), show it to the owner, and ask which
to start. Verify (build + a quick check) before proposing any push, and tell the owner plainly what
changed and what's next.

# ═══════ END — STOP COPYING HERE ═══════

---

*If you want a tighter or broader scope for the next session, edit Step 3 before pasting.*
