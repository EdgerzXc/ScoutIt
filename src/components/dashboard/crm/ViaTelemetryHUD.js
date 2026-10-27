"use client";

import { useEffect, useState } from "react";
import { Link2, TrendingUp, Users, ArrowUpRight, ShieldCheck, Activity } from "lucide-react";
import { getSession } from "@/lib/authClient";

export default function ViaTelemetryHUD() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { data: { session } } = await getSession().catch(() => ({ data: {} }));
        const token = session?.access_token;
        const res = await fetch("/api/broker/via-metrics", {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          cache: "no-store",
        });
        if (!res.ok) {
          if (res.status === 401) {
            if (alive) setLoading(false);
            return;
          }
          throw new Error("Telemetry unavailable");
        }
        const json = await res.json();
        if (alive && json.ok) {
          setData(json);
        }
      } catch (err) {
        if (alive) setError(err.message);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  if (loading) {
    return (
      <div className="p-5 rounded-2xl bg-surface border border-white/5 mb-8 animate-pulse">
        <div className="h-4 w-48 bg-white/10 rounded mb-4" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 bg-white/5 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) return null;

  const { summary, conversionRates, shareLinks } = data;

  return (
    <div className="p-4 sm:p-6 rounded-xl sm:rounded-2xl bg-surface border border-surface-variant/40 shadow-xl mb-8 relative overflow-hidden">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded bg-gold-accent/10 border border-gold-accent/20 text-gold-accent">
            <Link2 size={18} />
          </div>
          <div>
            <span className="font-mono text-xs uppercase tracking-widest text-gold-accent block">
              VIP Referral Tracking
            </span>
            <h3 className="font-headline-editorial text-base sm:text-lg text-on-surface font-semibold m-0">
              Referrals & Conversions
            </h3>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono text-text-secondary">
          <ShieldCheck size={14} className="text-emerald-400" />
          <span>Verified client traffic only</span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <div className="p-3.5 sm:p-4 rounded-xl bg-black/40 border border-white/5 flex flex-col gap-1 justify-between">
          <span className="font-mono text-xs uppercase tracking-wider text-text-secondary flex items-center justify-between">
            VIP Clicks
            <Activity size={12} className="text-gold-accent shrink-0" />
          </span>
          <span className="font-mono text-xl sm:text-2xl font-bold text-on-surface tabular-nums">
            {summary?.linkClicks ?? 0}
          </span>
          <span className="text-xs text-text-muted">Unique visitors</span>
        </div>

        <div className="p-3.5 sm:p-4 rounded-xl bg-black/40 border border-white/5 flex flex-col gap-1 justify-between">
          <span className="font-mono text-xs uppercase tracking-wider text-text-secondary flex items-center justify-between">
            Inquiries
            <Users size={12} className="text-gold-accent shrink-0" />
          </span>
          <span className="font-mono text-xl sm:text-2xl font-bold text-on-surface tabular-nums">
            {summary?.inquiries ?? 0}
          </span>
          <span className="text-xs text-text-muted">Qualified direct inquiries</span>
        </div>

        <div className="p-3.5 sm:p-4 rounded-xl bg-black/40 border border-white/5 flex flex-col gap-1 justify-between">
          <span className="font-mono text-xs uppercase tracking-wider text-text-secondary flex items-center justify-between">
            Deals Started
            <TrendingUp size={12} className="text-gold-accent shrink-0" />
          </span>
          <span className="font-mono text-xl sm:text-2xl font-bold text-gold-accent tabular-nums">
            {summary?.dealsInitiated ?? 0}
          </span>
          <span className="text-xs text-text-muted">Active negotiations</span>
        </div>

        <div className="p-3.5 sm:p-4 rounded-xl bg-black/40 border border-white/5 flex flex-col gap-1 justify-between">
          <span className="font-mono text-xs uppercase tracking-wider text-text-secondary flex items-center justify-between">
            Conversion Rate
            <ArrowUpRight size={12} className="text-emerald-400 shrink-0" />
          </span>
          <span className="font-mono text-xl sm:text-2xl font-bold text-emerald-400 tabular-nums">
            {conversionRates?.clickToInquiry ?? "0.0%"}
          </span>
          <span className="text-xs text-text-muted">Click to inquiry rate</span>
        </div>
      </div>

      {shareLinks && shareLinks.length > 0 && (
        <div className="pt-4 border-t border-white/5">
          <span className="font-mono text-[12px] uppercase tracking-wider text-text-secondary block mb-3">
            Active Priority Links ({shareLinks.length})
          </span>
          <div className="flex flex-wrap gap-2">
            {shareLinks.map((link) => (
              <div
                key={link.id}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-alt border border-white/5 text-xs font-mono"
              >
                <span className="text-gold-accent">/{link.slug}</span>
                <span className="text-text-muted">·</span>
                <span className="text-text-secondary">{link.clicks_count || 0} clicks</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
