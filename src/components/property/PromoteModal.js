"use client";

import { useState, useEffect } from "react";
import { X, Copy, Check, Lock, Sparkles } from "lucide-react";
import { getCurrentRole, getCurrentTier } from "@/lib/entitlements";
import GlassPanel from "../ui/GlassPanel";
import { buildPromoPack } from "@/lib/shareBriefing";
import { promoteFailureState } from "@/components/property/promoteFallback";

function MinorLockSection() {
  return (
    <div className="relative w-full h-[120px] rounded overflow-hidden border border-surface-variant bg-surface mt-4">
      {/* Blurred mock content */}
      <div className="absolute inset-0 p-4 filter blur-[6px] opacity-40 pointer-events-none select-none flex flex-col gap-2">
        <div className="h-4 bg-surface-variant w-3/4 rounded" />
        <div className="h-4 bg-surface-variant w-full rounded" />
        <div className="h-4 bg-surface-variant w-5/6 rounded" />
        <div className="h-4 bg-surface-variant w-1/2 rounded mt-2" />
      </div>
      
      {/* Overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center p-4 bg-gradient-to-t from-background/80 to-transparent">
        <Lock size={20} className="text-gold-accent mb-2" />
        <div className="text-[12px] font-label-caps tracking-widest text-gold-accent uppercase mb-3 text-center">
          Premium AI PR Suite Locked
        </div>
        <div className="bg-gold-accent text-background font-bold text-sm px-4 py-2 rounded uppercase tracking-wider">
          Included in Premium Tiers
        </div>
      </div>
    </div>
  );
}

function CopyBox({ label, text }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-2">
        <div className="text-[12px] font-label-caps tracking-widest text-gold-accent uppercase">
          {label}
        </div>
        <button
          onClick={handleCopy}
          className="text-xs text-on-surface/70 hover:text-gold-accent flex items-center gap-1 transition-colors"
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <div className="bg-background/80 border border-on-surface/10 rounded p-4 text-sm text-on-surface leading-relaxed whitespace-pre-wrap font-serif focus-within:border-gold-accent focus-within:shadow-[0_0_0_1px_rgba(232,174,60,0.2)] transition-all">
        {text}
      </div>
    </div>
  );
}

// NOTE (2026-08-13): the same three formats are now also available, ungated,
// inside ShareModal — built client-side by buildPromoPack() from the listing's
// own recorded facts, with no AI call and no tier resolution. This modal
// remains the AI-drafted route; its tier gate is decided server-side in
// /api/ai/promote (and is currently open to everyone while the
// `pre_launch_free_mode` flag is on). Do not re-add a client-side gate here —
// the paywall used to live in the UI only, which is exactly the hole §45 closed.
export default function PromoteModal({ isOpen, onClose, propertyData, link }) {
  const [role, setRole] = useState('seeker');
  const [tier, setTier] = useState('starry');
  
  useEffect(() => {
    setRole(getCurrentRole() || 'seeker');
    setTier(getCurrentTier() || 'starry');
  }, [isOpen]);
  
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [source, setSource] = useState(null);
  // Non-null when the AI path failed and the local pack is standing in.
  const [degraded, setDegraded] = useState(null);

  // A-014: a failed AI call is not a reason to show the user nothing.
  // buildPromoPack() produces the same three formats from this listing's own
  // recorded facts with no network call at all, so every failure path below
  // degrades to it instead of terminating. `source` stays truthful so the
  // header never presents the local pack as the AI draft.
  const degradeToLocalPack = (failure) => {
    setDegraded(failure);
    setData(buildPromoPack(propertyData, link));
    setSource("factsheet");
  };

  const generateCopy = async (regenerate = false) => {
    setLoading(true);
    setDegraded(null);
    try {
      const res = await fetch("/api/ai/promote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          property: propertyData,
          link,
          role,
          tier
        }),
      });
      const result = await res.json().catch(() => ({}));

      if (!res.ok) {
        degradeToLocalPack(
          promoteFailureState({
            status: res.status,
            // Present on a 429 from /api/ai/promote; a proxy can strip it,
            // which promoteFailureState renders as words rather than a guess.
            retryAfterSeconds: res.headers.get("Retry-After"),
          })
        );
        return;
      }

      setData(result.data);
      setSource(result.source || null);
    } catch (err) {
      // A thrown fetch means offline or DNS — still no reason to show nothing,
      // because the local pack needs neither. The advisory below carries the
      // message, so there is no separate error string to sanitise and render.
      degradeToLocalPack(promoteFailureState({ status: 0 }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && !data && !loading) {
      generateCopy(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  if (!isOpen) return null;

  const isUnlocked = data?.executiveSummary != null;

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-[#0a0908]/85 backdrop-blur-sm animate-[fadeIn_0.2s_ease]">
      <div className="relative w-full max-w-2xl max-h-[85vh] flex flex-col">
        <GlassPanel className="flex flex-col rounded-xl overflow-hidden shadow-[0_24px_60px_rgba(0,0,0,0.6)] h-full max-h-[85vh]">
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-white/5 bg-[#0e0e0e]/40">
            <div className="flex items-center gap-2 text-gold-accent">
              <Sparkles size={18} />
              <h2 className="font-mono text-sm uppercase tracking-[0.12em] font-semibold text-gold-accent">1-Click AI Promote</h2>
            </div>
            <button onClick={onClose} className="p-1 text-[#f0ede8]/50 hover:text-white transition-colors rounded">
              <X size={20} />
            </button>
          </div>

          {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 relative">
          
          {loading && !data && (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-12 h-12 rounded-full border-2 border-gold-accent/20 border-t-gold-accent animate-spin mb-4" />
              <div className="text-[12px] font-label-caps tracking-widest text-gold-accent uppercase animate-pulse">
                Assimilating Intelligence...
              </div>
            </div>
          )}

          {/* A-014: this used to be a red error block that replaced the content.
              It is now an advisory that sits ABOVE working content, because the
              local pack below is a real answer rather than a consolation. Red
              would overstate it — nothing is broken from the user's side, and
              the only cool-shifted pixel on a black-and-gold page reads as an
              alarm the situation does not warrant. */}
          {degraded && (
            <div
              role="status"
              aria-live="polite"
              className="mb-5 rounded border border-gold-accent/25 bg-gold-accent/[0.06] p-4
                         motion-safe:animate-[fadeIn_200ms_cubic-bezier(0.23,1,0.32,1)]"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-[12px] font-label-caps tracking-widest uppercase text-gold-accent mb-1">
                    {degraded.kind === "rate-limited" ? "AI drafting is busy" : "AI drafting is unavailable"}
                  </div>
                  <p className="text-sm text-text-secondary leading-relaxed">
                    {degraded.message} The copy below is ready to use in the meantime.
                  </p>
                </div>

                {/* Only offered where retrying is meaningful. A retry button on
                    an unavailable service is a button that exists to disappoint. */}
                {degraded.kind === "rate-limited" && (
                  <button
                    onClick={() => generateCopy(true)}
                    disabled={loading}
                    className="shrink-0 rounded border border-gold-accent/40 px-3 py-1.5
                               font-mono text-[11px] uppercase tracking-[0.12em] text-gold-accent
                               transition-[transform,background-color,border-color] duration-150 ease-out
                               hover:bg-gold-accent/10 hover:border-gold-accent/70
                               active:scale-[0.97]
                               focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2
                               focus-visible:outline-gold-accent
                               disabled:opacity-40 disabled:pointer-events-none"
                  >
                    {loading ? "Retrying" : "Retry"}
                  </button>
                )}
              </div>
            </div>
          )}

          {data && (
            <div className="animate-[fadeIn_0.3s_ease]">
              <p className="text-sm text-text-secondary mb-2">
                Promotional copy built strictly from this listing&apos;s recorded specs — nothing invented, ready to share.
              </p>
              <p className="text-[12px] font-label-caps tracking-widest uppercase text-text-secondary/70 mb-6">
                {source === "ai" ? "AI-drafted · grounded in verified listing data" : "Composed from verified listing data"}
              </p>

              {/* Relabelled 2026-08-13: this said "X / WhatsApp". Neither is
                  the Philippine default — listings get forwarded on Viber and
                  Messenger, which is also why ShareModal now leads with them. */}
              <CopyBox label="Short Summary (Viber / X)" text={data.fastPitch} />

              {isUnlocked ? (
                <>
                  <CopyBox label="The Executive Summary (LinkedIn / Email)" text={data.executiveSummary} />
                  <CopyBox label="The Editorial Hook (Facebook / Instagram)" text={data.editorialHook} />
                </>
              ) : (
                <MinorLockSection />
              )}
            </div>
          )}
        </div>
        </GlassPanel>
      </div>
    </div>
  );
}
