"use client";

import dynamic from "next/dynamic";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

// mapbox-gl + @turf/turf are browser-only and heavy — code-split them out of
// the main bundle instead of loading them for every visitor to every route.
const ManilaTransitMap = dynamic(() => import("@/components/transit/ManilaTransitMap"), {
  ssr: false,
  loading: () => (
    <div style={{ minHeight: 600, background: "#000", border: "0.5px solid #262626", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "#c8c8c8" }}>
        Loading transit network…
      </span>
    </div>
  ),
});

export default function TransitPage() {
  return (
    <div className="directory-layout">
      <Header />
      <main className="transit-page-main">
        <span className="vector-label">SCOUTIT · SPATIAL INTELLIGENCE</span>
        <h1 className="transit-page-title">Metro Manila Rail Network</h1>
        <p className="transit-page-subtitle">
          Real-world LRT and MRT track geometry, rendered as a live 3D neon transit map —
          toggle each line to see how it threads through the metro.
        </p>

        <ManilaTransitMap />
      </main>
      <Footer />

      <style>{`
        .transit-page-main {
          padding: 60px 24px 80px;
          max-width: 1200px;
          margin: 0 auto;
        }
        .vector-label {
          font-family: var(--font-mono), monospace;
          font-size: 11px;
          letter-spacing: 0.25em;
          color: var(--accent);
          text-transform: uppercase;
        }
        .transit-page-title {
          font-family: var(--font-display);
          font-size: 40px;
          color: #fff;
          margin: 16px 0;
        }
        .transit-page-subtitle {
          font-size: 15px;
          line-height: 1.7;
          color: var(--text-secondary);
          max-width: 640px;
          margin: 0 0 32px;
        }
      `}</style>
    </div>
  );
}
