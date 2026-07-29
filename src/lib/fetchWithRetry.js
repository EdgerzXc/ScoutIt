// ═══════════════════════════════════════════════════════════════
// FETCH WITH RETRY + CIRCUIT BREAKER  (NEW_IDEAS.md §17.1, §17.2)
//
// Airtable backs EVERY public page through /api/cms. When its rate limit
// (5 req/s per base) was hit once, the fetch threw and the whole site served
// EMPTY data — that incident is why cmsCache.js exists. This module is the
// layer below that: make the transient failures not happen in the first place.
//
// ── WHAT GETS RETRIED, AND WHAT DOESN'T ─────────────────────────────
// Retry ONLY things that plausibly fix themselves:
//   429 (rate limited), 500/502/503/504 (upstream wobble), network errors.
// NEVER retry 4xx like 401/403/404/422 — a bad key or a malformed payload
// will fail identically three more times, just slower.
//
// ── SAFE METHODS ONLY, BY DEFAULT ───────────────────────────────────
// GET/HEAD are retried freely. Writes are NOT, unless the caller explicitly
// passes `idempotent: true`.
//
// Why that matters concretely: `insertProperty` POSTs to Airtable. If that
// POST succeeds but the response is lost to a timeout, a blind retry creates
// a SECOND property record. The owner then has a duplicate listing with a
// different record id — and Airtable's Slug is a formula field, so both rows
// compute the same slug and the publish bridge starts writing to whichever
// one Airtable returns first. That's a data-corruption bug, not a hiccup.
//
// ── TIME BUDGET IS NOT OPTIONAL ─────────────────────────────────────
// One CMS bundle already fans out to 4 parallel Airtable calls plus a Mapbox
// geocode per un-geocoded property. Vercel Hobby caps a function at ~10s.
// Retries without a hard budget turn a slow upstream into a 504 — exactly the
// failure BF13 produced with Overpass. Every call carries its own budget and
// gives up rather than overrunning it.
//
// ── CIRCUIT BREAKER (§17.2) ─────────────────────────────────────────
// After N consecutive failures a named circuit OPENS and calls fail
// instantly, without touching the network. That's the point: cmsCache can
// then serve stale content in milliseconds instead of every visitor waiting
// out a full retry ladder against a dead upstream. One probe is allowed
// after a cooldown (half-open); a success closes the circuit.
//
// NOTE: state is module-scoped, so it's per serverless instance — the same
// caveat as the caches in cmsCache.js and overpassIntel.js. That's fine: the
// goal is to stop ONE instance from hammering a struggling upstream.
// ═══════════════════════════════════════════════════════════════

const RETRYABLE_STATUS = new Set([408, 425, 429, 500, 502, 503, 504]);
const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

// Per the §17.1 spec: 100ms, 300ms, 900ms, with jitter.
const DEFAULT_BACKOFF_MS = [100, 300, 900];
const DEFAULT_BUDGET_MS = 6000;
const DEFAULT_ATTEMPT_TIMEOUT_MS = 3500;

// Circuit breaker tuning (§17.2: "fails 5 consecutive requests").
const CIRCUIT_FAILURE_THRESHOLD = 5;
const CIRCUIT_COOLDOWN_MS = 30 * 1000;

/** name -> { failures, openedAt } */
const circuits = new Map();

function getCircuit(name) {
  if (!circuits.has(name)) circuits.set(name, { failures: 0, openedAt: 0 });
  return circuits.get(name);
}

/**
 * Is this circuit currently refusing traffic?
 * Returns false once the cooldown has elapsed, allowing a single probe.
 */
export function isCircuitOpen(name) {
  if (!name) return false;
  const c = getCircuit(name);
  if (c.failures < CIRCUIT_FAILURE_THRESHOLD) return false;
  if (Date.now() - c.openedAt >= CIRCUIT_COOLDOWN_MS) return false; // half-open
  return true;
}

function recordSuccess(name) {
  if (!name) return;
  const c = getCircuit(name);
  c.failures = 0;
  c.openedAt = 0;
}

function recordFailure(name) {
  if (!name) return;
  const c = getCircuit(name);
  c.failures += 1;
  if (c.failures >= CIRCUIT_FAILURE_THRESHOLD) c.openedAt = Date.now();
}

/** Inspect breaker state — for /api/health and debugging. */
export function circuitStatus() {
  const out = {};
  for (const [name, c] of circuits.entries()) {
    out[name] = {
      failures: c.failures,
      open: isCircuitOpen(name),
      openedAt: c.openedAt ? new Date(c.openedAt).toISOString() : null,
    };
  }
  return out;
}

