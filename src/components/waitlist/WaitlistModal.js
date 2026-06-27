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
      className="wl-overlay"
      onClick={(e) => e.target === e.currentTarget && setOpen(false)}
      role="dialog"
      aria-modal="true"
      aria-label="Join the founding waitlist"
    >
      <div className="wl-card">
        <button className="wl-close" onClick={() => setOpen(false)} aria-label="Close">✕</button>

        <span className="wl-eyebrow">◈ Founding Access</span>

        {done ? (
          <div className="wl-done">
            <div className="wl-check">✓</div>
            <h2 className="wl-title">
              {status === "already" ? "You're already on the list." : "You're on the list."}
            </h2>
            <p className="wl-sub">
              We'll reach out the moment {roleLabel ? `${roleLabel} ` : ""}access opens — with your
              founding rate locked in. No spam. No pressure.
            </p>
            <button className="wl-btn" onClick={() => setOpen(false)}>Done</button>
          </div>
        ) : (
          <>
            <h2 className="wl-title">
              Lock your founding rate{roleLabel ? <> as a <span className="wl-gold">{roleLabel}</span></> : null}.
            </h2>
            <p className="wl-sub">
              ScoutIt opens in cohorts. Founding members keep their rate forever — only the first
              20 slots per role. Drop your email and we'll bring you in first.
            </p>

            <form onSubmit={submit} className="wl-form">
              <input
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="you@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="wl-input"
                autoFocus
                required
              />
              <Turnstile 
                siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "1x00000000000000000000AA"} 
                onSuccess={(token) => setTurnstileToken(token)}
                onError={() => setError("Captcha verification failed. Please try again.")}
                options={{ theme: 'dark' }}
              />
              <button type="submit" className="wl-btn" disabled={status === "sending" || !turnstileToken}>
                {status === "sending" ? "Joining…" : "Join the Waitlist"}
              </button>
            </form>
            {status === "error" && <p className="wl-error">{error}</p>}
            <p className="wl-fine">Intelligence first. We never sell or share your email.</p>
          </>
        )}
      </div>

      <style jsx>{`
        .wl-overlay {
          position: fixed;
          inset: 0;
          z-index: 100001;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          background: rgba(0, 0, 0, 0.72);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
        }
        .wl-card {
          position: relative;
          width: 100%;
          max-width: 440px;
          background: linear-gradient(160deg, #14110b 0%, #0a0908 60%);
          border: 1px solid rgba(232, 174, 60, 0.28);
          border-radius: 16px;
          padding: 34px 30px 28px;
          box-shadow: 0 24px 80px rgba(0, 0, 0, 0.7), 0 0 60px rgba(232, 174, 60, 0.06);
        }
        .wl-close {
          position: absolute;
          top: 14px;
          right: 16px;
          background: none;
          border: none;
          color: rgba(255, 255, 255, 0.32);
          font-size: 16px;
          cursor: pointer;
          line-height: 1;
          padding: 4px;
        }
        .wl-close:hover { color: rgba(255, 255, 255, 0.7); }
        .wl-eyebrow {
          font-family: var(--font-mono, monospace);
          font-size: 11px;
          letter-spacing: 0.28em;
          text-transform: uppercase;
          color: var(--accent, #E8AE3C);
          display: block;
          margin-bottom: 14px;
        }
        .wl-title {
          font-family: Georgia, "Times New Roman", serif;
          font-size: 26px;
          line-height: 1.25;
          color: #f5f3ee;
          font-weight: 400;
          margin-bottom: 12px;
        }
        .wl-gold { color: var(--accent, #E8AE3C); }
        .wl-sub {
          font-size: 13.5px;
          line-height: 1.6;
          color: rgba(240, 237, 232, 0.62);
          margin-bottom: 22px;
        }
        .wl-form { display: flex; flex-direction: column; gap: 10px; }
        .wl-input {
          width: 100%;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.14);
          border-radius: 8px;
          padding: 14px 16px;
          color: #f5f3ee;
          font-size: 15px;
          outline: none;
          transition: border-color 0.2s;
        }
        .wl-input:focus { border-color: var(--accent, #E8AE3C); }
        .wl-btn {
          width: 100%;
          background: var(--accent-bright, #F7C64E);
          color: #0a0908;
          border: none;
          border-radius: 8px;
          padding: 14px 16px;
          font-family: var(--font-body, sans-serif);
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          cursor: pointer;
          transition: transform 0.15s, box-shadow 0.15s, background 0.15s;
        }
        .wl-btn:hover:not(:disabled) {
          background: var(--accent, #E8AE3C);
          transform: translateY(-1px);
          box-shadow: 0 8px 26px rgba(232, 174, 60, 0.25);
        }
        .wl-btn:disabled { opacity: 0.6; cursor: default; }
        .wl-error { color: #ff8f6b; font-size: 12.5px; margin-top: 10px; }
        .wl-fine {
          font-size: 11px;
          color: rgba(255, 255, 255, 0.3);
          margin-top: 14px;
          text-align: center;
        }
        .wl-done { text-align: center; padding: 6px 0; }
        .wl-check {
          width: 52px;
          height: 52px;
          margin: 0 auto 16px;
          border-radius: 50%;
          background: rgba(232, 174, 60, 0.12);
          border: 1px solid rgba(232, 174, 60, 0.4);
          color: var(--accent, #E8AE3C);
          font-size: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .wl-done .wl-title { margin-bottom: 10px; }
        .wl-done .wl-sub { margin-bottom: 22px; }
      `}</style>
    </div>
  );
}
