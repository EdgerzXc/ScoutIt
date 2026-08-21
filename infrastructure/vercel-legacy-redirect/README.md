# Legacy Vercel hostname guard

This intentionally minimal project preserves ownership of
`scoutit.vercel.app` and permanently redirects every path and query string to
the canonical `https://www.scoutit.space` hostname.

## Vercel target

- Team: `edgerzxcs-projects`
- Legacy project: `scoutit`
- Project ID: `prj_EERckLskNq8vLPLyavEXjYfen4kI`
- Active application project: `scout-it` (`prj_WD59HGBfyxwxx1HtFjBP8lAXfx7y`)

The legacy project must remain disconnected from Git, contain no environment
variables, integrations, or cron jobs, and retain Vercel Authentication for
non-production deployment URLs. Do not attach the main ScoutIt repository to
this project.

To redeploy intentionally, link this directory to the legacy project by its
exact project ID and verify the resulting `308` response before promotion.
