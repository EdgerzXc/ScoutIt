"use client";

import useDescentProgress from "@/hooks/useDescentProgress";
import { Building2, Store, Hotel, CalendarDays } from "lucide-react";

export default function Layer3Metropolis() {
  const layerRef = useDescentProgress();

  const categories = [
    { name: "Residential", icon: Building2, desc: "Ultra-luxury homes & penthouses." },
    { name: "Commercial", icon: Store, desc: "Prime retail & office spaces." },
    { name: "Hospitality", icon: Hotel, desc: "Exclusive resorts & boutiques." },
    { name: "Venues", icon: CalendarDays, desc: "Cinematic event spaces." }
  ];

  return (
    <section 
      ref={layerRef} 
      data-descent-layer="3"
      className="relative w-full h-[150vh] bg-[#090909] overflow-hidden"
      style={{ zIndex: 8 }}
    >
      <div className="sticky top-0 w-full h-screen overflow-hidden flex flex-col items-center justify-center perspective-[1000px]">
        
        {/* City Grid Background */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            transform: `rotateX(60deg) translateY(calc(var(--sp) * -100vh)) scale(2)`,
            transformOrigin: "center top",
            backgroundImage: `
              linear-gradient(to right, rgba(255, 184, 0, 0.05) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(255, 184, 0, 0.05) 1px, transparent 1px)
            `,
            backgroundSize: '100px 100px',
            boxShadow: 'inset 0 0 100px #090909'
          }}
        >
          {/* Glowing City Nodes */}
          <div className="absolute top-[20%] left-[30%] w-2 h-2 bg-accent rounded-full shadow-[0_0_20px_4px_rgba(255,184,0,0.8)]" />
          <div className="absolute top-[50%] left-[60%] w-3 h-3 bg-accent-bright rounded-full shadow-[0_0_30px_6px_rgba(255,184,0,1)]" />
          <div className="absolute top-[80%] left-[20%] w-1 h-1 bg-accent rounded-full shadow-[0_0_10px_2px_rgba(255,184,0,0.5)]" />
        </div>

        {/* Fog / Atmosphere at the horizon */}
        <div className="absolute top-0 inset-x-0 h-[40vh] bg-gradient-to-b from-[#0d0d0d] to-transparent pointer-events-none z-10" />

        {/* Content: The Property Experience */}
        <div 
          className="relative z-20 flex flex-col items-center w-full max-w-5xl px-6"
          style={{
            transform: `translateZ(calc((var(--sp) - 0.5) * 400px))`,
            opacity: `calc(sin(var(--sp) * 3.1415))`
          }}
        >
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-display text-white mb-4">The Metropolis</h2>
            <p className="text-secondary font-light max-w-lg mx-auto">
              Select your sector. Scout physical space across our global intelligence network.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
            {categories.map((cat, i) => (
              <div 
                key={i}
                className="group relative bg-[#121212]/80 backdrop-blur-xl border border-white/5 p-6 rounded-2xl hover:border-accent/40 transition-all cursor-pointer overflow-hidden"
                style={{
                  transform: `translateY(calc(var(--sp) * ${-30 * (i%2 === 0 ? 1 : -1)}px))`
                }}
              >
                {/* Hover Glow */}
                <div className="absolute inset-0 bg-gradient-to-b from-accent/0 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <cat.icon className="w-8 h-8 text-accent-muted group-hover:text-accent-bright transition-colors mb-4" />
                <h3 className="text-lg font-body text-white mb-2">{cat.name}</h3>
                <p className="text-sm text-secondary font-light">{cat.desc}</p>
                
                <div className="mt-6 flex items-center text-[10px] font-mono uppercase tracking-widest text-accent/50 group-hover:text-accent transition-colors">
                  Initialize <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Deep Dive Gradient at bottom to transition to Crust */}
        <div className="absolute bottom-0 inset-x-0 h-[30vh] bg-gradient-to-t from-[#151210] to-transparent pointer-events-none z-10" />

      </div>
    </section>
  );
}
