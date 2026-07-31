import { createBrowserClient } from "@supabase/ssr";

// Mission Control browser client (Client Components only).
//
// MUST be @supabase/ssr's createBrowserClient, NOT @supabase/supabase-js's
// createClient: it uses the PKCE flow and stores the auth state (incl. the
// PKCE code verifier) in COOKIES. That's what lets the magic-link sign-in
// hand a `?code=` to /auth/callback, where the server client
// (createServerClient) reads the same cookie and completes
// exchangeCodeForSession. The plain createClient defaults to the implicit
// flow (tokens in the URL #hash) + localStorage, which the server can't
// read — so the callback always failed with ?error=AuthError.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables");
}

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);
