"use client";

import LayerNav from "@/components/descent/LayerNav";
import Link from "next/link";
import { useState } from "react";
import BackgroundMantle from "@/components/descent/BackgroundMantle";
import LayerHeader from "@/components/descent/LayerHeader";
import LayerTransition from "@/components/descent/LayerTransition";

const ARCHIVE_CATEGORIES = [
  { key: "story", label: "Our Story" },
  { key: "architecture", label: "Platform Architecture" },
  { key: "philosophy", label: "Data Philosophy" },
  { key: "trust", label: "Trust & Verification" },
];

const ARCHIVE_CONTENT = {
  story: {
    title: "The ScoutIt Origin",
    body: "ScoutIt was born from a simple observation: the Philippine real estate market is enormous, fragmented, and opaque. Buyers don't know who to trust. Owners don't know how to be seen. Brokers operate in silos. We built ScoutIt to be the connective tissue — one platform that gives every stakeholder in the space economy a single source of truth.",
    cta: "Read the Full Story →",
    href: "/about",
  },
  architecture: {
    title: "Six Layers Deep",
    body: "ScoutIt is structured as six geological layers, each serving a distinct purpose in the space intelligence ecosystem. From the Orbit's showcase leaderboard to the Core's personal workspace, every layer inherits visual DNA from the one above it. The descent is not just a navigation metaphor — it's the architecture itself.",
    cta: "Explore the Layers →",
    href: "/layer/orbit",
  },
  philosophy: {
    title: "Intelligence, Not Listings",
    body: "We don't just list properties. We build intelligence around them — editorial coverage, neighborhood analysis, demand signals, professional verification, and deep research. Every data point exists to give you a clearer picture of the space you're considering, long before you set foot inside it.",
    cta: "Read Our Intel →",
    href: "/intel",
  },
  trust: {
    title: "Verified by Design",
    body: "Every advisor, photographer, and researcher on ScoutIt goes through a verification process. We don't operate an open marketplace where anyone can list. The Crust layer is our trust infrastructure — a curated network of professionals who are accountable, identifiable, and invested in getting it right.",
    cta: "Meet Our Network →",
    href: "/brokers",
  },
};

export default function MantleLayer() {
  const [activeCategory, setActiveCategory] = useState("story");
  const content = ARCHIVE_CONTENT[activeCategory];

  return (
    <main
      className="min-h-screen bg-[#0d0d0d] text-white selection:bg-gold-accent selection:text-black overflow-hidden font-sans"
      style={{ paddingTop: "52px" }}
    >
      <LayerNav
        prev={{ href: "/layer/crust", label: "Crust" }}
        next={{ href: "/layer/core", label: "Core" }}
      />
      <div className="fixed inset-0 pointer-events-none z-0">
        <BackgroundMantle />
      </div>

      <div className="layer-pane relative z-10">
        <LayerHeader 
          layerNum="05" 
          layerName="Mantle" 
          title="The Deep Archive" 
          description="ScoutIt is the massive, structured intelligence database wrapping around the thing at the center. We do the quiet, heavy lifting: everything we store is to protect and support you." 
          missionText="The Mantle serves as the Archive Layer. It is ScoutIt's thickest stratum: the massive, structured intelligence reservoir wrapping around the core. It does the quiet, heavy lifting — everything stored here exists to protect and support the person at the center." 
          ctaText="Read Our Story →"
          ctaHref="/about"
        />

        <div className="descent-split">
          {/* ── LEFT SIDEBAR ── */}
          <aside className="descent-sidebar">
            <nav className="descent-nav">
              {ARCHIVE_CATEGORIES.map(c => (
                <button
                  key={c.key}
                  className={`descent-cat${activeCategory === c.key ? " on" : ""}`}
                  onClick={() => setActiveCategory(c.key)}
                >
                  {c.label}
                </button>
              ))}
            </nav>
          </aside>

          {/* ── RIGHT CONTENT ── */}
          <div className="descent-content">
            <div className="mantle-article">
              <h3 className="mantle-article-title">{content.title}</h3>
              <p className="mantle-article-body">{content.body}</p>
              <Link href={content.href} className="mantle-article-cta">
                {content.cta}
              </Link>
            </div>
          </div>
        </div>

        <LayerTransition 
          nextNum="06" 
          nextName="Core" 
          nextHref="/layer/core" 
          teaser="Reach the center. This is where the platform becomes yours." 
        />
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .mantle-article {
          max-width: 600px;
        }
        .mantle-article-title {
          font-family: var(--font-display);
          font-size: clamp(24px, 3vw, 32px);
          font-weight: 400;
          color: #f6efe6;
          margin-bottom: 20px;
          line-height: 1.2;
        }
        .mantle-article-body {
          font-family: var(--font-body);
          font-size: 15px;
          line-height: 1.75;
          color: rgba(255, 255, 255, 0.65);
          margin-bottom: 28px;
        }
        .mantle-article-cta {
          display: inline-block;
          font-family: var(--font-mono);
          font-size: 11px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--accent);
          border: 1px solid rgba(232, 174, 60, 0.4);
          padding: 12px 24px;
          border-radius: 4px;
          text-decoration: none;
          transition: all 0.22s ease;
          background: rgba(232, 174, 60, 0.06);
        }
        .mantle-article-cta:hover {
          color: #1a0d04;
          background: var(--accent);
          border-color: var(--accent);
          box-shadow: 0 0 20px rgba(232, 174, 60, 0.4);
        }
      `}} />
    </main>
  );
}
