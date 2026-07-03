"use client";

import React from "react";
import FadingVideo from "@/components/ui/FadingVideo";
import BlurText from "@/components/ui/BlurText";
import { Building2, Camera, Search, ArrowRight } from "lucide-react";

export default function TelescopeObserver() {
  const spaceVideos = [
    // A majestic, slow-moving space/nebula cinematic video placeholder
    "https://cdn.coverr.co/videos/coverr-stars-in-the-night-sky-4074/1080p.mp4",
  ];

  return (
    <section className="relative w-full min-h-[80vh] bg-black flex flex-col justify-center items-center py-24 overflow-hidden border-t border-[rgba(232,174,60,0.1)]">
      {/* Background Fading Video */}
      <div className="absolute inset-0 z-0">
        <FadingVideo videos={spaceVideos} />
        {/* Additional gradient overlays for blending the section smoothly with footer */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#020202] via-transparent to-[#050505] z-10 pointer-events-none" />
      </div>

      <div className="relative z-20 container mx-auto px-6 max-w-7xl">
        <div className="text-center mb-20 mt-10">
          <div className="flex justify-center">
            <BlurText 
              text="Look Beyond The Horizon." 
              className="text-4xl md:text-6xl lg:text-7xl font-heading italic tracking-tight text-white drop-shadow-2xl" 
            />
          </div>
          <p className="mt-6 text-white/70 max-w-2xl mx-auto font-body font-light text-lg tracking-wide leading-relaxed">
            Aim your sights at verified intelligence. Join ScoutIt and navigate the commercial space landscape with absolute precision.
          </p>
        </div>

        {/* Liquid Glass Layout Grid (Adapted from MotionSites Prompt) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          
          {/* Card 1 */}
          <div className="liquid-glass-strong rounded-2xl p-8 lg:p-10 border-t border-l border-[rgba(232,174,60,0.2)] shadow-2xl flex flex-col items-start transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(232,174,60,0.1)] group">
            <div className="bg-[var(--accent)]/10 p-3 rounded-full mb-6">
              <Search className="w-6 h-6 text-[var(--accent-bright)]" />
            </div>
            <h3 className="text-2xl font-heading text-white mb-4">Discover Spaces</h3>
            <p className="text-sm text-white/60 font-body mb-10 flex-grow leading-relaxed">
              Access the largest verified database of commercial and residential properties, decoded for your exact needs.
            </p>
            <button className="flex items-center text-xs font-mono uppercase font-bold tracking-widest text-[var(--accent)] group-hover:text-[var(--accent-bright)] transition-colors">
              Explore <ArrowRight className="w-4 h-4 ml-2" />
            </button>
          </div>

          {/* Card 2 */}
          <div className="liquid-glass-strong rounded-2xl p-8 lg:p-10 border-t border-l border-[rgba(232,174,60,0.2)] shadow-2xl flex flex-col items-start transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(232,174,60,0.1)] group">
            <div className="bg-[var(--accent)]/10 p-3 rounded-full mb-6">
              <Building2 className="w-6 h-6 text-[var(--accent-bright)]" />
            </div>
            <h3 className="text-2xl font-heading text-white mb-4">Intel Briefings</h3>
            <p className="text-sm text-white/60 font-body mb-10 flex-grow leading-relaxed">
              Deep dive into hyper-local market intelligence and property analytics that go far beyond surface-level data.
            </p>
            <button className="flex items-center text-xs font-mono uppercase font-bold tracking-widest text-[var(--accent)] group-hover:text-[var(--accent-bright)] transition-colors">
              Read Briefings <ArrowRight className="w-4 h-4 ml-2" />
            </button>
          </div>

          {/* Card 3 */}
          <div className="liquid-glass-strong rounded-2xl p-8 lg:p-10 border-t border-l border-[rgba(232,174,60,0.2)] shadow-2xl flex flex-col items-start transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(232,174,60,0.1)] group">
            <div className="bg-[var(--accent)]/10 p-3 rounded-full mb-6">
              <Camera className="w-6 h-6 text-[var(--accent-bright)]" />
            </div>
            <h3 className="text-2xl font-heading text-white mb-4">Your Board</h3>
            <p className="text-sm text-white/60 font-body mb-10 flex-grow leading-relaxed">
              Save, organize, and collaborate on your favorite properties in real-time with an immersive visual workspace.
            </p>
            <button className="flex items-center text-xs font-mono uppercase font-bold tracking-widest text-[var(--accent)] group-hover:text-[var(--accent-bright)] transition-colors">
              Open Board <ArrowRight className="w-4 h-4 ml-2" />
            </button>
          </div>

        </div>
      </div>
    </section>
  );
}