/** Test seam — reset breakers between unit tests. */
export function resetCircuits() {
  circuits.clear();
}

/**
 * Full jitter on the backoff delay. Without it, every serverless instance
 * that failed at the same moment retries at the same moment, and the
 * "thundering herd" keeps the upstream down.
 */
function jittered(baseMs) {
  return Math.round(baseMs / 2 + Math.random() * (baseMs / 2));
}

/** Honour Retry-After (seconds, or an HTTP date), clamped to the budget. */
function retryAfterMs(res, remainingMs) {
  const header = res?.headers?.get?.("retry-after");
  if (!header) return null;

  const seconds = Number(header);
  let ms = Number.isFinite(seconds) ? seconds * 1000 : new Date(header).getTime() - Date.now();
  if (!Number.isFinite(ms) || ms < 0) return null;

  // A 60-second Retry-After is honest but useless inside a 10s function.
  // Cap it — and if it doesn't fit at all, the caller gives up instead.
  return Math.min(ms, remainingMs);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * fetch() with bounded exponential backoff and an optional named circuit.
 *
 * Throws on final failure so existing try/catch and serve-stale paths (e.g.
 * cmsCache) keep working unchanged.
 *
 * @param {string} url
 * @param {RequestInit} [init]
 * @param {{
 *   retries?: number,
 *   budgetMs?: number,
 *   attemptTimeoutMs?: number,
 *   circuit?: string|null,
 *   idempotent?: boolean,
 *   backoff?: number[],
 * }} [options]
 * @returns {Promise<Response>}
 */
export async function fetchWithRetry(url, init = {}, options = {}) {
  const {
    retries = DEFAULT_BACKOFF_MS.length,
    budgetMs = DEFAULT_BUDGET_MS,
    attemptTimeoutMs = DEFAULT_ATTEMPT_TIMEOUT_MS,
    circuit = null,
    idempotent = false,
    backoff = DEFAULT_BACKOFF_MS,
  } = options;

  // Fail fast while the circuit is open. This is the whole value of the
  // breaker: the caller's stale-content fallback runs in ~0ms instead of
  // every visitor waiting out a retry ladder against a dead upstream.
  if (isCircuitOpen(circuit)) {
    const err = new Error(`Circuit open for "${circuit}" — skipping request`);
    err.circuitOpen = true;
    throw err;
  }

  const method = (init.method || "GET").toUpperCase();
  const mayRetry = idempotent || SAFE_METHODS.has(method);
  const maxAttempts = mayRetry ? retries + 1 : 1;

  const deadline = Date.now() + budgetMs;
  let lastError = null;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const remaining = deadline - Date.now();
    if (remaining < 300) break; // no room for a meaningful attempt

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), Math.min(attemptTimeoutMs, remaining));

    let res = null;
    try {
      res = await fetch(url, { ...init, signal: controller.signal });
      clearTimeout(timer);

      if (res.ok) {
        recordSuccess(circuit);
        return res;
      }

      // A non-retryable status is a real answer — return it and let the
      // caller decide. Don't burn retries on a 404 or a bad API key.
      if (!RETRYABLE_STATUS.has(res.status)) {
        // 5xx counts against the breaker; 4xx is our fault, not the upstream's.
        if (res.status >= 500) recordFailure(circuit);
        return res;
      }

      lastError = new Error(`HTTP ${res.status} from ${new URL(url).host}`);
      lastError.status = res.status;
    } catch (err) {
      clearTimeout(timer);
      lastError = err;
      lastError.wasTimeout = err?.name === "AbortError";
    }

    // Out of attempts?
    if (attempt === maxAttempts - 1) break;

    const budgetLeft = deadline - Date.now();
    const suggested = res ? retryAfterMs(res, budgetLeft) : null;
    const delay = suggested ?? jittered(backoff[Math.min(attempt, backoff.length - 1)]);

    // Don't sleep if waking up leaves no time to actually try again.
    if (delay + 300 > budgetLeft) break;
    await sleep(delay);
  }

  recordFailure(circuit);
  throw lastError || new Error(`fetchWithRetry exhausted for ${url}`);
}

/**
 * Convenience wrapper: retried fetch that also parses JSON.
 * @returns {Promise<any>}
 */
export async function fetchJsonWithRetry(url, init = {}, options = {}) {
  const res = await fetchWithRetry(url, init, options);
  if (!res.ok) {
    const err = new Error(`HTTP ${res.status} from ${new URL(url).host}`);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

export default fetchWithRetry;
