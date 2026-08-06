import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { isEmailConfigured, sendEmail, renderEmail } from '../email.js';

// Email is a COURTESY channel layered on the in-app notification, which is the
// system of record. The contract these tests defend is therefore mostly about
// what must NOT happen: no throwing, no sending without a key, no HTML
// injection from user-supplied text.

const ORIGINAL_KEY = process.env.RESEND_API_KEY;

afterEach(() => {
  if (ORIGINAL_KEY === undefined) delete process.env.RESEND_API_KEY;
  else process.env.RESEND_API_KEY = ORIGINAL_KEY;
  vi.restoreAllMocks();
});

describe('isEmailConfigured', () => {
  it('is false with no key — the current production state', () => {
    delete process.env.RESEND_API_KEY;
    expect(isEmailConfigured()).toBe(false);
  });

  it('is true once a key exists', () => {
    process.env.RESEND_API_KEY = 're_test';
    expect(isEmailConfigured()).toBe(true);
  });
});

describe('sendEmail — must never throw, must never send unconfigured', () => {
  beforeEach(() => {
    delete process.env.RESEND_API_KEY;
  });

  it('skips silently and makes NO network call when unconfigured', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const result = await sendEmail({ to: 'a@b.com', subject: 'Hi', html: '<p>Hi</p>' });
    expect(result).toEqual({ sent: false, skipped: 'no_provider' });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('skips when required fields are missing rather than sending a blank email', async () => {
    process.env.RESEND_API_KEY = 're_test';
    const result = await sendEmail({ to: '', subject: '', html: '' });
    expect(result.sent).toBe(false);
    expect(result.skipped).toBe('missing_fields');
  });

  it('returns an error object instead of throwing when the provider rejects', async () => {
    process.env.RESEND_API_KEY = 're_test';
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      status: 422,
      text: async () => 'domain not verified',
    });
    const result = await sendEmail({ to: 'a@b.com', subject: 'Hi', html: '<p>Hi</p>' });
    expect(result.sent).toBe(false);
    expect(result.error).toBe('provider_422');
  });

  it('returns an error object instead of throwing when the network dies', async () => {
    process.env.RESEND_API_KEY = 're_test';
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('ECONNRESET'));
    const result = await sendEmail({ to: 'a@b.com', subject: 'Hi', html: '<p>Hi</p>' });
    expect(result).toEqual({ sent: false, error: 'network' });
  });

  it('always includes a plain-text part — HTML-only mail is a spam signal', async () => {
    process.env.RESEND_API_KEY = 're_test';
    let captured;
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (_url, opts) => {
      captured = JSON.parse(opts.body);
      return { ok: true, json: async () => ({ id: 'e_1' }) };
    });
    await sendEmail({ to: 'a@b.com', subject: 'Hi', html: '<p>Hello <b>there</b></p>' });
    expect(captured.text).toBe('Hello there');
    expect(captured.to).toEqual(['a@b.com']);
  });
});

describe('renderEmail', () => {
  it('escapes user-supplied text in the heading', () => {
    const html = renderEmail({
      heading: 'Request for <script>alert(1)</script>',
      body: '<p>ok</p>',
    });
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
  });

  it('omits the CTA entirely when no path is given, rather than linking nowhere', () => {
    const html = renderEmail({ heading: 'Hi', body: '<p>ok</p>' });
    expect(html).not.toContain('<a href="undefined');
    expect(html.toLowerCase()).not.toContain('border-radius:6px;font-weight:700');
  });

  it('builds an absolute CTA URL — relative links do not work in email clients', () => {
    const html = renderEmail({
      heading: 'Hi',
      body: '<p>ok</p>',
      ctaLabel: 'Open inbox',
      ctaPath: '/dashboard/inbox',
    });
    expect(html).toMatch(/href="https?:\/\/[^"]+\/dashboard\/inbox"/);
  });

  it('carries an unsubscribe/manage link', () => {
    const html = renderEmail({ heading: 'Hi', body: '<p>ok</p>' });
    expect(html).toMatch(/\/settings/);
  });
});
