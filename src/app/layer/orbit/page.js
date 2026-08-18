"use client";

import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import BoardPodium from "@/components/board/BoardPodium";
import BackgroundOrbit from "@/components/descent/BackgroundOrbit";
import LayerTransition from "@/components/descent/LayerTransition";

export default function OrbitLayer() {
  return (
    <div className="orbit-page-wrapper">
      {/* Universal ScoutIt Header Navigation */}
      <Header />

      {/* 3D WebGL Night-Side Earth & Stars Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <BackgroundOrbit />
      </div>

      {/* Main Orbital Demand Showcase & Leaderboard */}
      <main className="orbit-main-content">
        <BoardPodium />
        <LayerTransition
          nextNum="02"
          nextName="Stratosphere"
          nextHref="/layer/stratosphere"
          teaser="Enter the atmosphere. Discover spatial intelligence, market stories, and neighborhood briefings."
        />
      </main>

      {/* Universal Footer */}
      <Footer />

      <style jsx global>{`
        .orbit-page-wrapper {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          background: #0d0d0d;
          color: #f5f3ee;
          position: relative;
          overflow-x: hidden;
        }

        .orbit-main-content {
          flex: 1;
          position: relative;
          z-index: 10;
          padding-top: 80px;
        }
      `}</style>
    </div>
  );
}
