import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─────────────────────────────────────────────────────────────────────────
// The bug these cover: this route validated a signup, ran the captcha, then
// `console.log`ged the email and returned `{ ok: true }`. The insert was
// commented out. `waitlist` had 0 rows while the visitor was told it worked —
// the whole pre-launch funnel, silently discarding its input (Rule 21).
//
// The trap in fixing it: the commented-out code used the BROWSER client, and
// the table's RLS policy is `USING (false)`. Restoring it verbatim would have
// swapped a silent discard for a silent 500. Hence the service-client assertion
// below — it is the part that is easy to get wrong twice.
// ─────────────────────────────────────────────────────────────────────────

const insert = vi.fn();
vi.mock('@/lib/supabaseAdmin', () => ({
  supabaseAdmin: { from: (...a) => { from(...a); return { insert }; } },
}));
const from = vi.fn();

// Captcha passes unless a test says otherwise (null = no failure response).
const turnstileGuard = vi.fn(async () => null);
vi.mock('@/lib/turnstile', () => ({ turnstileGuard: (...a) => turnstileGuard(...a) }));

const { POST } = await import('@/app/api/waitlist/route');

const body = (over = {}) => ({
  email: 'Founder@Example.COM',
  role: 'owner',
  tier: 'cluster',
  source: 'site',
  turnstileToken: 'tok',
  ...over,
});

const req = (b) =>
  new Request('https://www.scoutit.space/api/waitlist', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(b),
  });

describe('/api/waitlist', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    turnstileGuard.mockResolvedValue(null);
    insert.mockResolvedValue({ error: null });
  });

  it('actually persists the signup', async () => {
    const res = await POST(req(body()));

    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ ok: true });
    // The regression: this used to be zero calls.
    expect(insert).toHaveBeenCalledTimes(1);
    expect(from).toHaveBeenCalledWith('waitlist');
  });

  it('writes through the SERVICE client, since RLS denies the browser client', async () => {
    await POST(req(body()));
    // If this route is ever pointed back at `@/lib/supabaseClient`, the mocked
    // service client records nothing and this fails.
    expect(insert).toHaveBeenCalled();
  });

  it('normalises the email, because the unique index is on the raw column', async () => {
    await POST(req(body({ email: '  Founder@Example.COM  ' })));
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'founder@example.com' })
    );
  });

  it('treats a duplicate (23505) as success, not as an error', async () => {
    insert.mockResolvedValue({ error: { code: '23505', message: 'duplicate key' } });

    const res = await POST(req(body()));
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.alreadyRegistered).toBe(true);
  });

  it('does NOT claim success when the insert genuinely fails', async () => {
    insert.mockResolvedValue({ error: { code: '42501', message: 'permission denied' } });

    const res = await POST(req(body()));
    expect(res.status).toBe(500);
    expect((await res.json()).ok).toBe(false);
  });

  it('rejects an invalid email before touching the database', async () => {
    const res = await POST(req(body({ email: 'not-an-email' })));
    expect(res.status).toBe(400);
    expect(insert).not.toHaveBeenCalled();
  });

  it('requires a captcha token', async () => {
    const res = await POST(req(body({ turnstileToken: undefined })));
    expect(res.status).toBe(400);
    expect(insert).not.toHaveBeenCalled();
  });

  it('does not persist when the captcha check fails', async () => {
    turnstileGuard.mockResolvedValue(
      Response.json({ ok: false, error: 'captcha' }, { status: 403 })
    );

    const res = await POST(req(body()));
    expect(res.status).toBe(403);
    expect(insert).not.toHaveBeenCalled();
  });

  it('rejects a malformed body', async () => {
    const res = await POST(
      new Request('https://www.scoutit.space/api/waitlist', {
        method: 'POST',
        body: 'not json',
      })
    );
    expect(res.status).toBe(400);
    expect(insert).not.toHaveBeenCalled();
  });
});
