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
    path.startsWith('/api/ai/') ||
    path.startsWith('/api/storage/') ||
    path.startsWith('/api/intel/')
  );
}

// Which limiter meters a path: 'strict' (5/10s), 'ai' (15/10s), 'standard'
// (30/10s). Anything that spends model tokens gets the 'ai' tier.
export function rateLimitTier(path) {
  if (path.startsWith('/api/auth/')) return 'strict';
  if (path.startsWith('/api/ai/') || path.startsWith('/api/intel/')) return 'ai';
  return 'standard';
}
