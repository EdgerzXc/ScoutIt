import { test, expect } from '@playwright/test';

test.describe('AuthClient', () => {
  let authClient;
  let supabaseClient;
  let originalAuth;

  test.beforeAll(async () => {
    // Mock env to bypass the proxy creation in supabaseClient.js
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy';

    // dynamically import after setting env
    authClient = await import('../src/lib/authClient.js');
    supabaseClient = await import('../src/lib/supabaseClient.js');
    originalAuth = supabaseClient.supabase.auth;
  });

  test.afterAll(() => {
     // Revert the proxy bypass for other tests if any
     delete process.env.NEXT_PUBLIC_SUPABASE_URL;
     delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  });

  test.beforeEach(() => {
    // Replace supabase.auth methods with spies/mocks
    supabaseClient.supabase.auth = {
      getSession: async () => ({ data: { session: 'mock-session' } }),
      onAuthStateChange: (cb) => { cb('SIGNED_IN', {}); return { data: { subscription: { unsubscribe: () => {} } } }; },
    };
  });

  test.afterEach(() => {
    // Restore original auth
    supabaseClient.supabase.auth = originalAuth;
  });

  test('getSession should correctly call supabase.auth.getSession', async () => {
    const result = await authClient.getSession();
    expect(result.data.session).toBe('mock-session');
  });

  test('onAuthStateChange should correctly call supabase.auth.onAuthStateChange', () => {
    let called = false;
    const cb = (event, session) => { called = true; };
    const result = authClient.onAuthStateChange(cb);
    expect(called).toBe(true);
    expect(result.data.subscription).toBeDefined();
  });

});
