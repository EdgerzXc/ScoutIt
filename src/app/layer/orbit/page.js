"use client";

import LayerNav from "@/components/descent/LayerNav";
import Footer from "@/components/layout/Footer";
import BoardPodium from "@/components/board/BoardPodium";
import ScoutEarth from "@/components/orbit/ScoutEarthClient";
import LayerTransition from "@/components/descent/LayerTransition";

export default function OrbitLayer() {
  return (
    <div className="orbit-page-wrapper">
      {/* ── UNIFIED LAYER HEADER ─────────────────────────────────────
          Orbit was the only one of the six layers running the site-wide
          <Header /> instead of <LayerNav />, so it had no back/next and a
          different bar from every layer below it. Now the descent carries
          one header the whole way down.

          It is the first layer, so there is no `prev` — the logo is the way
          back out to the site. */}
      <LayerNav next={{ href: "/layer/stratosphere", label: "Stratosphere" }} />

      {/* ── THE ORBIT EARTH ──────────────────────────────────────────
          A BACKGROUND, pinned behind the page exactly as the previous
          BackgroundOrbit canvas was. It briefly sat in the content flow
          instead, which pushed BoardPodium down by the globe's full height
          and buried the leaderboard — the layer's actual content.

          The wrapper keeps pointer events so the planet stays draggable,
          but it sits at z-0 while `.orbit-main-content` sits at z-10, so
          every link and card above it still receives its own clicks. Only
          empty space rotates the globe. */}
      <div className="orbit-earth-backdrop">
        <ScoutEarth showSolarSystem />
      </div>

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
          padding-top: 52px;
        }

        /* Pinned behind everything, like the canvas it replaced. Content
           above owns z-10, so the globe never intercepts a real click. */
        .orbit-earth-backdrop {
          position: fixed;
          inset: 0;
          z-index: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* Fill the fixed backdrop rather than the component's own
           min(78vh, 850px) box, which is sized for in-flow use. */
        .orbit-earth-backdrop .scout-earth {
          height: 100%;
        }
      `}</style>
    </div>
  );
}
