import fs from 'node:fs';
import path from 'node:path';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  GOOGLE_OAUTH_CALLBACK_PATH,
  getRedirectUri,
  buildConsentUrl,
  exchangeCodeForTokens,
} from '../calendar/googleOAuth';

const readSrc = (relPath) => fs.readFileSync(path.join(process.cwd(), relPath), 'utf8');

describe('Google OAuth Redirect URI contract', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      GOOGLE_OAUTH_CLIENT_ID: 'test-google-client-id.apps.googleusercontent.com',
      GOOGLE_OAUTH_CLIENT_SECRET: 'test-google-client-secret',
      NEXT_PUBLIC_SITE_URL: 'https://www.scoutit.space',
    };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  it('defines the canonical callback path as /api/oauth/google/callback', () => {
    expect(GOOGLE_OAUTH_CALLBACK_PATH).toBe('/api/oauth/google/callback');
    expect(getRedirectUri()).toBe('https://www.scoutit.space/api/oauth/google/callback');
  });

  it('embeds the exact redirect_uri in the consent URL', () => {
    const state = 'test-signed-state-123';
    const consentUrl = buildConsentUrl(state);
    const parsed = new URL(consentUrl);

    expect(parsed.origin).toBe('https://accounts.google.com');
    expect(parsed.pathname).toBe('/o/oauth2/v2/auth');
    expect(parsed.searchParams.get('redirect_uri')).toBe(getRedirectUri());
    expect(parsed.searchParams.get('client_id')).toBe('test-google-client-id.apps.googleusercontent.com');
    expect(parsed.searchParams.get('state')).toBe(state);
    expect(parsed.searchParams.get('response_type')).toBe('code');
  });

  it('sends the identical redirect_uri in token exchange without real network calls', async () => {
    let capturedUrl = null;
    let capturedBody = null;

    global.fetch = vi.fn().mockImplementation(async (url, options) => {
      capturedUrl = url;
      capturedBody = options?.body ? Object.fromEntries(new URLSearchParams(options.body.toString())) : null;

      return {
        ok: true,
        json: async () => ({
          access_token: 'mock-access-token',
          refresh_token: 'mock-refresh-token',
          expires_in: 3600,
          scope: 'openid email https://www.googleapis.com/auth/calendar.events',
        }),
      };
    });

    const result = await exchangeCodeForTokens('mock-auth-code');

    expect(capturedUrl).toBe('https://oauth2.googleapis.com/token');
    expect(capturedBody).toEqual({
      code: 'mock-auth-code',
      client_id: 'test-google-client-id.apps.googleusercontent.com',
      client_secret: 'test-google-client-secret',
      redirect_uri: getRedirectUri(),
      grant_type: 'authorization_code',
    });
    expect(capturedBody.redirect_uri).toBe(getRedirectUri());
    expect(result.access_token).toBe('mock-access-token');
  });

  it('source contract: ensures real callback route exists and no active code references /api/calendar/callback', () => {
    const callbackExists = fs.existsSync(path.join(process.cwd(), 'src/app/api/oauth/google/callback/route.js'));
    expect(callbackExists).toBe(true);

    const oldCallbackExists = fs.existsSync(path.join(process.cwd(), 'src/app/api/calendar/callback/route.js'));
    expect(oldCallbackExists).toBe(false);

    const startRoute = readSrc('src/app/api/oauth/google/start/route.js');
    const callbackRoute = readSrc('src/app/api/oauth/google/callback/route.js');
    const oauthHelper = readSrc('src/lib/calendar/googleOAuth.js');

    expect(startRoute).not.toContain('/api/calendar/callback');
    expect(callbackRoute).not.toContain('/api/calendar/callback');
    expect(oauthHelper).not.toContain('/api/calendar/callback');
  });
});
