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
  // This throws at module load, so it fails the whole BUILD, not just a page —
  // `NEXT_PUBLIC_*` values are inlined at build time, so a missing or
  // misspelled one is a build failure, not a runtime one.
  //
  // The message used to be the bare sentence below, which told a reader of the
  // Vercel build log nothing about WHICH variable was wrong. A single wrong
  // character in a name on the Vercel dashboard is invisible by eye, and the
  // generic message cost a long round of guessing on 2026-08-30. So it now
  // names the missing variable, and lists the names it CAN see.
  //
  // Names only, never values: a variable name is not a secret, a key is.
  const missing = [
    !supabaseUrl && "NEXT_PUBLIC_SUPABASE_URL",
    !supabaseAnonKey && "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  ].filter(Boolean);

  const visible = Object.keys(process.env)
    .filter((k) => k.startsWith("NEXT_PUBLIC_") || k.includes("SUPABASE"))
    .sort();

  throw new Error(
    `Missing Supabase environment variables: ${missing.join(", ")}. ` +
      `Set them on this Vercel project (Settings → Environment Variables, scope Production). ` +
      `Names currently visible to the build: ${visible.length ? visible.join(", ") : "(none)"}. ` +
      `If the name you expect is in that list, check it letter by letter — it is spelled differently somewhere.`
  );
}

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);
