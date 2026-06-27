"use client";

import { useEffect, useState } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { BADGE_DEFINITIONS, getAllBadges, hasBadge } from "@/lib/BadgeEngine";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import { Shield, ShieldAlert, ShieldCheck, Lock } from "lucide-react";

export default function BadgeRegistryPage() {
  const [userBadges, setUserBadges] = useState([]);

  useEffect(() => {
    const userStr = localStorage.getItem("scoutit_user");
    if (userStr) {
      const user = JSON.parse(userStr);
      setUserBadges(user.badges || [{ id: "FOUNDING_SEEKER" }]);
    } else {
      setUserBadges([{ id: "FOUNDING_SEEKER" }]);
    }
  }, []);

  const activeBadges = getAllBadges("ACTIVE");
  const soldOutBadges = getAllBadges("SOLD_OUT");

  const [claimingId, setClaimingId] = useState(null);

  const handleClaimBadge = async (badgeId) => {
    const userStr = localStorage.getItem("scoutit_user");
    if (!userStr) {
      alert("Please log in to claim a badge.");
      return;
    }
    const user = JSON.parse(userStr);
    
    setClaimingId(badgeId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const res = await fetch('/api/badges/claim', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ""
        },
        body: JSON.stringify({ badgeId, userId: user.id })
      });
      const data = await res.json();
      if (data.success) {
        const updatedBadges = data.badges;
        setUserBadges(updatedBadges);
        // update local storage
        user.badges = updatedBadges;
        localStorage.setItem("scoutit_user", JSON.stringify(user));
        alert("Badge claimed successfully!");
      } else {
        alert(data.error || "Failed to claim badge");
      }
    } catch (err) {
      console.error(err);
      alert("Error claiming badge");
    } finally {
      setClaimingId(null);
    }
  };

  return (
    <main className="min-h-screen flex flex-col bg-bg">
      <Header />
      
      <div className="flex-grow max-w-4xl w-full mx-auto px-6 py-24 sm:py-32">
        
        {/* Header Section */}
        <div className="mb-16 text-center">
          <p className="text-accent font-mono text-xs uppercase tracking-[0.3em] font-bold mb-4 drop-shadow-md">
            Milestones & Achievements
          </p>
          <h1 className="font-display text-4xl sm:text-5xl text-text-primary mb-6 drop-shadow-lg">
            ScoutIt Badge Registry
          </h1>
          <p className="font-body text-text-secondary text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            A public ledger of the platform's most exclusive honors. Badges grant lifetime privileges, massive discounts, and elevated status. Once a cohort is full, it is permanently locked.
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
              const userHasIt = hasBadge(userBadges, badge.id);
              
              return (
              <div 
                key={badge.id}
                className={`bg-surface border rounded-xl p-6 relative overflow-hidden group transition-all duration-500 ${userHasIt ? 'border-surface-variant hover:border-white/20' : 'border-white/5 opacity-80 hover:opacity-100'}`}
                style={{
                  boxShadow: userHasIt ? `inset 0 0 40px ${badge.color}05, 0 8px 30px rgba(0,0,0,0.4)` : 'inset 0 0 40px rgba(0,0,0,0.8)'
                }}
              >
                {/* Glow Effect or Shadow */}
                <div 
                  className={`absolute top-0 right-0 w-32 h-32 blur-3xl transition-opacity ${userHasIt ? 'opacity-20 group-hover:opacity-40' : 'opacity-5 group-hover:opacity-10 bg-white'}`}
                  style={{ background: userHasIt ? badge.color : undefined }}
                ></div>

                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 rounded-lg" style={{ 
                    background: userHasIt ? `${badge.color}15` : 'rgba(255,255,255,0.02)', 
                    border: userHasIt ? `1px solid ${badge.color}30` : '1px solid rgba(255,255,255,0.05)' 
                  }}>
                    {userHasIt ? (
                      <Shield size={24} color={badge.color} strokeWidth={1.5} />
                    ) : (
                      <Lock size={24} color="rgba(255,255,255,0.2)" strokeWidth={1.5} />
                    )}
                  </div>
                  {userHasIt ? (
                    <span className="font-mono text-[10px] uppercase tracking-widest px-2 py-1 rounded border border-white/10 text-white/90 bg-white/10 shadow-[0_0_10px_rgba(255,255,255,0.1)]">
                      ★ OWNED
                    </span>
                  ) : (
                    <span className="font-mono text-[10px] uppercase tracking-widest px-2 py-1 rounded border border-white/5 text-white/30 bg-black/50">
                      LOCKED SILHOUETTE
                    </span>
                  )}
                </div>

                <h3 className="font-display text-xl text-text-primary mb-2" style={{ color: userHasIt ? '#fff' : 'rgba(255,255,255,0.4)' }}>
                  {userHasIt ? badge.name : "??? RARE HONOR ???"}
                </h3>
                <p className="text-text-secondary text-sm mb-6 h-12 overflow-hidden text-ellipsis line-clamp-2" style={{ color: userHasIt ? 'var(--text-secondary)' : 'rgba(255,255,255,0.2)' }}>
                  {userHasIt ? badge.description : "Requirement details are hidden. Only the worthy may claim this."}
                </p>

                {/* Progress Bar */}
                <div className="mt-auto opacity-70 group-hover:opacity-100 transition-opacity">
                  <div className="flex justify-between font-mono text-[10px] uppercase tracking-widest mb-2" style={{ color: userHasIt ? 'var(--text-secondary)' : 'rgba(255,255,255,0.3)' }}>
                    <span>Slots Claimed</span>
                    <span style={{ color: userHasIt ? badge.color : 'rgba(255,255,255,0.5)', fontWeight: 'bold' }}>{badge.claimed} / {badge.max_slots}</span>
                  </div>
                  <div className="w-full h-1.5 bg-black rounded-full overflow-hidden border border-white/5">
                    <div 
                      className="h-full rounded-full transition-all duration-1000 ease-out"
                      style={{ 
                        width: `${(badge.claimed / badge.max_slots) * 100}%`,
                        background: userHasIt ? badge.color : 'rgba(255,255,255,0.2)',
                        boxShadow: userHasIt ? `0 0 10px ${badge.color}` : 'none'
                      }}
                    ></div>
                  </div>
                </div>

                {!userHasIt && (
                  badge.id.startsWith("PIONEER_") ? (
                    <button 
                      onClick={() => handleClaimBadge(badge.id)}
                      disabled={claimingId === badge.id}
                      className="mt-6 w-full block text-center font-mono text-[10px] uppercase tracking-[0.2em] py-3 rounded border border-white/20 bg-white/10 hover:bg-white/20 transition-colors text-white hover:text-white"
                    >
                      {claimingId === badge.id ? 'CLAIMING...' : 'CLAIM FREE BADGE →'}
                    </button>
                  ) : (
                    <Link href="/pricing" className="mt-6 block text-center font-mono text-[10px] uppercase tracking-[0.2em] py-3 rounded border border-white/5 bg-white/5 hover:bg-white/10 transition-colors text-white/50 hover:text-white">
                      Unlock Now →
                    </Link>
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
              
              return (
              <div 
                key={badge.id}
                className={`bg-[#0a0a0a] border border-border rounded-lg p-5 relative transition-all ${userHasIt ? '' : 'grayscale opacity-50 hover:opacity-80'}`}
              >
                {/* Stone texture overlay for graveyard feel */}
                {!userHasIt && (
                  <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")' }}></div>
                )}
                
                <div className="flex justify-between items-start mb-3">
                  {userHasIt ? (
                    <ShieldCheck size={20} color={badge.color} strokeWidth={1.5} />
                  ) : (
                    <ShieldAlert size={20} color="#666" strokeWidth={1.5} />
                  )}
                  {userHasIt ? (
                    <span className="font-mono text-[9px] uppercase tracking-widest text-gold-accent border border-gold-accent/30 px-1.5 rounded">
                      OWNED
                    </span>
                  ) : (
                    <span className="font-mono text-[9px] uppercase tracking-widest text-red-500 bg-red-500/10 border border-red-500/20 px-1.5 rounded">
                      YOU MISSED THIS
                    </span>
                  )}
                </div>
                
                <h3 className="font-display text-lg mb-1" style={{ color: userHasIt ? '#fff' : '#666' }}>{badge.name}</h3>
                <p className="text-xs mb-4" style={{ color: userHasIt ? 'var(--text-secondary)' : '#444' }}>
                  {badge.description}
                </p>
                
                <div className="font-mono text-[10px] uppercase tracking-widest" style={{ color: userHasIt ? badge.color : '#555' }}>
                  Closed at {badge.max_slots} slots
                </div>
              </div>
            )})}
          </div>
          <div className="text-center mt-8">
            <p className="font-mono text-[10px] uppercase tracking-widest text-text-muted">
              More exclusive honors will be announced via the Council.
            </p>
          </div>
        </div>

      </div>

      <Footer />
    </main>
  );
}
