import { supabase } from './supabaseClient';

export const getSession = async () => {
  return await supabase.auth.getSession();
};

export const onAuthStateChange = (callback) => {
  return supabase.auth.onAuthStateChange(callback);
};

// ─────────────────────────────────────────────────────────────────────────
// CAPTCHA ON AUTH
//
// Supabase can enforce a CAPTCHA on sign-up, sign-in and OTP requests
// (Dashboard → Authentication → Attack Protection). Once that's ON, Supabase
// REJECTS any of those calls that arrive without options.captchaToken —
// which would lock every user out, including existing ones.
//
// So captchaToken is threaded through here BEFORE the dashboard toggle is
// flipped. It's optional: while the toggle is off, passing it is harmless,
// and omitting it still works. That ordering is what makes enabling the
// setting a non-event instead of an outage.
//
// The token comes from <TurnstileGate />. It is SINGLE-USE — if one of these
// calls fails, the caller must reset the widget before retrying.
// ─────────────────────────────────────────────────────────────────────────

export const signUp = async (email, password, metadata, captchaToken) => {
  const options = {};
  if (metadata) options.data = metadata;
  if (captchaToken) options.captchaToken = captchaToken;
  return await supabase.auth.signUp({
    email,
    password,
    ...(Object.keys(options).length ? { options } : {}),
  });
};

export const signInWithPassword = async (email, password, captchaToken) => {
  return await supabase.auth.signInWithPassword({
    email,
    password,
    ...(captchaToken ? { options: { captchaToken } } : {}),
  });
};

export const signInWithOAuth = async (provider, options) => {
  // OAuth redirects to the provider, so Supabase's CAPTCHA doesn't apply.
  return await supabase.auth.signInWithOAuth({ provider, options });
};

export const signInWithOtp = async (email, captchaToken) => {
  return await supabase.auth.signInWithOtp({
    email,
    ...(captchaToken ? { options: { captchaToken } } : {}),
  });
};

export const verifyOtp = async (email, token) => {
  return await supabase.auth.verifyOtp({ email, token, type: 'email' });
};

// ─────────────────────────────────────────────────────────────────────────
// SIGN OUT
//
// SECURITY: before 2026-07-29 every "Sign Out" button in the app did only
// `localStorage.removeItem("scoutit_user")` and redirected. That clears the
// app's own profile cache but leaves the SUPABASE session — access token
// AND refresh token — sitting in localStorage and valid on the server. The
// user looked signed out while their session was still live, which on a
// shared or public computer is a false sense of security and a real
// account-takeover path.
//
// scope:
//   'global' (default) — revokes the refresh token, killing every session
//                        on every device. Right default for "sign out" on
//                        a device someone might not control.
//   'local'            — this browser only.
//
// Always clears local state even if the network call fails: a user who
// pressed Sign Out on a borrowed laptop must not stay logged in because
// their wifi dropped.
// ─────────────────────────────────────────────────────────────────────────
export const signOut = async (scope = 'global') => {
  let error = null;
  try {
    const result = await supabase.auth.signOut({ scope });
    error = result?.error || null;
  } catch (err) {
    error = err;
  }

  // Best-effort local teardown, always.
  try {
    localStorage.removeItem('scoutit_user');
    // Supabase persists its own session under sb-<ref>-auth-token. signOut()
    // normally removes it, but if the call failed we must not leave it behind.
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith('sb-') && key.endsWith('-auth-token')) {
        localStorage.removeItem(key);
      }
    }
  } catch {
    /* private mode / storage disabled */
  }

  return { error };
};
