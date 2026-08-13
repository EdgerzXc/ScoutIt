import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// turnstile.js reads process.env at call time and calls fetch, so each test
// re-imports with a fresh module registry and a stubbed fetch. Nothing here
// touches the network.

const TEST_SECRET = '1x0000000000000000000000000000000AA';
const REAL_SECRET = '0xREALSECRETVALUE';

let lastBody = null;

function stubFetch(mode = 'success') {
  globalThis.fetch = vi.fn(async (_url, init) => {
    lastBody = new URLSearchParams(init.body).toString();
    if (mode === 'network') throw new Error('ECONNREFUSED');
    if (mode === 'http500') return { ok: false, status: 500 };
    if (mode === 'nonjson') return { ok: true, json: async () => { throw new Error('bad json'); } };
    if (mode === 'badsecret') return { ok: true, json: async () => ({ success: false, 'error-codes': ['invalid-input-secret'] }) };
    if (mode === 'dupe') return { ok: true, json: async () => ({ success: false, 'error-codes': ['timeout-or-duplicate'] }) };
    if (mode === 'invalid') return { ok: true, json: async () => ({ success: false, 'error-codes': ['invalid-input-response'] }) };
    return { ok: true, json: async () => ({ success: true }) };
  });
}

async function loadFresh() {
  vi.resetModules();
  return await import('../turnstile.js');
}

const ORIGINAL_ENV = { ...process.env };

beforeEach(() => {
  lastBody = null;
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
  vi.restoreAllMocks();
});

describe('fail closed — a captcha that cannot be checked has not passed', () => {
  it('refuses when no secret is configured in production', async () => {
    process.env.NODE_ENV = 'production';
    delete process.env.TURNSTILE_SECRET;
    delete process.env.TURNSTILE_SECRET_KEY;
    stubFetch();
    const { verifyTurnstile } = await loadFresh();

    const result = await verifyTurnstile('some-token');
    expect(result.ok).toBe(false);
    expect(result.codes).toContain('missing-input-secret');
  });

  // The previous inline implementation DEFAULTED to this test secret, which
  // makes siteverify return success for any token at all. In production that
  // silently removes bot protection while still looking configured.
  it("refuses Cloudflare's test secret in production", async () => {
    process.env.NODE_ENV = 'production';
    process.env.TURNSTILE_SECRET = TEST_SECRET;
    stubFetch();
    const { verifyTurnstile } = await loadFresh();

    const result = await verifyTurnstile('some-token');
    expect(result.ok).toBe(false);
    expect(result.codes).toContain('missing-input-secret');
  });

  it.each([
    ['a network error', 'network'],
    ['an HTTP 500', 'http500'],
    ['a non-JSON body', 'nonjson'],
  ])('fails closed on %s', async (_label, mode) => {
    process.env.NODE_ENV = 'production';
    process.env.TURNSTILE_SECRET = REAL_SECRET;
    stubFetch(mode);
    const { verifyTurnstile } = await loadFresh();

    expect((await verifyTurnstile('t')).ok).toBe(false);
  });

  it('rejects an empty token without making a network call', async () => {
    process.env.TURNSTILE_SECRET = REAL_SECRET;
    stubFetch();
    const { verifyTurnstile } = await loadFresh();

    const result = await verifyTurnstile('');
    expect(result.ok).toBe(false);
    expect(lastBody).toBeNull();
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });
});

describe('the happy path and the request body', () => {
  beforeEach(() => {
    process.env.NODE_ENV = 'production';
    process.env.TURNSTILE_SECRET = REAL_SECRET;
    stubFetch();
  });

  it('passes a valid token', async () => {
    const { verifyTurnstile } = await loadFresh();
    expect((await verifyTurnstile('good-token')).ok).toBe(true);
  });

  it('sends the secret and token in the documented fields', async () => {
    const { verifyTurnstile } = await loadFresh();
    await verifyTurnstile('good-token');
    expect(lastBody).toContain(`secret=${REAL_SECRET}`);
    expect(lastBody).toContain('response=good-token');
  });

  it('omits remoteip when no IP is supplied', async () => {
    const { verifyTurnstile } = await loadFresh();
    await verifyTurnstile('good-token');
    expect(lastBody).not.toContain('remoteip');
  });

  it('includes remoteip when supplied', async () => {
    const { verifyTurnstile } = await loadFresh();
    await verifyTurnstile('good-token', { remoteIp: '203.0.113.9' });
    expect(lastBody).toContain('remoteip=203.0.113.9');
  });
});

describe('secret resolution', () => {
  it('falls back to the legacy TURNSTILE_SECRET_KEY name', async () => {
    process.env.NODE_ENV = 'production';
    delete process.env.TURNSTILE_SECRET;
    process.env.TURNSTILE_SECRET_KEY = '0xLEGACY';
    stubFetch();
    const { verifyTurnstile } = await loadFresh();

    expect((await verifyTurnstile('t')).ok).toBe(true);
    expect(lastBody).toContain('secret=0xLEGACY');
  });

  // Local work shouldn't require real credentials.
  it('allows the test secret in development', async () => {
    process.env.NODE_ENV = 'development';
    delete process.env.TURNSTILE_SECRET;
    delete process.env.TURNSTILE_SECRET_KEY;
    stubFetch();
    const { verifyTurnstile } = await loadFresh();

    expect((await verifyTurnstile('t')).ok).toBe(true);
  });
});

describe('error mapping', () => {
  beforeEach(() => {
    process.env.NODE_ENV = 'production';
    process.env.TURNSTILE_SECRET = REAL_SECRET;
  });

  it('surfaces invalid-input-secret so misconfiguration is diagnosable', async () => {
    stubFetch('badsecret');
    const { verifyTurnstile } = await loadFresh();
    const result = await verifyTurnstile('t');
    expect(result.codes).toContain('invalid-input-secret');
  });

  it('rejects an invalid token with a retryable message', async () => {
    stubFetch('invalid');
    const { verifyTurnstile } = await loadFresh();
    const result = await verifyTurnstile('forged-token');
    expect(result.ok).toBe(false);
    expect(result.codes).toContain('invalid-input-response');
    expect(result.message).toMatch(/try again/i);
  });

  // Expired and replayed tokens share Cloudflare's timeout-or-duplicate code.
  // The message must tell the user to retry with the freshly reset widget.
  it('maps timeout-or-duplicate to a retry message', async () => {
    stubFetch('dupe');
    const { verifyTurnstile } = await loadFresh();
    const result = await verifyTurnstile('t');
    expect(result.message).toMatch(/already used/i);
  });
});

describe('clientIpFrom', () => {
  const mkRequest = (headers) => ({ headers: { get: (k) => headers[k] || null } });

  // X-Forwarded-For can be "client, proxy1, proxy2". Cloudflare rejects the
  // raw header, so only the first entry may be sent.
  it('takes only the first X-Forwarded-For entry', async () => {
    const { clientIpFrom } = await loadFresh();
    expect(clientIpFrom(mkRequest({ 'x-forwarded-for': '203.0.113.9, 10.0.0.1, 10.0.0.2' })))
      .toBe('203.0.113.9');
  });

  it('falls back to cf-connecting-ip', async () => {
    const { clientIpFrom } = await loadFresh();
    expect(clientIpFrom(mkRequest({ 'cf-connecting-ip': '198.51.100.4' }))).toBe('198.51.100.4');
  });

  it('returns null when no IP header is present', async () => {
    const { clientIpFrom } = await loadFresh();
    expect(clientIpFrom(mkRequest({}))).toBeNull();
  });
});
