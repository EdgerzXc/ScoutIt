"use client";

import { useState, useEffect, useCallback } from "react";
import { joinWaitlist } from "@/lib/waitlist";
import { Turnstile } from '@marsidev/react-turnstile';

// Single global waitlist modal. Mounted once in the root layout; opened from
// anywhere by dispatching:
//   window.dispatchEvent(new CustomEvent("scoutit:open-waitlist",
//     { detail: { role, tier, source } }));
const OPEN_EVENT = "scoutit:open-waitlist";

const ROLE_LABELS = {
  seeker: "Seeker",
  owner: "Property Owner",
  broker: "Broker",
  photographer: "Photographer",
  researcher: "Researcher",
};

export default function WaitlistModal() {
  const [open, setOpen] = useState(false);
  const [ctx, setCtx] = useState({ role: null, tier: null, source: "site" });
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle"); // idle | sending | done | already | error
  const [error, setError] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");

  const reset = useCallback(() => {
    setEmail("");
    setStatus("idle");
    setError("");
  }, []);

  useEffect(() => {
    const onOpen = (e) => {
      setCtx({
        role: e.detail?.role ?? null,
        tier: e.detail?.tier ?? null,
        source: e.detail?.source ?? "site",
      });
      reset();
      setOpen(true);
    };
    window.addEventListener(OPEN_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_EVENT, onOpen);
  }, [reset]);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (!open) return null;

  const roleLabel = ctx.role ? ROLE_LABELS[ctx.role] || ctx.role : null;
  const done = status === "done" || status === "already";

  const submit = async (e) => {
    e.preventDefault();
    setStatus("sending");
    setError("");
    const res = await joinWaitlist({ email, role: ctx.role, tier: ctx.tier, source: ctx.source, turnstileToken });
    if (!res.ok) {
      setStatus("error");
      setError(res.error || "Something went wrong.");
      return;
    }
    setStatus(res.already ? "already" : "done");
  };

  return (
    <div
      className="fixed inset-0 z-[100001] flex items-center justify-center p-5 bg-background/70 backdrop-blur-md"
      onClick={(e) => e.target === e.currentTarget && setOpen(false)}
      role="dialog"
      aria-modal="true"
      aria-label="Join the founding waitlist"
    >
      <div className="relative w-full max-w-[440px] bg-surface border border-gold-accent/30 rounded-2xl px-7 pt-8 pb-7 shadow-[0_24px_80px_rgba(0,0,0,0.7),0_0_60px_rgba(232,174,60,0.06)]">
        <button className="absolute top-3.5 right-4 bg-transparent border-none text-on-surface/30 text-base cursor-pointer leading-none p-1 hover:text-on-surface/70" onClick={() => setOpen(false)} aria-label="Close">✕</button>

        <span className="block font-label-caps text-[11px] tracking-widest uppercase text-gold-accent mb-3.5">◈ Founding Access</span>

        {done ? (
          <div className="text-center py-1.5">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-gold-accent/10 border border-gold-accent/40 text-gold-accent text-2xl flex items-center justify-center">✓</div>
            <h2 className="font-headline-editorial text-[26px] leading-tight text-on-surface font-normal mb-2.5">
              {status === "already" ? "You're already on the list." : "You're on the list."}
            </h2>
            <p className="text-[13.5px] leading-relaxed text-text-secondary mb-5.5">
              We&apos;ll reach out the moment {roleLabel ? `${roleLabel} ` : ""}access opens — with your
              founding rate locked in. No spam. No pressure.
            </p>
            <button className="w-full bg-gold-accent text-background border-none rounded-lg p-3.5 font-label-caps text-[13px] font-bold tracking-wide uppercase cursor-pointer transition-all hover:-translate-y-px hover:shadow-[0_8px_26px_rgba(232,174,60,0.25)]" onClick={() => setOpen(false)}>Done</button>
          </div>
        ) : (
          <>
            <h2 className="font-headline-editorial text-[26px] leading-tight text-on-surface font-normal mb-3">
              Lock your founding rate{roleLabel ? <> as a <span className="text-gold-accent">{roleLabel}</span></> : null}.
            </h2>
            <p className="text-[13.5px] leading-relaxed text-text-secondary mb-5">
              ScoutIt opens in cohorts. Founding members keep their rate forever — only the first
              20 slots per role. Drop your email and we&apos;ll bring you in first.
            </p>

            <form onSubmit={submit} className="flex flex-col gap-2.5">
              <input
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="you@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-on-surface/5 border border-on-surface/10 rounded-lg p-3.5 text-on-surface text-[15px] outline-none transition-colors focus:border-gold-accent"
                autoFocus
                required
              />
              <Turnstile 
                siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "1x00000000000000000000AA"} 
                onSuccess={(token) => setTurnstileToken(token)}
                onError={() => setError("Captcha verification failed. Please try again.")}
                options={{ theme: 'dark' }}
              />
              <button type="submit" className="w-full bg-gold-accent-bright text-background border-none rounded-lg p-3.5 font-label-caps text-[13px] font-bold tracking-wide uppercase cursor-pointer transition-all hover:-translate-y-px hover:bg-gold-accent hover:shadow-[0_8px_26px_rgba(232,174,60,0.25)] disabled:opacity-60 disabled:cursor-default" disabled={status === "sending" || !turnstileToken}>
                {status === "sending" ? "Joining…" : "Join the Waitlist"}
              </button>
            </form>
            {status === "error" && <p className="text-[#ff8f6b] text-[12.5px] mt-2.5">{error}</p>}
            <p className="text-[11px] text-on-surface/30 mt-3.5 text-center">Intelligence first. We never sell or share your email.</p>
          </>
        )}
      </div>
    </div>
  );
}
