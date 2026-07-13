
"use client";

import LayerNav from "@/components/descent/LayerNav";
import BoardPodium from "@/components/board/BoardPodium";
import BackgroundOrbit from "@/components/descent/BackgroundOrbit";
import LayerHeader from "@/components/descent/LayerHeader";
import LayerTransition from "@/components/descent/LayerTransition";

export default function OrbitLayer() {
  return (
    <main className="min-h-screen bg-[#0d0d0d] text-white selection:bg-gold-accent selection:text-black overflow-hidden font-sans" style={{ paddingTop: "52px" }}>
      <LayerNav prev={{ href: "/", label: "Home" }} next={{ href: "/layer/stratosphere", label: "Stratosphere" }} />
      <div className="fixed inset-0 pointer-events-none z-0">
        <BackgroundOrbit />
      </div>
      <div className="layer-pane relative z-10">
        <LayerHeader 
          layerNum="01" 
          layerName="Orbit" 
          title="The Board" 
          description="The properties Manila is watching — ranked by real inquiry demand." 
          missionText="The Orbit serves as the Showcase Layer. This specific layer exists to grant the highest-ranked properties the ultimate visibility they deserve, elevating them to the apex of the platform." 
          ctaText="View Full Showcase →"
          ctaHref="/showcase"
        />
        {/* SECTION 2: Layer 01 — The Board (ranked podium &rarr; /showcase) */}
        <section className="snap-section section-board" id="board-section" style={{ padding: 0, position: "relative", overflow: "hidden" }}>
          <BoardPodium />
        </section>
        <LayerTransition 
          nextNum="02" 
          nextName="Stratosphere" 
          nextHref="/layer/stratosphere" 
          teaser="Descend into the atmosphere. Stories and market signals are waiting." 
        />
      </div>
    </main>
        
  );
}
