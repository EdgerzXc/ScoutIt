# Mission Control

The staff console. A **separate Next.js app** from the public site, deployed as
its **own Vercel project**, from this same repository.

## Deployment — the one setting that matters

| Setting | Value |
| --- | --- |
| Repository | `EdgerzXc/ScoutIt` |
| **Root Directory** | **`mission-control`** |
| **Include files outside the root directory** | **OFF** |
| Production branch | `main` |
| Framework | Next.js (auto-detected) |

## The two settings that broke this, in order

Both cost a working console on 2026-08-30. Neither produced an error a reader
could act on.

### 1. Root Directory blank → the wrong app ships

See below. Set it to `mission-control`.

### 2. "Include files outside the root directory" ON → module not found

This app builds **standalone**: `npm ci && npm run build` inside this folder
succeeds with nothing else present. Turning that setting on drags the repo root
into the build, and the repo root belongs to the *public site*:

```
instrumentation.js
sentry.edge.config.js     imports "@sentry/nextjs"
sentry.server.config.js   imports "./src/lib/sentryEventPolicy"
```

Neither exists here — this app has no Sentry dependency and no
`src/lib/sentryEventPolicy.js`. The build compiled them anyway and died after
~35 seconds with `module-not-found`, pointing at files that are not part of this
application at all.

**Leave it OFF.** Nothing in `mission-control/src` imports from outside this
folder; every local import was checked. The one place that reads across the
boundary is `test/system-event-log.test.mjs`, which reads the main site's
`chatRetention.js` as a drift guard — a test, never part of the build.

**If Root Directory is blank, Vercel builds the repo root — the public website —
and serves it at the console's address.** That happened on 2026-08-30: the
console URL returned the public site's homepage, `/showcase` and `/intel`
answered 200, every `/dashboard/*` route returned 404, and the host served a
crawlable `robots.txt` advertising its own sitemap — a duplicate public site
competing with the real domain. Nothing was lost, but the console was gone until
the setting was corrected.

There is deliberately **no `vercel.json` in this folder**. Next.js is
auto-detected, and the repo-root `vercel.json` declares the *public site's* four
cron jobs, which must not run under this project.

### Two things that surprise people

1. **Connecting the repository does not deploy.** It only registers the link.
   Vercel builds on the next push.
2. **After Root Directory is set, only changes inside `mission-control/` trigger
   a build.** A commit that touches just `src/` or `_SCOUTIT_BRAIN/` is skipped
   here — correctly, but it means "I pushed and nothing happened" is expected,
   not broken. Use **Redeploy** in the dashboard to force one.

## Why this is a separate app, not a folder in the public site

Keeping the console on its own deployment is a security decision, not an
accident of history:

- **A second lock can sit in front of the whole thing** — Vercel Authentication,
  a password, or an IP allowlist. That is impossible for an `/admin` route on a
  site whose front door must stay open to anonymous visitors.
- **Blast radius.** A bug in the public site does not run in the same process as
  the service-role key and the staff surfaces.
- **Caching.** The public site is deliberately cached hard at the edge with
  `public` headers. Admin responses must never be. One deployment tuned for both
  is how a cached admin page reaches a stranger.
- **Incident response.** A broken public deploy must not take down the console
  you need in order to fix it.

The real cost of the split is duplicated code — `intelPublish.js`,
`systemEventPolicy.mjs`, `propertyFieldMapping.js` and others exist in both
trees. **The answer to that is a shared package, not merging the runtimes.**
Each duplicate is currently guarded by a drift test that fails if the copies
diverge.

## Verification gates

```bash
npm run test:security   # this app's gate
npm run build
```

The public site has its own gate, `npm run verify:surfaces`, run from the repo
root.

## Cross-app rule

Mission Control does **not** call the public site's HTTP API. It reaches the
same Supabase and the same Airtable directly, under its own RBAC and audit
trail. See `src/lib/crossAppPolicy.mjs` for the decision and what was rejected;
`test/cross-app-boundary.test.mjs` fails the build if a call to the main site
reappears.
