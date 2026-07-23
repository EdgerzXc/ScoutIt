# ScoutIt — Work Split: Claude Code vs Cowork (Claude)

_Purpose: divide the ScoutIt / Master Mission Control work between the two AI helpers so nothing is
done twice or dropped. Last updated 2026-07-23._

There are two assistants working on ScoutIt:

- **Claude Code** — runs on your computer, inside the repo. It can run the local dev server, edit
  and build code, run the browser to verify, and deploy via the Vercel CLI. **All code and
  deployment work lives in this lane.**
- **Cowork (Claude)** — the desktop assistant (this one). It can reach your LIVE Supabase database
  directly, read the whole codebase, check security, and write specs/prompts. **Database changes,
  planning, and prompt-writing live in this lane.**

Shared guardrails both must follow: don't `git commit/push` in the `mission-control` repo without
your explicit go-ahead; `SUPABASE_SERVICE_ROLE_KEY` stays server-only; never delete sample/example
data (needed for human testing); RA 9646 display-only on the public site; respect the dual-CMS rule
(Airtable = public content, Supabase = private state).

---

## 🖥️ CLAUDE CODE LANE — the queue (only Claude Code can do these)

Each item has a dedicated, ready-to-paste prompt file where noted. Run Claude Code inside the repo,
local dev on port 3001: `npm --prefix mission-control run dev -- --port 3001`.

### Already done (preserve — do not revert)
- End-user auth moved to real Supabase sessions (main site).
- Personal Ledger → account merge feature (main site).
- Master Mission Control deployed to Vercel (`mission-control-sigma-one-89.vercel.app`).
- In `mission-control/`, these were rewritten and must be kept/restyled, not reverted: Overview
  (live data), Feature Flags (uses `feature_flags`, NOT `feature_gates`), Notifications
  (`private_notifications`), Concierge Ingest (`dashboard/media` + `lib/ingestSchema.js`).

### Next (in priority order)
1. **Run local dev + verify / debug "can't click."** Confirm every sidebar route loads for the
   Tier-3 founder, check the devtools console for hydration errors, confirm the top cards are just
   non-interactive (not a bug). → `HANDOFF_PROMPT_RUN_MISSION_CONTROL_LOCAL.md`
2. **Visual redesign + instant navigation.** Gold-on-black ScoutIt DNA, dense/scannable; add
   `loading.js` skeletons, `error.js` boundaries, `<Suspense>` streaming, client-side active-route
   sidebar; define the gold token system in `globals.css`. → `HANDOFF_PROMPT_REDESIGN_MISSION_CONTROL.md`
3. **Metrics redesign** — real bar charts + Daily/Weekly/Monthly toggle. → `HANDOFF_PROMPT_METRICS_AND_IP_GUARD.md` (Feature 1)
4. **Masked IP Anomaly Guard — Phase 1 (safe):** the Mission Control "Security" HUD (flagged hashed
   IPs + 1-click block/unblock via the existing `blocked_access` list). → `HANDOFF_PROMPT_METRICS_AND_IP_GUARD.md` (Feature 2, Phase 1)
5. **Masked IP Anomaly Guard — Phase 2 (GATED):** wire the hashing/logging/blocking into the main
   site's `src/middleware.js`; add `IP_SALT` env var. **Only after your explicit go-ahead** — it
   sits in the live public request path. → same file, Phase 2

### Later (future Master Mission Control modules — from the blueprint, not yet spec'd into prompts)
- Wire the public site to actually READ `feature_flags` (so toggles gate the live site) and
  `badge_definitions`.
- Anonymous-upload storage fix (restrict `property_photos` uploads to authenticated) — pairs with
  the auth work.
- Mission Inbox (one daily triage list), Verification Center (PRC license/doc approvals),
  1-Click Undo (revert from audit log), Disputes Hub (double-blind + AI legal assist),
  Mission Kanban (auto-card staff board + SLA), DEFCON-1 kill switch (freeze public site),
  AI Command Center, Search Intelligence, Connect/Financial Center, Automation Center.

---

## 🗄️ COWORK (CLAUDE) LANE — what I handle instead

So Claude Code doesn't need to touch the live database or write its own specs:

- **Live Supabase changes via direct connection:** additive migrations, seeds, and checks. E.g.
  create the `security_access_logs` table for the IP Guard; seed/verify `feature_flags`; run the
  security advisors; bootstrap staff rows. (Already done this session: locked sensitive RPCs to
  service-role, removed public bucket listing, seeded 7 feature flags, inserted the founder's
  Super Admin row.)
- **Codebase audits & reconciliation** — reading the repo, catching schema drift, confirming what's
  really live vs. stale docs.
- **Specs & prompts** — writing the `HANDOFF_PROMPT_*.md` files Claude Code runs.
- **Live security posture checks** — advisors, RLS state, confirming data.
- **Planning / gap analysis / design direction.**

### Cowork to-do right now
- Create the `security_access_logs` table (additive) so it's ready before Claude Code builds the
  Security HUD — pending your OK.
- On request: any additive migration, seed, or advisor check.

---

## Handoff prompt files (index)
- `HANDOFF_PROMPT_RUN_MISSION_CONTROL_LOCAL.md` — run local dev + verify/debug.
- `HANDOFF_PROMPT_REDESIGN_MISSION_CONTROL.md` — visual redesign + instant navigation.
- `HANDOFF_PROMPT_METRICS_AND_IP_GUARD.md` — metrics bar charts + Masked IP Anomaly Guard (phased).
- `HANDOFF_PROMPT_DEPLOY_MISSION_CONTROL.md` — deploy to Vercel (already used).
- `HANDOFF_PROMPT_FOR_CLAUDE_CODE.md` — earlier main-site readiness (auth, ledger merge, CI).
- `PRODUCTION_READINESS.md`, `MASTER_MISSION_CONTROL_HARDENING.md` — reference plans.
