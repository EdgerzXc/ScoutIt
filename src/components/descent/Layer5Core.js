"use client";

import useDescentProgress from "@/hooks/useDescentProgress";
import Link from "next/link";
import { ArrowRight, Lock, Unlock, FolderGit2, Star } from "lucide-react";

export default function Layer5Core({ currentUser }) {
  const layerRef = useDescentProgress();

  return (
    <section 
      ref={layerRef} 
      data-descent-layer="5"
      // Height 150vh so it pins for a moment before stopping
      className="relative w-full h-[150vh] bg-[#000000] overflow-hidden"
      style={{ zIndex: 6 }}
    >
      <div className="sticky top-0 w-full h-screen overflow-hidden flex items-center justify-center">
        
        {/* The Core Radiant Gradient Background */}
        <div 
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
        >
          {/* Molten Outer Core Glow */}
          <div 
            className="absolute bg-[#FFB800] rounded-full blur-[120px] opacity-20"
            style={{
              width: `calc(30vw + var(--sp) * 100vw)`,
              height: `calc(30vw + var(--sp) * 100vw)`,
              transform: `scale(calc(1 + var(--sp) * 2))`
            }}
          />
          {/* Inner Core Solid Shadow (Reveals if logged in, hides if logged out) */}
          <div 
            className="absolute bg-[#050505] rounded-full shadow-[inset_0_0_100px_#000]"
            style={{
              width: `calc(15vw + var(--sp) * 80vw)`,
              height: `calc(15vw + var(--sp) * 80vw)`,
              opacity: currentUser ? 0.9 : `calc(var(--sp) * 0.5)`
            }}
          />
        </div>

        {/* Content Container */}
        <div className="relative z-10 w-full max-w-6xl px-6 flex flex-col md:flex-row items-center justify-between gap-12">
          
          {/* OUTER CORE (Left Side / Top on Mobile) - The Public Showcase */}
          <div className="flex-1 flex flex-col items-start">
            <h2 className="text-xs font-mono uppercase tracking-[0.4em] text-accent mb-4 flex items-center gap-2">
              <span className="w-8 h-[1px] bg-accent"></span>
              Outer Core
            </h2>
            <h3 className="text-5xl md:text-6xl font-display text-white mb-6">About You.</h3>
            <p className="text-secondary text-lg font-light mb-8 max-w-md">
              The public face of ScoutIt. Our Pioneers shape the market. Discover the advantages, the network, and the invitation to ascend by descending.
            </p>
            
            <div className="flex gap-4 mb-12">
              <div className="flex flex-col items-center p-4 bg-surface2/50 backdrop-blur border border-white/5 rounded-xl">
                <span className="text-3xl font-display text-accent mb-1">2.4k</span>
                <span className="text-[10px] font-mono uppercase tracking-widest text-secondary">Pioneers</span>
              </div>
              <div className="flex flex-col items-center p-4 bg-surface2/50 backdrop-blur border border-white/5 rounded-xl">
                <span className="text-3xl font-display text-accent mb-1">$4B+</span>
                <span className="text-[10px] font-mono uppercase tracking-widest text-secondary">Asset Vol</span>
              </div>
            </div>

            {/* THE MEMBRANE - CTA */}
            {!currentUser && (
              <Link 
                href="/onboarding" 
                className="group relative inline-flex items-center justify-center px-8 py-5 bg-accent hover:bg-accent-bright text-brand font-mono font-bold uppercase tracking-widest rounded-none overflow-hidden transition-all shadow-glow hover:shadow-glow-soft"
                style={{
                  transform: `scale(calc(0.95 + var(--sp) * 0.05))`
                }}
              >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                <span className="relative flex items-center gap-3">
                  Become A Pioneer <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
                </span>
              </Link>
            )}
          </div>

          {/* INNER CORE (Right Side / Bottom on Mobile) - The Private Vault */}
          <div className="flex-1 w-full max-w-md">
            <div 
              className={`relative p-8 md:p-10 rounded-2xl border transition-all duration-1000 ${
                currentUser 
                  ? "bg-[#0A0A0A]/80 border-accent/30 backdrop-blur-2xl shadow-glow-soft" 
                  : "bg-[#050505]/40 border-white/5 backdrop-blur-md"
              }`}
            >
              <h2 className="text-xs font-mono uppercase tracking-[0.4em] mb-8 flex items-center gap-2 text-secondary">
                {currentUser ? <Unlock className="w-4 h-4 text-accent" /> : <Lock className="w-4 h-4" />}
                Inner Core
              </h2>

              {currentUser ? (
                // LOGGED IN STATE
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                  <h4 className="text-2xl font-display text-white mb-2">Welcome Back,</h4>
                  <p className="text-accent text-lg mb-8">{currentUser.fullName || currentUser.email}</p>
                  
                  <div className="space-y-4">
                    <Link href="/dashboard" className="flex items-center justify-between p-4 bg-surface2/50 hover:bg-surface2 border border-white/5 hover:border-accent/30 rounded-xl transition-colors group">
                      <div className="flex items-center gap-3">
                        <FolderGit2 className="w-5 h-5 text-secondary group-hover:text-accent transition-colors" />
                        <span className="font-body text-white">Your Boards</span>
                      </div>
                      <ArrowRight className="w-4 h-4 text-secondary group-hover:text-accent group-hover:translate-x-1 transition-all" />
                    </Link>
                    <Link href="/wishlist" className="flex items-center justify-between p-4 bg-surface2/50 hover:bg-surface2 border border-white/5 hover:border-accent/30 rounded-xl transition-colors group">
                      <div className="flex items-center gap-3">
                        <Star className="w-5 h-5 text-secondary group-hover:text-accent transition-colors" />
                        <span className="font-body text-white">Saved Intel</span>
                      </div>
                      <ArrowRight className="w-4 h-4 text-secondary group-hover:text-accent group-hover:translate-x-1 transition-all" />
                    </Link>
                  </div>
                </div>
              ) : (
                // LOGGED OUT STATE
                <div className="flex flex-col items-center text-center py-8">
                  <Lock className="w-12 h-12 text-white/10 mb-6" />
                  <h4 className="text-xl font-body text-white/50 mb-2">Your Space is Sealed</h4>
                  <p className="text-white/30 text-sm font-light max-w-[200px] mb-8">
                    Pierce the membrane to unlock your private dashboard.
                  </p>
                  <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
