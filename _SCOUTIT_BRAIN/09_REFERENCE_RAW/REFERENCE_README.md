# reference/ — visual guides for the AIs

Drop **photos, screenshots, mockups, or sketches** here that show how you
want something to look. Then point the AI (Claude or Antigravity) at the
file, e.g. "match the light path in `reference/light-path.png`."

This replaces the AI *inventing* visuals from scratch (which produced the
"lightning" and the "house"). With a picture to match, results are far closer
to what you actually want.

Suggested naming so it's obvious what each image is for:
- `hero-blackhole.png`   — how the hero / event-horizon should look
- `light-path.png`       — the path the light should trace down the page
- `colors.png`           — palette / mood reference
- `layout-*.png`         — section layouts

This whole folder is git-ignored — images stay on your machine and are NOT
committed or deployed to Vercel, so they never bloat the site.
