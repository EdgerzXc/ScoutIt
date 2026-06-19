"use client";

import LayerNav from "@/components/descent/LayerNav";
import Link from "next/link";
import BackgroundMantle from "@/components/descent/BackgroundMantle";

export default function MantleLayer() {
  return (
    <main
      className="min-h-screen bg-[#0d0d0d] text-white selection:bg-[#FFB800] selection:text-black overflow-hidden font-sans"
      style={{ paddingTop: "52px" }}
    >
      <LayerNav
        prev={{ href: "/layer/crust", label: "Crust" }}
        next={{ href: "/layer/core", label: "Core" }}
      />

      <div className="fixed inset-0 pointer-events-none z-0">
        <BackgroundMantle />
      </div>

      <section className="mantle-about">
        <div className="mantle-inner">
          <span className="mantle-kicker">Layer 05 // The Mantle</span>
          <h2 className="mantle-title">We&rsquo;re the deep archive holding you up.</h2>
          <p className="mantle-sub">
            ScoutIt is the massive, structured intelligence database wrapping around the thing at the center. 
            We do the quiet, heavy lifting: everything we store is to protect and support you.
          </p>
          <Link href="/about" className="mantle-cta">
            Read our story &rarr;
          </Link>
          <div className="layer-mission">
            <h3>Mission</h3>
            <p>The Mantle serves as the Archive Layer. It is ScoutIt&rsquo;s thickest stratum: the massive, structured intelligence reservoir wrapping around the core. It does the quiet, heavy lifting — everything stored here exists to protect and support the person at the center.</p>
          </div>
        </div>
      </section>

      <style dangerouslySetInnerHTML={{ __html: `
        .mantle-about {
          position: relative;
          z-index: 10;
          min-height: calc(100vh - 52px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 80px 32px;
        }
        .mantle-inner {
          max-width: 640px;
          text-align: center;
        }
        .mantle-kicker {
          font-family: var(--font-mono);
          font-size: 11px;
          letter-spacing: 0.26em;
          text-transform: uppercase;
          color: var(--accent);
          display: block;
          margin-bottom: 22px;
        }
        .mantle-title {
          font-family: var(--font-display);
          font-size: clamp(34px, 5.5vw, 68px);
          font-weight: 400;
          line-height: 1.05;
          color: #f6efe6;
          margin-bottom: 22px;
          text-shadow: 0 2px 40px rgba(0,0,0,0.6);
        }
        .mantle-sub {
          font-family: var(--font-body);
          font-size: clamp(15px, 1.6vw, 18px);
          line-height: 1.7;
          color: rgba(255,236,210,0.74);
          margin-bottom: 34px;
          text-shadow: 0 1px 20px rgba(0,0,0,0.5);
        }
        .mantle-cta {
          display: inline-block;
          font-family: var(--font-mono);
          font-size: 12px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--accent);
          border: 1px solid rgba(255,184,0,0.4);
          padding: 13px 26px;
          border-radius: 4px;
          text-decoration: none;
          transition: all 0.22s ease;
          background: rgba(255,138,30,0.06);
        }
        .mantle-cta:hover {
          color: #1a0d04;
          background: var(--accent);
          border-color: var(--accent);
        }
      `}} />
    </main>
  );
}
