/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import useDescentProgress from "@/hooks/useDescentProgress";
import { useEffect, useState } from "react";
import { MoveRight } from "lucide-react";

export default function Layer2Stratosphere() {
  const layerRef = useDescentProgress();
  const [intelItems, setIntelItems] = useState([]);

  // Mock fetching the Airtable intel data for the stratosphere
  useEffect(() => {
    // In a real implementation this would use the real CMS fetch.
    // We'll mock a few high-level intel pieces here.
    setIntelItems([
      { title: "BGC Core Zoning Updates 2026", date: "Just Now", slug: "bgc-zoning-26" },
      { title: "Off-Market Hospitality Surge in Siargao", date: "2 Hours Ago", slug: "siargao-surge" },
      { title: "Roxas Triangle Luxury Cap Rates", date: "Yesterday", slug: "roxas-caps" }
    ]);
  }, []);

  return (
    <section 
      ref={layerRef} 
      data-descent-layer="2"
      className="relative w-full h-[150vh] bg-[#0d0d0d] overflow-hidden"
      style={{ zIndex: 9 }}
    >
      <div className="sticky top-0 w-full h-screen overflow-hidden flex items-center justify-center">
        
        {/* Parallax Clouds Background (Slow) */}
        <div 
          className="absolute inset-0 opacity-40 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(ellipse at center, rgba(30,30,30,0.8) 0%, rgba(13,13,13,1) 70%)',
            transform: 'translateY(calc(var(--sp) * -50vh))',
          }}
        >
          {/* Abstract cloud shapes using CSS shapes and blur */}
          <div className="absolute top-[20%] left-[10%] w-[40vw] h-[20vh] bg-[#1a1a1a] rounded-full blur-[60px]" />
          <div className="absolute top-[50%] right-[5%] w-[50vw] h-[30vh] bg-[#222] rounded-full blur-[80px]" />
        </div>

        {/* Parallax Clouds Foreground (Fast) */}
        <div 
          className="absolute inset-0 pointer-events-none z-10"
          style={{
            transform: 'translateY(calc(var(--sp) * -150vh))',
          }}
        >
          <div className="absolute bottom-[-10%] left-[-10%] w-[60vw] h-[40vh] bg-[#111] rounded-[100%] blur-[40px] border-t border-t-accent/10" />
          <div className="absolute top-[60%] right-[-20%] w-[70vw] h-[50vh] bg-[#151515] rounded-[100%] blur-[50px]" />
        </div>

        {/* UFO Silhouette / Scraping Indicator (Crosses laterally based on --sp) */}
        <div 
          className="absolute top-[30%] z-20 flex items-center gap-3 opacity-0 transition-opacity duration-300"
          style={{
            // Fade in when sp > 0.4
            opacity: `calc((var(--sp) - 0.4) * 5)`,
            // Move across screen from right to left
            transform: `translateX(calc((1 - var(--sp)) * 100vw - 20vw)) scale(0.8)`,
          }}
        >
          <div className="w-16 h-2 bg-accent/80 rounded-full blur-[2px] relative">
            <div className="absolute inset-0 w-full h-full bg-accent blur-[8px]"></div>
          </div>
          <span className="text-xs font-mono uppercase text-accent/80 tracking-widest">Scraping Market...</span>
        </div>

        {/* Content: Intel Radar */}
        <div 
          className="relative z-30 flex flex-col items-center w-full max-w-4xl px-6"
          style={{
            opacity: `calc(sin(var(--sp) * 3.1415))`, // Fade in at 0.5, fade out at 1.0
            transform: `translateY(calc((var(--sp) - 0.5) * -100px))`
          }}
        >
          <div className="flex items-center gap-4 mb-12">
            <div className="w-12 h-[1px] bg-accent-muted"></div>
            <h2 className="text-xs font-mono uppercase tracking-[0.3em] text-accent">Stratosphere Intel</h2>
            <div className="w-12 h-[1px] bg-accent-muted"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
            {intelItems.map((item, i) => (
              <div 
                key={i} 
                className="bg-surface/40 backdrop-blur-md border border-white/5 p-6 rounded-xl hover:border-accent/30 transition-colors group cursor-pointer"
                style={{
                  transform: `translateY(calc(var(--sp) * ${-20 * (i+1)}px))`
                }}
              >
                <div className="text-[10px] font-mono text-secondary mb-3 uppercase tracking-wider flex justify-between">
                  <span>Radar</span>
                  <span className="text-accent-muted">{item.date}</span>
                </div>
                <h3 className="text-lg font-body text-white leading-snug mb-6 group-hover:text-accent transition-colors">
                  {item.title}
                </h3>
                <div className="flex items-center text-xs text-accent-bright font-medium gap-2">
                  Read File <MoveRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
