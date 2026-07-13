
"use client";

import LayerNav from "@/components/descent/LayerNav";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { getArticles } from "@/data/mockArticles";

import BackgroundStratosphere from "@/components/descent/BackgroundStratosphere";
import LayerHeader from "@/components/descent/LayerHeader";
import LayerTransition from "@/components/descent/LayerTransition";

const EMPTY_FEED = {
  Residential: { spotlights: [], news: [], collections: [] },
  Commercial: { spotlights: [], news: [], collections: [] },
  STR: { spotlights: [], news: [], collections: [] },
  Hospitality: { spotlights: [], news: [], collections: [] },
  Restaurants: { spotlights: [], news: [], collections: [] },
  Venues: { spotlights: [], news: [], collections: [] },
};

const normalizeCategory = (raw) => {
  const c = (raw || "Residential").toLowerCase();
  if (c === "hospitality") return "Hospitality";
  if (c === "str") return "STR";
  if (c === "culinary" || c === "restaurants") return "Restaurants";
  if (c === "venues" || c === "events") return "Venues";
  if (c === "commercial") return "Commercial";
  return "Residential";
};

export default function StratosphereLayer() {
  const router = useRouter();
  const [activeDiscoverType, setActiveDiscoverType] = useState("Residential");
  // The intelligence feed mirrors the homepage's: live CMS properties become
  // spotlights, editorial articles (mock base + Airtable intel in front, same
  // policy as /intel) become the news column. This was a hardcoded empty
  // object after the 2026-07-05 cleanup, which left the whole layer blank.
  const [discoveryFeed, setDiscoveryFeed] = useState(EMPTY_FEED);

  useEffect(() => {
    let alive = true;
    async function loadFeed() {
      try {
        const res = await fetch("/api/cms");
        if (!alive || !res.ok) return;
        const data = await res.json();
        if (!alive) return;

        const feed = structuredClone(EMPTY_FEED);

        const articles = [...getArticles()].map((a) => ({
          slug: a.slug,
          title: a.title,
          category: normalizeCategory(a.category),
          date: a.date || "",
          excerpt: a.excerpt || "",
        }));
        (data.intel || []).forEach((item) => {
          if (!articles.some((x) => x.slug === item.slug)) {
            articles.unshift({
              slug: item.slug || item.id,
              title: item.title,
              category: normalizeCategory(item.category),
              date: item.date || "Just Now",
              excerpt: item.excerpt || "",
            });
          }
        });
        articles.forEach((a) => {
          if (feed[a.category]) feed[a.category].news.push(a);
        });

        (data.properties || []).forEach((p) => {
          if (!p.title || !p.slug || !p.spaceCategory) return;
          const category = normalizeCategory(p.spaceCategory);
          if (!feed[category] || feed[category].spotlights.some((x) => x.slug === p.slug)) return;
          const news =
            articles.find((a) => a.category === category) || null;
          feed[category].spotlights.push({
            id: p.id,
            slug: p.slug || p.id,
            title: p.title,
            location: p.location || p.city,
            style: p.aestheticTag || "Modernist",
            image: p.image || (p.photos?.[0]) || "",
            desc: p.hook || "",
            newsTitle: news ? news.title : null,
            newsSlug: news ? news.slug : null,
            newsExcerpt: news ? news.excerpt : null,
          });
        });

        setDiscoveryFeed(feed);
      } catch (err) {
        if (alive) console.error("Stratosphere feed load error:", err);
      }
    }
    loadFeed();
    return () => { alive = false; };
  }, []);

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


  return (
    <main className="min-h-screen bg-[#0d0d0d] text-white selection:bg-gold-accent selection:text-black overflow-hidden font-sans" style={{ paddingTop: "52px" }}>
      <LayerNav prev={{ href: "/layer/orbit", label: "Orbit" }} next={{ href: "/layer/metropolis", label: "Metropolis" }} />
      <div className="fixed inset-0 pointer-events-none z-0">
        <BackgroundStratosphere />
      </div>
      <div className="layer-pane relative z-10">
        <LayerHeader 
          layerNum="02" 
          layerName="Stratosphere" 
          title="Stories & Market Intel" 
          description="Neighborhood stories, market reports, and design features from around the Philippines." 
          missionText="The Stratosphere serves as the Intelligence Layer. This is where market signals travel before they ever touch the ground — neighborhood stories, regional data, and design narratives that let you read the market from above, long before you descend into it." 
          ctaText="Discover Stories →"
          ctaHref="/intel"
        />
        {/* SECTION 3: Layer 02 */}
        <section className="snap-section section-discover" id="discover-section" style={{ padding: 0 }}>
        <div className="descent-split">
          {/* Left Menu Panel */}
          <div className="descent-sidebar" style={{ justifyContent: "space-between" }}>
            <nav className="descent-nav">
              {propertyTypes.map((type) => (
                <button
                  key={type}
                  className={`descent-cat ${activeDiscoverType === type ? "on" : ""}`}
                  onClick={() => setActiveDiscoverType(type)}
                >
                  {type}
                </button>
              ))}
            </nav>

            <div className="menu-footer" style={{ marginTop: "32px" }}>
              <Link href="/intel" className="prominent-action-link">
                Read the Stories &rarr;
              </Link>
            </div>
          </div>

          {/* Right Visual Canvas */}
          <div className="descent-content matrix-preview-pane">
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
        <LayerTransition 
          nextNum="03" 
          nextName="Metropolis" 
          nextHref="/layer/metropolis" 
          teaser="Drop below the clouds. The city directory opens up." 
        />
      </div>
    </main>
        
  );
}
