// Supabase verifies the token against its configured CAPTCHA provider.
// Tokens are single-use, including when an auth request fails.
export async function sendMagicLink({ auth, email, origin, captchaToken, resetCaptcha }) {
  if (!captchaToken) throw new Error("Complete the security check before sending a link.");
  try {
    const { error } = await auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${origin}/auth/callback`, captchaToken },
    });
    if (error) throw error;
  } finally {
    resetCaptcha();
  }
}
