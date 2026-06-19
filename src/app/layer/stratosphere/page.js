
"use client";

import LayerNav from "@/components/descent/LayerNav";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { getDISCOVERY_FEED } from "@/data/mockProperties";
import BackgroundStratosphere from "@/components/descent/BackgroundStratosphere";


export default function StratosphereLayer() {
  const router = useRouter();
  const [activeDiscoverType, setActiveDiscoverType] = useState("Residential");

  const propertyTypes = ["Residential", "Commercial", "STR", "Hospitality", "Restaurants", "Venues/Events"];

  const getDBCategory = (displayType) => {
    switch (displayType) {
      case "Residential": return "Residential";
      case "Commercial": return "Commercial";
      case "STR": return "STR";
      case "Hospitality": return "Hospitality";
      case "Restaurants": return "Restaurants";
      case "Venues/Events": return "Venues";
      default: return "Residential";
    }
  };

  const discoveryFeed = getDISCOVERY_FEED();


  return (
    <main className="min-h-screen bg-[#0d0d0d] text-white selection:bg-[#FFB800] selection:text-black overflow-hidden font-sans" style={{ paddingTop: "52px" }}>
      <LayerNav prev={{ href: "/layer/orbit", label: "Orbit" }} next={{ href: "/layer/metropolis", label: "Metropolis" }} />
      <div className="fixed inset-0 pointer-events-none z-0">
        <BackgroundStratosphere />
      </div>
{/* SECTION 3: Layer 02 */}
      <section className="snap-section section-discover" id="discover-section" style={{ padding: 0 }}>
        <div className="property-split">
          {/* Left Menu Panel */}
          <div className="property-menu">
            <div className="menu-header">
              <span className="vector-label">Layer 02 // Stratosphere</span>
              <h2>Stories &amp; Market Intel</h2>
              <p>Neighborhood stories, market reports, and design features from around the Philippines.</p>
            </div>
            <nav className="menu-nav">
              {propertyTypes.map((type) => (
                <button
                  key={type}
                  className={`menu-btn ${activeDiscoverType === type ? "active" : ""}`}
                  onClick={() => setActiveDiscoverType(type)}
                >
                  {type}
                </button>
              ))}
            </nav>
            <div className="layer-mission">
              <h3>Mission</h3>
              <p>The Stratosphere serves as the Intelligence Layer. This is where market signals travel before they ever touch the ground — neighborhood stories, regional data, and design narratives that let you read the market from above, long before you descend into it.</p>
            </div>
            <div className="menu-footer">
              <Link href="/intel" className="prominent-action-link">
                Read the Stories &rarr;
              </Link>
            </div>
          </div>

          {/* Right Visual Canvas */}
          <div className="matrix-preview-pane">
            <header className="pane-header">
              <h3>{activeDiscoverType} Stories</h3>
              <p>Spotlights, articles &amp; collections</p>
            </header>
            
            <div className="discover-feed-preview" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
              {/* Part 1: Property Spotlights */}
              <div>
                <h4 style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', color: 'var(--accent)', letterSpacing: '0.1em', marginBottom: '16px' }}>Property Spotlights</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                  {discoveryFeed[getDBCategory(activeDiscoverType)].spotlights.map((spot, idx) => (
                    <div role="link" tabIndex={0} onClick={() => router.push(`/discover`)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); router.push(`/discover`); } }} key={idx} style={{ background: '#161616', border: '1px solid #262626', borderRadius: '4px', overflow: 'hidden', display: 'flex', flexDirection: 'column', textDecoration: 'none', color: 'inherit', cursor: 'pointer' }} className="discover-spotlight-card-link">
                      <div style={{ height: '140px', overflow: 'hidden', position: 'relative' }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={spot.image} alt={spot.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <span style={{ position: 'absolute', bottom: '12px', left: '12px', background: 'rgba(0,0,0,0.7)', color: 'var(--accent)', fontFamily: 'var(--font-mono)', fontSize: '10px', padding: '4px 8px', border: '1px solid var(--accent-border)', borderRadius: '2px' }}>{spot.style}</span>
                      </div>
                      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                        <h5 style={{ fontSize: '16px', fontWeight: '500', color: '#fff', marginBottom: '4px', fontFamily: 'var(--font-display)' }}>{spot.title}</h5>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>Location: {spot.location}</span>
                        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.5', marginBottom: '12px', flexGrow: 1 }}>{spot.desc}</p>
                        
                        {/* Asset-Intel Bridge News Segment */}
                        {spot.newsTitle && (
                          <div 
                            style={{ 
                              borderTop: "1px dashed rgba(255,255,255,0.08)", 
                              paddingTop: "12px", 
                              marginTop: "12px" 
                            }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <span style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "var(--accent)", textTransform: "uppercase", display: "block", marginBottom: "4px" }}>Linked Intelligence</span>
                            <Link 
                              href={`/intel/${spot.newsSlug}`}
                              style={{ 
                                // eslint-disable-next-line react/jsx-no-comment-textnodes
                                fontSize: "12px", 
                                color: "#fff", 
                                fontWeight: "600",
                                display: "block",
                                lineHeight: "1.3",
                                textDecoration: "underline",
                                marginBottom: "4px"
                              }}
                            >
                              {spot.newsTitle}
                            </Link>
                            <p style={{ fontSize: "11px", color: "var(--text-secondary)", lineHeight: "1.4", margin: 0, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                              {spot.newsExcerpt}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Part 2: Split News & Collections */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', borderTop: '1px solid #262626', paddingTop: '24px' }}>
                {/* News & Stories */}
                <div>
                  <h4 style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', color: 'var(--accent)', letterSpacing: '0.1em', marginBottom: '16px' }}>News &amp; Stories</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {discoveryFeed[getDBCategory(activeDiscoverType)].news.map((item, idx) => (
                      <Link
                        key={idx}
                        href={`/intel/${item.slug}`}
                        className="discover-news-item-link"
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                          <h5 className="news-item-title">{item.title}</h5>
                          <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{item.date}</span>
                        </div>
                        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.5', margin: 0 }}>{item.excerpt}</p>
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Curated Collections */}
                <div>
                  <h4 style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', color: 'var(--accent)', letterSpacing: '0.1em', marginBottom: '16px' }}>Curated Collections</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {discoveryFeed[getDBCategory(activeDiscoverType)].collections.map((coll, idx) => (
                      <div key={idx} className="curated-collection-btn" style={{ background: '#161616', border: '1px solid #262626', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', transition: 'all 0.3s ease', borderRadius: '4px' }}>
                        <span style={{ fontSize: '13px', color: '#fff' }}>{coll}</span>
                        <span style={{ color: 'var(--accent)', fontSize: '12px' }}>Explore &rarr;</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="matrix-legend-caption" style={{ borderTop: '1px solid #262626', paddingTop: '24px', marginTop: '24px' }}>
              Our editors trace design movements and regional narratives across the Philippine islands.
            </div>
          </div>
        </div>
      </section>
</main>
        
  );
}
