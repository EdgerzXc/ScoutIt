# Claude Code Deploy Prompt — push pending ScoutIt work live (2026-06-24)

Copy everything in the block below into Claude Code, running inside the `ScoutIt` repo.

---

You are deploying pending work for **ScoutIt** (Next.js 16 App Router, Airtable public CMS, Supabase
private DB, deployed on Vercel; repo `EdgerzXc/ScoutIt`, branch `main`). The owner is **non-technical** —
explain each step in plain language and **never leave `main` un-deployable.**

There is a large pending change set on `main` (currently at `fa336c8`) made across two parallel efforts:
1. **Antigravity feature code that was never committed** — these are UNTRACKED real files: the backend
   routes `src/app/api/dashboard/{publish,invite,deals/update}/route.js` and
   `src/app/api/v1/questit/{quests,raise}/route.js`; provider HUDs under
   `src/components/dashboard/providers/`; `src/lib/sanitize.js`; `src/lib/questitPolicyEngine.js`;
   `supabase_rls_policies.sql`; `questit_api_schema.sql`; and 5 new specs in `e2e_tests/`.
2. **A documentation/knowledge-base reorganization** — knowledge docs were consolidated into the single
   `_SCOUTIT_BRAIN/` home; duplicate copies in root/`docs/`/`automations/` were moved out (you'll see them
   as deletions + a `_REVIEW_QUEUE/` archive); `AGENTS.md`, `SCOUTIT_BIBLE.md`, `STRUCTURE.md` had stale
   sections corrected; new planning docs were added under `_SCOUTIT_BRAIN/04_DATA_AND_SCHEMA/`.

## Do this, in order — stop and ask the owner if anything is unclear or fails

1. **Review first.** Run `git status` and `git diff --stat`. Summarize for the owner, in plain language,
   what's about to be committed — separating "app code" from "documentation."
2. **Prove it compiles BEFORE committing anything.** Run `npm install` (if needed) then **`npm run build`**
   and `npm run lint`. If the build fails, **STOP**, do not commit, and report the error in plain language.
   `main` must always be deployable.
3. **Optional safety check:** run the Playwright e2e suite (`npx playwright test`) if it's quick. Note
   results; don't block the deploy on flaky/visual tests, but report failures.
4. **Commit in clear, logical groups** (not one giant commit), e.g.:
   - `feat(backend): add owner publish + connects-invite + deals API routes`
   - `feat(dashboard): provider HUDs (designer/photographer/researcher)`
   - `chore(security): add sanitize util + Supabase RLS policy SQL`
   - `test(e2e): add provider/broker journey specs`
   - `docs: consolidate knowledge base into _SCOUTIT_BRAIN; fix stale data-model docs`
   Write plain-language commit bodies.
5. **`_REVIEW_QUEUE/` decision:** it holds an archive of old duplicate docs + a review log. Either commit it
   (harmless record) OR add `_REVIEW_QUEUE/` to `.gitignore` — ask the owner which they prefer. (The junk
   scripts inside are already git-ignored and won't be committed either way.)
6. **Push:** `git push origin main`. This triggers Vercel's auto-deploy.
7. **Verify the deploy is healthy:**
   - Confirm the Vercel build succeeded (Vercel dashboard or `vercel` CLI).
   - `curl -s -o /dev/null -w "%{http_code}" https://scoutit.vercel.app/` → expect `200`.
   - `curl -s https://scoutit.vercel.app/api/cms | head` → expect `"source":"airtable"` (NOT
     `mock_fallback`, which would mean Airtable env vars are missing).
8. **Report back** in plain language: what was committed, the new commit hash, the live URL, and the
   health-check results.

## Known issue — DO NOT fix in this pass (deploy only, no code changes)
There is a known bug in `src/lib/airtable.js` `insertProperty()`: it does not write the `Slug` field, so
owner-published listings may not appear publicly. Leave it for the next working session — just confirm it's
noted. The goal of THIS session is only to get current work safely live and verified.
