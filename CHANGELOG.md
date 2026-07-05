# Changelog

All notable changes to the ScoutIt project will be documented in this file.

## [Unreleased] - 2026-07-05

### Added
- **Jules Audit Features & APIs**: Integrated the complete batch of Jules session audits into the core codebase.
- **Vitest Integration**: Configured `vitest` alongside Playwright to provide a standard framework for backend unit testing. Added tests for `connectsWallet.js`, `liteMode.js`, `BadgeEngine.js`, and `airtable.js`.
- **Pre-Launch Waitlist**: Implemented `src/app/api/waitlist/route.js` with Turnstile Captcha verification and Zod schema validation.
- **Cron Jobs**: Added `src/app/api/cron/check-stale-listings/route.js` (and configured it in `vercel.json`) to regularly check for and flag listings without recent updates.
- **Supabase RPC & Schema Migrations**: Deployed `user_profile_schema.sql` and `supabase_rpc.sql` inside `supabase/migrations` for foundational roles, badges, user profiles, and spatial location search querying via PostGIS.
- **2FA/MFA Account Controls**: Integrated Supabase Native Multi-Factor Authentication (TOTP) and password lifecycle workflows inside `src/app/settings/page.js`.

### Changed
- **Mapbox Popups Security**: Re-factored Mapbox popup initializations in `InteractiveMap.js` to rely on native `document.createElement()` structures instead of string concatenation, fully eliminating XSS vulnerabilities from injected variables.
- **Airtable SDK Expansion**: Exposed `expandDeepIntel` from `src/lib/airtable.js` to support downstream tests and API transformations.
- **Lite Mode**: Embedded `src/lib/liteMode.js` to intelligently throttle cinematic animations and performance-heavy components on lower-end devices.

### Fixed
- Stabilized and integrated all pending modules from the previous audit rounds to successfully pass all 34 `vitest` unit tests.
