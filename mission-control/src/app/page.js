"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Shield, ArrowRight, CheckCircle2, AlertCircle } from "lucide-react";

const GOOGLE_AUTH_ENABLED = process.env.NEXT_PUBLIC_SUPABASE_GOOGLE_AUTH_ENABLED === "true";

const ACCESS_ERROR_MESSAGES = {
  NotAuthorized:
    "That account isn't set up as Mission Control staff, or access has been deactivated. Ask a Super Admin to check Staff IAM.",
  AuthError: "The sign-in link failed or expired. Request a new one below.",
};

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const searchParams = useSearchParams();
  const accessError = ACCESS_ERROR_MESSAGES[searchParams.get("error")] ?? null;
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle"); // idle, loading, success, error
  const [errorMessage, setErrorMessage] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setStatus("loading");
    setErrorMessage("");

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;
      setStatus("success");
    } catch (err) {
      console.error("Login error:", err);
      setErrorMessage(err.message || "Failed to send magic link.");
      setStatus("error");
    }
  };

  // Google SSO is rendered only after an explicit deployment flag confirms
  // that the Supabase provider and redirect allowlist have been configured.
  const handleGoogle = async () => {
    setStatus("loading");
    setErrorMessage("");
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
      // On success the browser navigates away to Google — no state to set.
    } catch (err) {
      console.error("Google login error:", err);
      setErrorMessage(err.message || "Google sign-in failed.");
      setStatus("error");
    }
  };

  return (
    <div className="min-h-screen bg-[#0d0d0d] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#121212] border border-white/10 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[200px] h-[200px] bg-[#E8AE3C] rounded-full blur-[100px] opacity-10 pointer-events-none" />

        <div className="flex justify-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-black/50 border border-white/5 flex items-center justify-center">
            <Shield className="w-6 h-6 text-[#E8AE3C]" />
          </div>
        </div>

        <h1 className="text-2xl font-semibold text-white text-center tracking-tight mb-2">
          Mission Control
        </h1>
        <p className="text-white/70 text-center text-sm mb-8">
          Secure staff access only. Enter your email to receive a magic link.
        </p>

        {accessError && (
          <div className="flex items-start gap-2 text-red-400 text-xs bg-red-400/10 p-3 rounded-lg border border-red-400/20 mb-6">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <p>{accessError}</p>
          </div>
        )}

        {status === "success" ? (
          <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 flex flex-col items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-green-400" />
            <p className="text-green-400 text-sm text-center">
              Magic link sent! Check your inbox to sign in.
            </p>
            <button
              onClick={() => setStatus("idle")}
              className="text-xs text-white/70 hover:text-white mt-2 transition-colors"
            >
              Try another email
            </button>
          </div>
        ) : (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="staff@scoutit.com"
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/70 focus:outline-none focus:border-[#E8AE3C]/50 focus:ring-1 focus:ring-[#E8AE3C]/50 transition-all"
              />
            </div>

            {status === "error" && (
              <div className="flex items-start gap-2 text-red-400 text-xs bg-red-400/10 p-3 rounded-lg border border-red-400/20">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <p>{errorMessage}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={status === "loading" || !email}
              className="w-full bg-[#E8AE3C] hover:bg-[#F7C64E] text-black font-medium rounded-xl px-4 py-3 flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {status === "loading" ? (
                "Sending..."
              ) : (
                <>
                  Send Magic Link
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
            {GOOGLE_AUTH_ENABLED && (
              <>
                <div className="flex items-center gap-3 py-1">
                  <div className="flex-1 h-px bg-white/10" />
                  <span className="text-[12px] uppercase tracking-widest text-white/70">or</span>
                  <div className="flex-1 h-px bg-white/10" />
                </div>

                <button
                  type="button"
                  onClick={handleGoogle}
                  disabled={status === "loading"}
                  className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white/90 font-medium rounded-xl px-4 py-3 flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
                    <path fill="#EA4335" d="M12 5.04c1.61 0 3.05.55 4.19 1.64l3.12-3.12C17.4 1.77 14.9.75 12 .75 7.61.75 3.82 3.27 1.98 6.94l3.66 2.84C6.5 7.09 9.02 5.04 12 5.04z" />
                    <path fill="#4285F4" d="M23.25 12.26c0-.83-.07-1.62-.21-2.39H12v4.53h6.32c-.27 1.46-1.1 2.7-2.34 3.53l3.58 2.78c2.09-1.93 3.69-4.78 3.69-8.45z" />
                    <path fill="#FBBC05" d="M5.64 14.22a6.96 6.96 0 0 1 0-4.44L1.98 6.94a11.25 11.25 0 0 0 0 10.12l3.66-2.84z" />
                    <path fill="#34A853" d="M12 23.25c3.04 0 5.59-1 7.45-2.72l-3.58-2.78c-.99.67-2.28 1.06-3.87 1.06-2.98 0-5.5-2.05-6.36-4.81l-3.66 2.84C3.82 20.73 7.61 23.25 12 23.25z" />
                  </svg>
                  Sign in with Google
                </button>
              </>
            )}
          </form>
        )}
      </div>

      <div className="mt-8 text-center">
        <p className="text-white/70 text-xs font-mono uppercase tracking-widest">
          ScoutIt Space Intelligence
        </p>
      </div>
    </div>
  );
}
