"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Shield, ArrowRight, CheckCircle2, AlertCircle } from "lucide-react";

export default function LoginPage() {
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
        <p className="text-white/50 text-center text-sm mb-8">
          Secure staff access only. Enter your email to receive a magic link.
        </p>

        {status === "success" ? (
          <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 flex flex-col items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-green-400" />
            <p className="text-green-400 text-sm text-center">
              Magic link sent! Check your inbox to sign in.
            </p>
            <button
              onClick={() => setStatus("idle")}
              className="text-xs text-white/50 hover:text-white mt-2 transition-colors"
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
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-[#E8AE3C]/50 focus:ring-1 focus:ring-[#E8AE3C]/50 transition-all"
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
          </form>
        )}
      </div>

      <div className="mt-8 text-center">
        <p className="text-white/30 text-xs font-mono uppercase tracking-widest">
          ScoutIt Space Intelligence
        </p>
      </div>
    </div>
  );
}
