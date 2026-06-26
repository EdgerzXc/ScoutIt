
"use client";

import LayerNav from "@/components/descent/LayerNav";
import BoardPodium from "@/components/board/BoardPodium";
import BackgroundOrbit from "@/components/descent/BackgroundOrbit";


export default function OrbitLayer() {
  return (
    <main className="min-h-screen bg-[#0d0d0d] text-white selection:bg-[#E8AE3C] selection:text-black overflow-hidden font-sans" style={{ paddingTop: "52px" }}>
      <LayerNav prev={{ href: "/", label: "Home" }} next={{ href: "/layer/stratosphere", label: "Stratosphere" }} />
      <div className="fixed inset-0 pointer-events-none z-0">
        <BackgroundOrbit />
      </div>
{/* SECTION 2: Layer 01 — The Board (ranked podium &rarr; /showcase) */}
      <section className="snap-section section-board" id="board-section" style={{ padding: 0, position: "relative", overflow: "hidden" }}>
        <BoardPodium />
      </section>
</main>
        
  );
}
