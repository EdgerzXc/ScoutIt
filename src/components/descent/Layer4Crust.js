"use client";

import useDescentProgress from "@/hooks/useDescentProgress";
import { Pickaxe, Shield, Gem } from "lucide-react";

export default function Layer4Crust() {
  const layerRef = useDescentProgress();

  const values = [
    { title: "Deep Sourcing", icon: Pickaxe, desc: "We drill past the open market into off-market exclusivity." },
    { title: "Vetted Intel", icon: Shield, desc: "Every asset is analyzed, verified, and secured for Pioneers." },
    { title: "Rare Assets", icon: Gem, desc: "Only the top 1% of high-yield luxury real estate is surfaced." }
  ];

  return (
    <section 
      ref={layerRef} 
      data-descent-layer="4"
      className="relative w-full h-[200vh] bg-[#151210] overflow-hidden"
      style={{ zIndex: 7 }}
    >
      <div className="sticky top-0 w-full h-screen overflow-hidden flex items-center justify-center">
        
        {/* Geologic Strata Background (Translates UP heavily to simulate tunneling DOWN) */}
        <div 
          className="absolute inset-0 w-full"
          style={{
            height: '250vh', // Extra height to allow scrolling
            top: '-50vh',
            transform: `translateY(calc(var(--sp) * -100vh))`,
          }}
        >
          {/* Strata Textures */}
          <div className="absolute inset-x-0 top-0 h-[30%] bg-gradient-to-b from-[#151210] to-[#1a1614] border-b-[8px] border-[#2a2420]" />
          <div className="absolute inset-x-0 top-[30%] h-[40%] bg-[#1a1614] border-b-[12px] border-[#110e0c]">
            {/* Gold Veins */}
            <svg className="absolute inset-0 w-full h-full opacity-20" preserveAspectRatio="none">
              <path d="M0,50 Q200,100 400,20 T800,150 T1200,80" fill="none" stroke="#FFB800" strokeWidth="3" className="drop-shadow-[0_0_8px_#FFB800]" />
              <path d="M0,150 Q300,50 600,120 T1200,180" fill="none" stroke="#FFB800" strokeWidth="2" className="drop-shadow-[0_0_5px_#FFB800]" />
            </svg>
          </div>
          <div className="absolute inset-x-0 top-[70%] h-[30%] bg-[#0f0c0a] border-b-[4px] border-[#3a2000]" />
        </div>

        {/* Content Overlay */}
        <div className="relative z-10 flex flex-col items-center max-w-4xl px-6 w-full">
          <div 
            className="text-center mb-16"
            style={{
              opacity: `calc(sin(var(--sp) * 3.1415) * 1.5)`,
              transform: `scale(calc(0.9 + var(--sp) * 0.2))`
            }}
          >
            <h2 className="text-sm font-mono uppercase tracking-[0.4em] text-accent-muted mb-4">The Ecosystem</h2>
            <h3 className="text-4xl md:text-5xl font-display text-white mb-6">Striking Gold</h3>
            <p className="text-secondary text-lg font-light max-w-2xl mx-auto">
              ScoutIt is not a listing site. We are an intelligence network. We tunnel through the noise of the public market to extract the highest value assets.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
            {values.map((val, i) => (
              <div 
                key={i}
                className="flex flex-col items-center text-center p-6 bg-[#00000040] backdrop-blur-md rounded-2xl border border-white/5"
                style={{
                  transform: `translateY(calc((var(--sp) - 0.5) * ${40 * (i+1)}px))`
                }}
              >
                <div className="w-16 h-16 rounded-full bg-surface2 border border-white/10 flex items-center justify-center mb-6 shadow-glow-soft">
                  <val.icon className="w-8 h-8 text-accent" />
                </div>
                <h4 className="text-xl font-body text-white mb-3">{val.title}</h4>
                <p className="text-secondary text-sm font-light leading-relaxed">{val.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Transition to Mantle/Core */}
        <div className="absolute bottom-0 inset-x-0 h-[40vh] bg-gradient-to-t from-[#2a0800] via-[#0f0c0a] to-transparent pointer-events-none z-20" />

      </div>
    </section>
  );
}
