"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { hasBadge, formatCharterSeatLabel, isPioneerBadge, hasAnyPioneerBadge, PIONEER_PERKS } from "@/lib/BadgeEngine";
import { supabase } from "@/lib/supabaseClient";
import { Shield, ShieldAlert, ShieldCheck, Lock, AlertCircle, CheckCircle2 } from "lucide-react";

// Public badge definitions carry historical display hex values. The page
// resolves their semantic role locally so the same cohort is legible in both
// the dark default and the opt-in White Lens.
const BADGE_TONES = Object.freeze({
  PIONEER_BROKER: { ink: "var(--sapphire)", dim: "var(--sapphire-dim)" },
  PIONEER_OWNER: { ink: "var(--green)", dim: "var(--green-dim)" },
  PIONEER_CREATOR: { ink: "var(--tier-platinum)", dim: "var(--accent-dim)" },
  FOUNDING_SEEKER: { ink: "var(--accent)", dim: "var(--accent-dim)" },
  ALPHA_CARTOGRAPHER: { ink: "var(--red)", dim: "var(--red-dim)" },
});

const toneForBadge = (badge) => BADGE_TONES[badge.id] || BADGE_TONES.FOUNDING_SEEKER;

export default function BadgeRegistryPage() {
  const [userBadges, setUserBadges] = useState([]);
  const [badgeDefs, setBadgeDefs] = useState([]);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    let alive = true;
    // Real counts (claimed/status) always come from the server, regardless of who's logged in.
    fetch("/api/badges")
      .then((res) => res.json())
      .then((data) => { if (alive) setBadgeDefs(data.definitions || []); })
      .catch((err) => {
        // Navigating away aborts the fetch — only report while still mounted.
        if (alive) console.error("Failed to load badge registry:", err);
      });

    const loadUserBadges = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: rows } = await supabase
          .from("user_badges")
          .select("badge_id, earned_at, seat_number, is_transferable")
          .eq("user_id", session.user.id);
        setUserBadges((rows || []).map((r) => ({
          id: r.badge_id,
          minted_at: r.earned_at,
          seat_number: r.seat_number,
          is_transferable: r.is_transferable,
        })));
        return;
      }
      // No real session — fall back to the dev-toolbox mock user, if any.
      const userStr = localStorage.getItem("scoutit_user");
      if (userStr) {
        const user = JSON.parse(userStr);
        setUserBadges(user.badges || []);
      }
    };
    loadUserBadges();
    return () => { alive = false; };
  }, []);

  const activeBadges = badgeDefs.filter((b) => b.status === "ACTIVE");
  const soldOutBadges = badgeDefs.filter((b) => b.status === "SOLD_OUT");

  const [claimingId, setClaimingId] = useState(null);

  const handleClaimBadge = async (badgeId) => {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    if (!token) {
      showToast("Please log in to claim a badge.");
      return;
    }

    setClaimingId(badgeId);
    try {
      const res = await fetch('/api/badges/claim', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ badgeId })
      });
      const data = await res.json();
      if (data.success) {
        setUserBadges((data.badges || []).map((b) => ({
          id: b.badge_id,
          minted_at: b.earned_at,
          seat_number: b.seat_number,
          is_transferable: b.is_transferable,
        })));
        // Refresh real counts so the progress bar reflects the new claim immediately.
        fetch("/api/badges")
          .then((r) => r.json())
          .then((d) => setBadgeDefs(d.definitions || []))
          .catch(() => {});
        showToast("Badge claimed successfully!", "success");
      } else {
        showToast(data.error || "Failed to claim badge");
      }
    } catch (err) {
      console.error(err);
      showToast("Error claiming badge");
    } finally {
      setClaimingId(null);
    }
  };

  return (
    <main className="min-h-screen min-h-dvh flex flex-col bg-[var(--bg)] badges-lens">
      <Header />
      
      {/* Toast Notification */}
      {toast && (
        <div role="status" aria-live="polite" className="fixed top-20 left-1/2 -translate-x-1/2 z-[9999] bg-surface border border-[var(--accent-border)] text-text-primary px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 animate-[slideDown_0.3s_ease-out]">
          <span className="text-accent">{toast.type === "error" ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}</span>
          <span className="text-sm font-working-title">{toast.message}</span>
        </div>
      )}

      <div className="flex-grow max-w-4xl w-full mx-auto px-6 py-24 sm:py-32">
        <div className="mb-6">
          <Link
            href="/profile"
            className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-text-muted hover:text-accent transition-colors"
          >
            ← Back to Profile
          </Link>
        </div>
        
        {/* Header Section */}
        <div className="mb-12 text-center">
          <p className="text-accent font-mono text-xs uppercase tracking-[0.12em] font-bold mb-4 drop-shadow-md">
            Milestones & Achievements
          </p>
          <h1 className="font-display text-4xl sm:text-5xl text-text-primary mb-6 drop-shadow-lg">
            ScoutIt Badge Registry
          </h1>
          <p className="font-body text-text-secondary text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            A public ledger of the platform&apos;s earned honors. Badges are staff-granted for verified contributions or claimed through the pioneer flow — they are never sold and confer no priced benefit today. Once a cohort is full, it is permanently locked.
          </p>
        </div>

        {/* Pioneer Charter Rule Notice */}
        <div className="mb-12 p-5 rounded-xl border border-[var(--accent-muted)] bg-surface text-center max-w-2xl mx-auto shadow-sm">
          <p className="font-mono text-xs uppercase tracking-[0.14em] text-accent font-bold mb-2">
            Strict Pioneer Charter Protocol
          </p>
          <p className="text-xs text-text-secondary leading-relaxed">
            Strict limit of <span className="text-text-primary font-semibold">1 Pioneer Charter per account</span> across all roles. Seats are sequentially numbered, hard-capped, and non-expiring. Charters are transferable to verified peers and carry their operational privileges.
          </p>
        </div>

        {/* ACTIVE COHORTS */}
        <div className="mb-16">
          <div className="flex items-center gap-4 mb-8">
            <h2 className="font-display text-2xl text-text-primary">Active Cohorts</h2>
            <div className="h-px bg-border flex-grow"></div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {activeBadges.map((badge) => {
              const userBadge = userBadges.find((b) => b.id === badge.id);
              const userHasIt = Boolean(userBadge);
              const tone = toneForBadge(badge);
              const seatLabel = userBadge?.seat_number ? formatCharterSeatLabel(userBadge.seat_number) : null;
              const perks = badge.perks || PIONEER_PERKS[badge.id] || null;
              const isPioneer = isPioneerBadge(badge.id);
              const userHasAnyPioneer = hasAnyPioneerBadge(userBadges);
              
              return (
              <div 
                key={badge.id}
                className={`bg-surface border rounded-xl p-6 relative overflow-hidden group transition-[border-color,box-shadow] duration-500 ${userHasIt ? 'border-[var(--accent-border)] hover:border-[var(--accent)]' : 'border-border'}`}
                style={{ boxShadow: userHasIt ? 'var(--shadow-glow-soft)' : 'var(--shadow-sm)' }}
              >
                {/* Glow Effect or Shadow */}
                <div 
                  className={`badge-ambient absolute top-0 right-0 w-32 h-32 blur-3xl transition-opacity ${userHasIt ? 'opacity-20 group-hover:opacity-40' : 'opacity-5 group-hover:opacity-10'}`}
                  style={{ background: userHasIt ? tone.ink : 'var(--text-primary)' }}
                ></div>

                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 rounded-lg" style={{ 
                    background: userHasIt ? tone.dim : 'var(--surface2)',
                    border: `1px solid ${userHasIt ? tone.ink : 'var(--border)'}`
                  }}>
                    {userHasIt ? (
                      <Shield size={24} color={tone.ink} strokeWidth={1.5} />
                    ) : (
                      <Lock size={24} color="var(--text-muted)" strokeWidth={1.5} />
                    )}
                  </div>
                  {userHasIt ? (
                    <span className="font-mono text-[12px] uppercase tracking-widest px-2 py-1 rounded border border-[var(--accent-border)] text-text-primary bg-[var(--accent-dim)]">
                      ★ OWNED{seatLabel ? ` · ${seatLabel}` : ''}
                    </span>
                  ) : (
                    <span className="font-mono text-[12px] uppercase tracking-widest px-2 py-1 rounded border border-border text-text-secondary bg-surface2">
                      LOCKED SILHOUETTE
                    </span>
                  )}
                </div>

                <h3 className="font-display text-xl text-text-primary mb-2" style={{ color: userHasIt ? 'var(--on-surface)' : 'var(--text-secondary)' }}>
                  {userHasIt ? badge.name : "??? RARE HONOR ???"}
                </h3>
                <p className="text-text-secondary text-sm mb-4 h-12 overflow-hidden text-ellipsis line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
                  {userHasIt ? badge.description : "Requirement details are hidden. Only the worthy may claim this."}
                </p>

                {/* Active Perks / Incentives Matrix */}
                {perks && (
                  <div className="mb-4 pt-3 border-t border-border flex flex-wrap gap-1.5">
                    {perks.queue_priority && (
                      <span className="font-mono text-xs uppercase tracking-wider px-2 py-0.5 rounded border border-[var(--accent-muted)] bg-surface2 text-accent">
                        Queue Priority
                      </span>
                    )}
                    {Boolean(perks.discount_pct || perks.rate_lock_percent) && (
                      <span className="font-mono text-xs uppercase tracking-wider px-2 py-0.5 rounded border border-[var(--accent-muted)] bg-surface2 text-accent">
                        {perks.discount_pct || perks.rate_lock_percent}% Rate Lock
                      </span>
                    )}
                    {Boolean(perks.priority_support || perks.support_sla_hours) && (
                      <span className="font-mono text-xs uppercase tracking-wider px-2 py-0.5 rounded border border-border bg-surface2 text-text-secondary">
                        VIP Priority SLA
                      </span>
                    )}
                    {perks.white_label_pdf && (
                      <span className="font-mono text-xs uppercase tracking-wider px-2 py-0.5 rounded border border-border bg-surface2 text-text-secondary">
                        White-Label PDF
                      </span>
                    )}
                    {Boolean(perks.charter_seal || perks.gold_seal) && (
                      <span className="font-mono text-xs uppercase tracking-wider px-2 py-0.5 rounded border border-[var(--accent-muted)] bg-surface2 text-accent">
                        Charter Gold Seal
                      </span>
                    )}
                    {Boolean(perks.monthly_connects) && (
                      <span className="font-mono text-xs uppercase tracking-wider px-2 py-0.5 rounded border border-border bg-surface2 text-text-secondary">
                        +{perks.monthly_connects} Connects/mo
                      </span>
                    )}
                    {Boolean(perks.is_transferable || perks.transferable) && (
                      <span className="font-mono text-xs uppercase tracking-wider px-2 py-0.5 rounded border border-border bg-surface2 text-text-secondary">
                        Transferable Seat
                      </span>
                    )}
                    {perks.alpha_notes && (
                      <span className="font-mono text-xs uppercase tracking-wider px-2 py-0.5 rounded border border-border bg-surface2 text-text-secondary">
                        Inner Circle Notes
                      </span>
                    )}
                    {perks.free_vault_access && (
                      <span className="font-mono text-xs uppercase tracking-wider px-2 py-0.5 rounded border border-[var(--accent-muted)] bg-surface2 text-accent">
                        Spatial Vault
                      </span>
                    )}
                    {perks.priority_bounties && (
                      <span className="font-mono text-xs uppercase tracking-wider px-2 py-0.5 rounded border border-border bg-surface2 text-text-secondary">
                        VIP Bounties
                      </span>
                    )}
                  </div>
                )}

                {/* Progress Bar */}
                <div className="mt-auto">
                  <div className="flex justify-between font-mono text-[12px] uppercase tracking-widest mb-2" style={{ color: 'var(--text-secondary)' }}>
                    <span>Slots Claimed</span>
                    <span style={{ color: userHasIt ? tone.ink : 'var(--text-secondary)', fontWeight: 'bold' }}>{badge.claimed} / {badge.max_slots}</span>
                  </div>
                  <div className="w-full h-1.5 bg-surface2 rounded-full overflow-hidden border border-border">
                    <div 
                      className="h-full rounded-full transition-[width] duration-1000 ease-out"
                      style={{ 
                        width: `${(badge.claimed / badge.max_slots) * 100}%`,
                        background: userHasIt ? tone.ink : 'var(--border-solid)',
                        boxShadow: userHasIt ? 'var(--shadow-glow-soft)' : 'none'
                      }}
                    ></div>
                  </div>
                </div>

                {!userHasIt && (
                  isPioneer ? (
                    userHasAnyPioneer ? (
                      <div className="mt-6 w-full text-center font-mono text-[12px] uppercase tracking-[0.12em] py-3 rounded border border-border bg-surface2 text-text-muted">
                        1 Pioneer Per Account Limit Reached
                      </div>
                    ) : (
                      <button 
                        onClick={() => handleClaimBadge(badge.id)}
                        disabled={claimingId === badge.id}
                        className="badge-claim-btn mt-6 w-full block text-center font-mono text-[12px] uppercase tracking-[0.12em] py-3 rounded border transition-colors"
                      >
                        {claimingId === badge.id ? 'CLAIMING...' : 'CLAIM FREE BADGE →'}
                      </button>
                    )
                  ) : (
                    <span className="mt-6 block text-center font-mono text-[12px] uppercase tracking-[0.12em] py-3 rounded border border-border bg-surface2 text-text-secondary">
                      Staff-granted honor — no purchase path
                      {" "}<Link className="underline hover:text-on-surface" href="/contact">Ask about honors →</Link>
                    </span>
                  )
                )}
              </div>
            )})}
          </div>
        </div>

        {/* HISTORICAL / SOLD OUT COHORTS */}
        <div>
          <div className="flex items-center gap-4 mb-8">
            <h2 className="font-display text-2xl text-text-secondary">Historical Honors</h2>
            <div className="h-px bg-border flex-grow"></div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {soldOutBadges.map((badge) => {
              const userHasIt = hasBadge(userBadges, badge.id);
              const tone = toneForBadge(badge);
              const perks = badge.perks || PIONEER_PERKS[badge.id] || null;
              
              return (
              <div 
                key={badge.id}
                className="bg-surface border border-border rounded-lg p-5 relative transition-[border-color,box-shadow] duration-300"
              >
                {/* Stone texture overlay for graveyard feel */}
                {!userHasIt && (
                  <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")' }}></div>
                )}
                
                <div className="flex justify-between items-start mb-3">
                  {userHasIt ? (
                    <ShieldCheck size={20} color={tone.ink} strokeWidth={1.5} />
                  ) : (
                    <ShieldAlert size={20} color="var(--text-muted)" strokeWidth={1.5} />
                  )}
                  {userHasIt ? (
                    <span className="font-mono text-[12px] uppercase tracking-widest text-gold-accent border border-gold-accent/30 px-1.5 rounded">
                      OWNED
                    </span>
                  ) : (
                    <span className="font-mono text-[12px] uppercase tracking-widest border px-1.5 rounded" style={{ color: 'var(--text-primary)', background: 'var(--red-dim)', borderColor: 'var(--red)' }}>
                      YOU MISSED THIS
                    </span>
                  )}
                </div>
                
                <h3 className="font-display text-lg mb-1" style={{ color: userHasIt ? 'var(--text-primary)' : 'var(--text-secondary)' }}>{badge.name}</h3>
                <p className="text-xs mb-3" style={{ color: 'var(--text-secondary)' }}>
                  {badge.description}
                </p>

                {perks && (
                  <div className="mb-3 pt-2 border-t border-border flex flex-wrap gap-1">
                    {perks.free_vault_access && (
                      <span className="font-mono text-xs uppercase tracking-wider px-1.5 py-0.5 rounded border border-border bg-surface2 text-text-muted">
                        Spatial Vault
                      </span>
                    )}
                    {perks.admin_access && (
                      <span className="font-mono text-xs uppercase tracking-wider px-1.5 py-0.5 rounded border border-border bg-surface2 text-text-muted">
                        Admin Access
                      </span>
                    )}
                    {perks.charter_seal && (
                      <span className="font-mono text-xs uppercase tracking-wider px-1.5 py-0.5 rounded border border-border bg-surface2 text-text-muted">
                        Charter Seal
                      </span>
                    )}
                    {Boolean(perks.monthly_connects) && (
                      <span className="font-mono text-xs uppercase tracking-wider px-1.5 py-0.5 rounded border border-border bg-surface2 text-text-muted">
                        +{perks.monthly_connects} Connects/mo
                      </span>
                    )}
                  </div>
                )}
                
                <div className="font-mono text-[12px] uppercase tracking-widest" style={{ color: userHasIt ? tone.ink : 'var(--text-muted)' }}>
                  Closed at {badge.max_slots} slots
                </div>
              </div>
            )})}
          </div>
          <div className="text-center mt-8">
            <p className="font-mono text-[12px] uppercase tracking-widest text-text-muted">
              More exclusive honors will be announced via the Council.
            </p>
          </div>
        </div>

      </div>

      <Footer />
    </main>
  );
}
