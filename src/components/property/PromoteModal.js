"use client";

import { useState, useEffect } from "react";
import { X, Copy, Check, Lock, Sparkles } from "lucide-react";
import { getCurrentRole, getCurrentTier } from "@/lib/entitlements";
import GlassPanel from "../ui/GlassPanel";

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
        <div className="text-[11px] font-label-caps tracking-widest text-gold-accent uppercase">
          {label}
        </div>
        <button
          onClick={handleCopy}
          className="text-xs text-on-surface/50 hover:text-gold-accent flex items-center gap-1 transition-colors"
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

export default function PromoteModal({ isOpen, onClose, propertyData, link }) {
  const [role, setRole] = useState('seeker');
  const [tier, setTier] = useState('starry');
  
  useEffect(() => {
    setRole(getCurrentRole() || 'seeker');
    setTier(getCurrentTier() || 'starry');
  }, [isOpen]);
  
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const generateCopy = async (regenerate = false) => {
    setLoading(true);
    setError(null);
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
      const result = await res.json();
      
      if (!res.ok) throw new Error(result.error || "Failed to generate");
      
      setData(result.data);
    } catch (err) {
      setError(err.message);
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
              <h2 className="font-mono text-sm uppercase tracking-[0.15em] font-semibold text-gold-accent">1-Click AI Promote</h2>
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
              <div className="text-[11px] font-label-caps tracking-widest text-gold-accent uppercase animate-pulse">
                Assimilating Intelligence...
              </div>
            </div>
          )}

          {error && (
            <div className="bg-error/10 border border-error text-error p-4 rounded text-sm mb-4">
              {error}
            </div>
          )}

          {data && (
            <div className="animate-[fadeIn_0.3s_ease]">
              <p className="text-sm text-text-secondary mb-6">
                Your space intelligence has been distilled into three strategic formats. 
                Optimized for engagement and ready to share.
              </p>

              <CopyBox label="Short Summary (X / WhatsApp)" text={data.fastPitch} />

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
