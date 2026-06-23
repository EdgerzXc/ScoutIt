"use client";

import { useState } from "react";
import { Lock } from "lucide-react";
import { BADGE_REGISTRY } from "@/lib/badges";

export default function VaultOfHonor() {
  // Mock unlocked badges for demonstration
  // In production, this would come from Supabase user data
  const [unlockedBadges] = useState(["pioneer", "spatial_analyst"]);

  return (
    <div className="w-full mb-12 animate-[fadeIn_0.5s_ease-out]">
      <div className="flex items-end justify-between mb-6">
        <div>
          <h2 className="font-headline-editorial text-2xl text-on-surface flex items-center gap-3">
            Milestones & Achievements
            <span className="font-label-caps tracking-widest text-[10px] text-gold-accent px-2 py-1 bg-gold-accent/10 border border-gold-accent/30 rounded">
              {unlockedBadges.length} / {BADGE_REGISTRY.length} UNLOCKED
            </span>
          </h2>
          <p className="text-sm text-text-secondary mt-1">Your verified legacy on the ScoutIt platform.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {BADGE_REGISTRY.map((badge) => {
          const isUnlocked = unlockedBadges.includes(badge.id);
          const Icon = badge.icon;

          return (
            <div 
              key={badge.id}
              className={`relative group rounded-xl border p-6 flex flex-col items-center text-center transition-all duration-500 overflow-hidden min-h-[200px] justify-center ${
                isUnlocked 
                  ? 'bg-gradient-to-b from-[#1a1814] to-[#0d0d0d] border-gold-accent/40 hover:border-gold-accent shadow-[0_0_15px_rgba(255,184,0,0.05)] hover:shadow-[0_0_25px_rgba(255,184,0,0.15)]' 
                  : 'bg-[#0a0a0a] border-surface-variant hover:border-surface-variant/80'
              }`}
            >
              {/* Background Glow for Unlocked */}
              {isUnlocked && (
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-gold-accent/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>
              )}

              {/* Icon Container */}
              <div className={`relative w-16 h-16 mb-4 flex items-center justify-center transition-transform duration-500 ${isUnlocked ? 'group-hover:scale-110 group-hover:-translate-y-1' : ''}`}>
                {/* Outer Ring */}
                <div className={`absolute inset-0 rounded-full border-2 border-dashed ${isUnlocked ? 'border-gold-accent animate-[spin_10s_linear_infinite]' : 'border-surface-variant'}`}></div>
                
                {/* Inner Circle */}
                <div className={`absolute inset-1 rounded-full flex items-center justify-center ${isUnlocked ? 'bg-[#121110] border border-gold-accent/50' : 'bg-[#0d0d0d]'}`}>
                  <Icon 
                    strokeWidth={isUnlocked ? 1.5 : 1} 
                    size="1.5em" 
                    className={`transition-all duration-500 ${
                      isUnlocked 
                        ? 'text-gold-accent drop-shadow-[0_0_8px_rgba(255,184,0,0.6)]' 
                        : 'text-surface-alt' // Very dark icon to create silhouette effect
                    }`} 
                  />
                </div>

                {/* Padlock Overlay for Locked */}
                {!isUnlocked && (
                  <div className="absolute inset-0 flex items-center justify-center bg-[#0a0a0a]/50 rounded-full backdrop-blur-[1px]">
                    <Lock size="1em" className="text-text-muted" strokeWidth={1.5} />
                  </div>
                )}
              </div>

              {/* Text */}
              <div className="relative z-10 w-full">
                <h3 className={`font-working-title text-sm mb-1 ${isUnlocked ? 'text-on-surface' : 'text-text-muted'}`}>
                  {badge.name}
                </h3>
                
                {/* Rarity Label (Unlocked only) */}
                {isUnlocked && (
                  <span className="font-label-caps text-[9px] tracking-widest uppercase text-gold-accent/80 block mb-2">
                    {badge.rarity}
                  </span>
                )}

                {/* Description (Visible on unlocked, hidden on locked until hover) */}
                <div className={`text-[10px] leading-relaxed transition-all duration-300 ${isUnlocked ? 'text-text-secondary' : 'text-text-muted/50 group-hover:text-text-secondary group-hover:-translate-y-1'}`}>
                  {isUnlocked ? badge.description : badge.unlockCondition}
                </div>
              </div>

              {/* Subtle Scanline Effect on Locked */}
              {!isUnlocked && (
                <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_50%,rgba(0,0,0,0.5)_50%)] bg-[length:100%_4px] opacity-10 pointer-events-none mix-blend-overlay"></div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
