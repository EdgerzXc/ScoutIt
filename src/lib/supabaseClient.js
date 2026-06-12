import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// If the env vars are missing (e.g. Vercel before the Supabase keys are
// configured), exporting a crashing client would take down every page that
// imports it. Instead export an inert stub: any call chain resolves to
// { data: null, error }, so callers fall back to mock data gracefully.
function makeStubClient() {
  const chain = new Proxy(function () {}, {
    get(_, prop) {
      if (prop === 'then') {
        return (resolve) =>
          resolve({ data: null, error: { message: 'Supabase is not configured' } });
      }
      return chain;
    },
    apply() {
      return chain;
    },
  });
  return chain;
}

export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : makeStubClient();
