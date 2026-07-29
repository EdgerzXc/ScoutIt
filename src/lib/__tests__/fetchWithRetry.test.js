import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  fetchWithRetry,
  isCircuitOpen,
  resetCircuits,
} from '../fetchWithRetry.js';

// This module exists to stop ONE Airtable rate-limit breach from serving the
// whole public site empty data. The failure paths are the point, so they're
// what's tested hardest.

let calls = 0;

/** Stub fetch with a scripted sequence of outcomes. */
function planFetch(plan) {
  calls = 0;
  globalThis.fetch = vi.fn(async () => {
    const step = plan[Math.min(calls, plan.length - 1)];
    calls++;
    if (step === 'net') throw new Error('ECONNRESET');
    if (step === 'abort') {
      const e = new Error('aborted');
      e.name = 'AbortError';
      throw e;
    }
    return { ok: step === 200, status: step, headers: { get: () => null }, json: async () => ({}) };
  });
}

const FAST = { backoff: [5, 5, 5] };

beforeEach(() => { resetCircuits(); });
afterEach(() => { vi.restoreAllMocks(); });

describe('what gets retried', () => {
  it('retries a 500 and succeeds', async () => {
    planFetch([500, 500, 200]);
    const res = await fetchWithRetry('https://x.test/a', {}, { ...FAST });
    expect(res.status).toBe(200);
    expect(calls).toBe(3);
  });

  it('retries a 429 rate limit', async () => {
    planFetch([429, 200]);
    const res = await fetchWithRetry('https://x.test/a', {}, { ...FAST });
    expect(res.status).toBe(200);
  });

  it('retries network errors', async () => {
    planFetch(['net', 'net', 200]);
    const res = await fetchWithRetry('https://x.test/a', {}, { ...FAST });
    expect(res.status).toBe(200);
  });

  // A bad API key or malformed payload fails identically three more times,
  // just slower — and burns the time budget for no reason.
  it.each([[404], [401], [422]])('does NOT retry a %i', async (status) => {
    planFetch([status]);
    await fetchWithRetry('https://x.test/a', {}, { ...FAST });
    expect(calls).toBe(1);
  });
});

describe('writes are not retried', () => {
  // THE important case. insertProperty POSTs to Airtable. If that POST
  // succeeds but the response is lost to a timeout, a blind retry creates a
  // SECOND property record — and since Airtable's Slug is a formula field,
  // both rows compute the same slug and the publish bridge starts writing to
  // whichever Airtable returns first. Data corruption, not a hiccup.
  it.each([['POST'], ['PATCH'], ['DELETE'], ['PUT']])(
    '%s is not retried by default',
    async (method) => {
      planFetch([500, 200]);
      try {
        await fetchWithRetry('https://x.test/a', { method }, { ...FAST });
      } catch { /* expected */ }
      expect(calls).toBe(1);
    },
  );

  it('retries a write only when explicitly marked idempotent', async () => {
    planFetch([500, 200]);
    const res = await fetchWithRetry('https://x.test/a', { method: 'POST' }, { ...FAST, idempotent: true });
    expect(res.status).toBe(200);
    expect(calls).toBe(2);
  });
});

describe('circuit breaker', () => {
  it('opens after 5 consecutive failures', async () => {
    planFetch(['net']);
    for (let i = 0; i < 5; i++) {
      try { await fetchWithRetry('https://x.test/a', {}, { circuit: 'airtable', retries: 0 }); } catch { /* expected */ }
    }
    expect(isCircuitOpen('airtable')).toBe(true);
  });

  // This is the entire value of the breaker: cmsCache can serve stale content
  // in ~0ms instead of every visitor waiting out a retry ladder against a
  // dead upstream.
  it('fails fast with no network call while open', async () => {
    planFetch(['net']);
    for (let i = 0; i < 5; i++) {
      try { await fetchWithRetry('https://x.test/a', {}, { circuit: 'airtable', retries: 0 }); } catch { /* expected */ }
    }

    calls = 0;
    let err = null;
    try {
      await fetchWithRetry('https://x.test/a', {}, { circuit: 'airtable' });
    } catch (e) { err = e; }

    expect(err?.circuitOpen).toBe(true);
    expect(calls).toBe(0);
  });

  it('closes again on success', async () => {
    planFetch([200]);
    await fetchWithRetry('https://x.test/a', {}, { circuit: 'airtable' });
    expect(isCircuitOpen('airtable')).toBe(false);
  });

  // A 404 means WE asked wrongly. Tripping the breaker on our own bad request
  // would take down a healthy upstream for everyone else.
  it('does not open on 4xx responses', async () => {
    planFetch([404]);
    for (let i = 0; i < 6; i++) {
      await fetchWithRetry('https://x.test/a', {}, { circuit: 'airtable', retries: 0 });
    }
    expect(isCircuitOpen('airtable')).toBe(false);
  });

  it('treats an unnamed circuit as always closed', () => {
    expect(isCircuitOpen(null)).toBe(false);
  });
});

describe('time budget', () => {
  // One CMS bundle already fans out to 4 parallel Airtable calls plus a
  // Mapbox geocode per property, inside Vercel's ~10s function ceiling.
  // Unbounded retries turn a slow upstream into a 504 — the BF13 failure.
  it('gives up inside the budget instead of overrunning it', async () => {
    globalThis.fetch = vi.fn(async () => {
      await new Promise((r) => setTimeout(r, 150));
      const e = new Error('slow');
      e.name = 'AbortError';
      throw e;
    });

    const started = Date.now();
    try {
      await fetchWithRetry('https://x.test/a', {}, {
        budgetMs: 600,
        attemptTimeoutMs: 200,
        backoff: [50, 50, 50],
      });
    } catch { /* expected */ }

    expect(Date.now() - started).toBeLessThan(1100);
  });
});
