// ─────────────────────────────────────────────────────────────────────────
// WHICH ROUTES ARE WORTH FAILING CLOSED FOR
// U-020 · full-stack gap audit 2026-09-01
//
// These two questions used to be answered by unexported helpers inside
// `src/proxy.js`, which meant the only way to test them was to grep the
// proxy for a string — the kind of guard that passes while the behaviour
// is wrong. They live here as pure functions for the same reason
// `questItGate.js` does: so a test can ask them directly.
//
// `/api/intel/` was missing from both answers. `/api/intel/ingest` calls a
// paid Gemini model on a document of up to 20 MB, so it belongs with the
// other routes where an unmetered window costs real money — an outage is
// cheaper than an open tap.
// ─────────────────────────────────────────────────────────────────────────

// Routes where an unmetered window is worse than a brief outage.
export function isSensitivePath(path) {
  return (
    path.startsWith('/api/auth/') ||
    path.startsWith('/api/admin/') ||
    path.startsWith('/api/cron/') ||
    path.startsWith('/api/ai/') ||
    path.startsWith('/api/storage/') ||
    path.startsWith('/api/intel/') ||
    path.startsWith('/api/properties/updates/intent') ||
    path.startsWith('/api/properties/queue/') ||
    path.startsWith('/api/questit') ||
    path.startsWith('/api/v1/questit') ||
    path.startsWith('/api/property/claim') ||
    path.startsWith('/api/badges/') ||
    path.startsWith('/api/user/') ||
    path.startsWith('/api/contact') ||
    path.startsWith('/api/deals/') ||
    path === '/api/deals' ||
    path.startsWith('/api/dashboard/') ||
    path.startsWith('/api/wallet') ||
    path.startsWith('/api/oauth/google/') ||
    path.startsWith('/api/inquiries') ||
    path.startsWith('/api/waitlist') ||
    path.startsWith('/api/notifications') ||
    path.startsWith('/api/broker/') ||
    path.startsWith('/api/crm/') ||
    path.startsWith('/api/spatial/') ||
    path.startsWith('/api/leads/export-audit') ||
    path.startsWith('/api/community/signals/') ||
    path.startsWith('/api/mapbox') ||
    path.startsWith('/api/whereto')
  );
}

// Which limiter meters a path: 'strict' (5/10s), 'ai' (15/10s), 'standard'
// (30/10s). Anything that spends model tokens gets the 'ai' tier.
export function rateLimitTier(path) {
  if (
    path.startsWith('/api/auth/') ||
    path.startsWith('/api/admin/') ||
    path.startsWith('/api/user/delete-account') ||
    path.startsWith('/api/badges/transfer') ||
    path.startsWith('/api/badges/claim') ||
    path.startsWith('/api/badges/apply') ||
    path.startsWith('/api/property/claim') ||
    path.startsWith('/api/contact') ||
    path.startsWith('/api/storage/') ||
    path.startsWith('/api/oauth/google/') ||
    path.startsWith('/api/wallet') ||
    path.startsWith('/api/inquiries') ||
    path.startsWith('/api/waitlist')
  ) {
    return 'strict';
  }
  if (
    path.startsWith('/api/ai/') ||
    path.startsWith('/api/intel/') ||
    path.startsWith('/api/properties/updates/intent') ||
    path.startsWith('/api/properties/queue/process') ||
    path.startsWith('/api/questit') ||
    path.startsWith('/api/v1/questit')
  ) {
    return 'ai';
  }
  return 'standard';
}
