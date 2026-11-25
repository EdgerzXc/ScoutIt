import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export function createPasswordRecoveryClient() {
  if (!url || !key) return null;

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
      storageKey: "scoutit-password-recovery",
    },
  }).auth;
}

export async function sendPasswordRecovery(auth, email, captchaToken) {
  const { error } = await auth.resetPasswordForEmail(email, { captchaToken });
  if (!error || error.code === "user_not_found" || error.code === "over_email_send_rate_limit") return;
  throw error;
}

export async function verifyPasswordRecovery(auth, email, token) {
  const { data, error } = await auth.verifyOtp({ email, token, type: "recovery" });
  if (error) throw error;
  return Boolean(data?.session?.access_token);
}
