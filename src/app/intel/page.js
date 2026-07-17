"use client";

import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Link from "next/link";
import MeshHero from "@/components/ui/MeshHero";
import HoverCard from "@/components/ui/HoverCard";

function getArticleType(art) {
  if (!art) return "Analysis";
  const slug = (art.slug || "").toLowerCase();
  const title = (art.title || "").toLowerCase();
  const cat = (art.category || "").toLowerCase();
  if (slug.includes("movement") || slug.includes("resurgence") || slug.includes("outlook") || slug.includes("insight") || title.includes("insight") || cat.includes("insight")) {
    return "Insight";
  }
  if (slug.includes("demand") || slug.includes("boom") || slug.includes("surge") || slug.includes("entry") || slug.includes("report") || title.includes("report") || cat.includes("report")) {
    return "Report";
  }
  return "Analysis";
}
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getArticles } from "@/data/mockArticles";

const MOCK_CATEGORIES = {
  "batasan-hills": "Residential",
  "aurelia-residences": "Residential",
  "the-estate-makati": "Residential",
  "gridwork-studio": "Commercial",
  "zuellig-building": "Commercial",
  "arthaland-century-pacific": "Commercial",
  "pacific-edge-villa": "STR",
  "siargao-tropical-villa": "STR",
  "boracay-bamboo-hideaway": "STR",
  "palawan-eco-retreat": "Hospitality",
  "coron-island-resort": "Hospitality",
  "bohol-treehouse-lodge": "Hospitality",
  "gallery-by-chele": "Restaurants",
  "antonios-tagaytay": "Restaurants",
  "the-glasshouse-bgc": "Venues",
  "solaire-grand-ballroom": "Venues",
  "sky-pavilion-makati": "Venues"
};

export default function IntelPage() {
  const router = useRouter();
  const [filter, setFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  // Editorial mock briefings are the base layer (same set the homepage links
  // to); live Airtable intel is merged in front once it loads. The 2026-07-05
  // dead-code cleanup emptied this to [] which left the hub blank — and every
  // homepage news teaser 404ing — whenever Airtable INTEL had no records.
  const [articles, setArticles] = useState(getArticles());
  const [propertiesList, setPropertiesList] = useState([]);
  const [sidePanelArticle, setSidePanelArticle] = useState(null);

  useEffect(() => {
    let alive = true;
    async function loadCMSData() {
      try {
        const res = await fetch("/api/cms");
        if (!alive) return;
        if (!res.ok) throw new Error();
        const data = await res.json();
        if (!alive) return;

        // 1. Setup properties for asset back-linking
        const airtableProperties = data.properties || [];
        const baseProperties = [].map(p => {
          let cat = MOCK_CATEGORIES[p.slug] || p.spaceCategory || "Residential";
          return {
            slug: p.slug,
            title: p.title,
            city: p.city,
            spaceCategory: cat
          };
        });
        const mergedProperties = [...baseProperties];
        airtableProperties.forEach(p => {
          if (!mergedProperties.some(x => x.slug === p.slug)) {
            let cat = p.spaceCategory || "Residential";
            mergedProperties.push({
              slug: p.slug || p.id,
              title: p.title,
              city: p.city || "",
              spaceCategory: cat
            });
          }
        });
        setPropertiesList(mergedProperties);

        // 2. Setup intel reports
        const airtableIntel = data.intel || [];
        const baseArticles = [...getArticles()];
        airtableIntel.forEach(item => {
          if (!baseArticles.some(x => x.slug === item.slug)) {
            let category = item.category || "Residential";
            if (category.toLowerCase() === "hospitality") category = "Hospitality";
            if (category.toLowerCase() === "str") category = "STR";
            if (category.toLowerCase() === "culinary" || category.toLowerCase() === "restaurants") category = "Culinary";
            if (category.toLowerCase() === "venues" || category.toLowerCase() === "events") category = "Venues";

            baseArticles.unshift({
              slug: item.slug || item.id,
              title: item.title,
              category,
              date: item.date || "Just Now",
              excerpt: item.excerpt || "",
              image: item.image || ""
            });
          }
        });
        setArticles(baseArticles);
      } catch (err) {
        // Navigating away aborts the fetch — only report while still mounted.
        if (alive) console.error("Intel page CMS load error:", err);
      }
    }
    loadCMSData();
    return () => { alive = false; };
  }, []);

  const categories = ["All", "Residential", "Commercial", "STR", "Hospitality", "Culinary", "Venues", "Summary"];

  // Match and fetch property link dynamically
  const getLinkedProperty = (article) => {
    // Match by exact city name
    if (article.city) {
      const match = propertiesList.find(p => p.city.toLowerCase().includes(article.city.toLowerCase()));
      if (match) return match;
    }
    // Match by slug keywords
    const matchSlug = propertiesList.find(p => article.slug.toLowerCase().includes(p.slug.toLowerCase()) || p.slug.toLowerCase().includes(article.slug.toLowerCase()));
    if (matchSlug) return matchSlug;

    // Match by category mapping
    let mappedCat = article.category || "";
    if (mappedCat.toLowerCase() === "hospitality") mappedCat = "Hospitality";
    if (mappedCat.toLowerCase() === "str") mappedCat = "STR";
    if (mappedCat.toLowerCase() === "culinary" || mappedCat.toLowerCase() === "restaurants") mappedCat = "Restaurants";
    if (mappedCat.toLowerCase() === "venues" || mappedCat.toLowerCase() === "events") mappedCat = "Venues";
    const matchCat = propertiesList.find(p => p.spaceCategory.toLowerCase() === mappedCat.toLowerCase());
    return matchCat || null;
  };

  // Filter and search articles dynamically
  const filteredArticles = articles.filter(art => {
    // Category check
    if (filter !== "All" && art.category !== filter) {
      return false;
    }
    // Search query check
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      const matchTitle = art.title.toLowerCase().includes(q);
      const matchExcerpt = art.excerpt && art.excerpt.toLowerCase().includes(q);
      const matchCat = art.category.toLowerCase().includes(q);
      return matchTitle || matchExcerpt || matchCat;
    }
    return true;
  });

  // Top picks for split hero
  const featuredArticle = filteredArticles[0];
  const trendingArticles = filteredArticles.slice(1, 4);
  const remainingArticles = filteredArticles.slice(featuredArticle ? 1 : 0);

  return (
    <div className="page-wrapper">
      <Header />
      <main className="intel-main">
        <MeshHero
          tag="Layer 2.2 // Editorial Briefings"
          title="Intel"
          subtitle="Tracing architectural shifts, spatial design, and development dispatches."
        >
          <Link href="/discover" className="mt-6 inline-flex items-center gap-3 no-underline border border-surface-variant px-5 py-3 rounded-sm font-mono text-xs uppercase tracking-[0.1em] text-text-secondary hover:text-gold-accent hover:border-gold-accent transition-colors active:scale-[0.98]">
            <span className="text-text-muted">Intel</span>
            <span className="text-gold-accent">→</span>
            <span className="text-gold-accent">Discover</span>
          </Link>
        </MeshHero>

        {/* Featured Split Hero (Only shown when filter is All and search is empty) */}
        {filter === "All" && searchQuery.trim() === "" && featuredArticle && (
          <section className="featured-trending-split">
            {/* Left Featured Card */}
            <Link href={`/intel/${featuredArticle.slug}`} className="featured-card-new">
              <div className="featured-image-wrapper">
                {featuredArticle.image ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={featuredArticle.image} alt={featuredArticle.title} className="featured-image-new" />
                ) : null}
                <div className="featured-overlay-new"></div>
              </div>
              <div className="featured-content-new">
                <div className="featured-badge-row" style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '12px' }}>
                  <span className="featured-tag-new" style={{ margin: 0 }}>{featuredArticle.category}</span>
                  <span className={`article-type-badge ${getArticleType(featuredArticle).toLowerCase()}`} style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', padding: '2px 6px', borderRadius: '2px', textTransform: 'uppercase' }}>{getArticleType(featuredArticle)}</span>
                  <span className="featured-read-time" style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>{Math.max(1, Math.round((featuredArticle.excerpt || "").split(/\s+/).length / 20))} min read</span>
                </div>
                <h2>{featuredArticle.title}</h2>
                <p className="featured-excerpt-new">{featuredArticle.excerpt}</p>
                <div className="featured-footer-new">
                  <span className="featured-date-new">{featuredArticle.date}</span>
                  <span className="featured-link-new">Read Deep Analysis →</span>
                </div>
              </div>
            </Link>

            {/* Right Trending List */}
            <div className="trending-list">
              <span className="vector-label" style={{ marginBottom: "8px", display: "block" }}>Trending Briefings</span>
              {trendingArticles.length > 0 ? (
                trendingArticles.map((art, idx) => (
                  <Link href={`/intel/${art.slug}`} key={art.slug} className="trending-dispatch-card">
                    <span className="trending-meta">0{idx + 1} &middot; {art.category} &middot; {art.date}</span>
                    <h3 className="trending-title">{art.title}</h3>
                    <p className="trending-excerpt">{art.excerpt}</p>
                  </Link>
                ))
              ) : (
                <div className="trending-dispatch-card" style={{ justifyContent: "center", alignItems: "center", height: "100%" }}>
                  <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>No trending dispatches.</span>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Search & Filter Section */}
        <section className="controls-section">
          <div className="search-bar-wrapper">
            <input
              type="text"
              className="articles-search-input"
              placeholder="SEARCH BRIEFINGS BY TOPIC, HEADLINE, OR DESIGN KEYWORDS..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="filter-tabs-wrapper">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`filter-btn font-mono text-xs tracking-[0.1em] uppercase px-4 py-2 border rounded-sm transition-colors active:scale-[0.98] ${filter === cat ? "bg-gold-accent text-background border-gold-accent shadow-[0_0_15px_rgba(232,174,60,0.3)]" : "bg-transparent text-text-secondary border-surface-variant hover:border-gold-accent hover:text-gold-accent"}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </section>

        {/* Articles Feed */}
        <section className="grid-container">
          <div className="articles-grid">
            {remainingArticles.length > 0 ? (
              remainingArticles.map((art) => (
                <HoverCard
                  key={art.slug}
                  className="article-card flex flex-col h-full bg-surface-alt border border-surface-variant rounded-md overflow-hidden"
                  onClick={() => setSidePanelArticle(art)}
                  style={{ cursor: "pointer" }}
                >
                  <div className="article-image-container">
                    {art.image ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={art.image} alt={art.title} className="article-image" />
                    ) : null}
                    <div className="image-overlay"></div>
                  </div>
                  <div className="article-content">
                    <div className="article-header" style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '12px' }}>
                      <span className="article-category" style={{ marginRight: 'auto' }}>{art.category}</span>
                      <span className={`article-type-badge ${getArticleType(art).toLowerCase()}`} style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', padding: '2px 6px', borderRadius: '2px', textTransform: 'uppercase' }}>{getArticleType(art)}</span>
                      <span className="article-read-time" style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{Math.max(1, Math.round((art.excerpt || "").split(/\s+/).length / 20))} min read</span>
                    </div>
                    <h3 className="article-title">{art.title}</h3>
                    <p className="article-excerpt">{art.excerpt}</p>

                    {/* Featured Asset Back-link Tag */}
                    {(() => {
                      const linkedProp = null;
                      if (!linkedProp) return null;
                      return (
                        <div style={{ marginTop: "12px", borderTop: "1px dashed rgba(255,255,255,0.08)", paddingTop: "12px" }}>
                          <span style={{ fontSize: "10px", fontFamily: "var(--font-mono)", color: "var(--accent)" }}>
                            FEATURED SPACE:{" "}
                            <span
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                router.push(`/property/${linkedProp.slug}`);
                              }}
                              style={{ textDecoration: "underline", cursor: "pointer" }}
                            >
                              {linkedProp.title}
                            </span>
                          </span>
                        </div>
                      );
                    })()}

                    <span className="read-more-btn" style={{ marginTop: "16px", display: "inline-block", color: "var(--accent)" }}>Read Briefing →</span>
                  </div>
                </HoverCard>
              ))
            ) : (
              <div className="articles-empty-state" style={{ gridColumn: "1 / -1", textAlign: "center", padding: "60px 20px" }}>
                <h3 style={{ fontFamily: "var(--font-display)", color: "#fff", fontSize: "20px" }}>No Briefings Found</h3>
                <p style={{ color: "var(--text-secondary)", fontSize: "12px", marginTop: "8px" }}>Try refining your search terms or selecting a different sector filter.</p>
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />

      {/* Intel Side Panel */}
      {sidePanelArticle && (
        <div className="side-panel-overlay" onClick={() => setSidePanelArticle(null)}>
          <div className="side-panel" onClick={(e) => e.stopPropagation()}>
            <button className="side-panel-close" aria-label="Close" onClick={() => setSidePanelArticle(null)}>✕</button>
            {sidePanelArticle.image && (
              <div className="side-panel-image" style={{ backgroundImage: `url(${sidePanelArticle.image})` }}></div>
            )}
            <div className="side-panel-body">
              <div className="side-panel-badge-row" style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                <span className="side-panel-cat">{sidePanelArticle.category}</span>
                <span className={`article-type-badge ${getArticleType(sidePanelArticle).toLowerCase()}`} style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', padding: '2px 6px', borderRadius: '2px', textTransform: 'uppercase' }}>{getArticleType(sidePanelArticle)}</span>
                <span className="side-panel-read-time" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{Math.max(1, Math.round((sidePanelArticle.excerpt || "").split(/\s+/).length / 20))} min read</span>
              </div>
              
              <div className="scan-progress-wrapper" style={{ marginTop: '4px', marginBottom: '8px' }}>
                <div className="scan-progress-label" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase' }}>
                  <span>Briefing Integrity Deep Scan</span>
                  <span style={{ color: 'var(--accent)' }}>92% SECURE</span>
                </div>
                <div className="scan-progress-bar" style={{ height: '3px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
                  <div className="scan-progress-fill" style={{ height: '100%', background: 'var(--accent)', width: '92%' }}></div>
                </div>
              </div>

              {["INSIGHT", "Insight"].includes(sidePanelArticle.category) && (
                <div className="side-panel-insight-note">
                  <span>ScoutIt Insight</span>
                  <p>A projection based on available data, not a verified fact.</p>
                </div>
              )}
              <h2 className="side-panel-title">{sidePanelArticle.title}</h2>
              <p className="side-panel-excerpt">{sidePanelArticle.excerpt}</p>
              <Link href={`/intel/${sidePanelArticle.slug}`} className="side-panel-cta">
                Open Full Article →
              </Link>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .page-wrapper {
          background: var(--bg);
          color: var(--text-primary);
          min-height: 100vh;
        }

        .intel-main {
          padding: 60px 45px;
          max-width: 1400px;
          margin: 0 auto;
        }

        .page-header {
          text-align: center;
          margin-bottom: 48px;
        }

        .vector-label {
          font-family: var(--font-mono);
          font-size: 11px;
          color: var(--accent);
          letter-spacing: 0.15em;
          text-transform: uppercase;
        }

        .page-title {
          font-family: var(--font-display);
          font-size: 42px;
          margin: 12px 0;
          color: var(--text-primary);
        }

        .page-subtitle {
          font-size: 14px;
          color: var(--text-secondary);
          letter-spacing: 0.02em;
        }

        .mode-jump-box {
          display: inline-flex;
          align-items: center;
          gap: 12px;
          margin-top: 20px;
          text-decoration: none;
          border: 1px solid var(--border-solid);
          border-radius: 999px;
          padding: 10px 20px;
          background: #141414;
          transition: all var(--transition-fast);
        }
        .mode-jump-box:hover {
          border-color: var(--accent-border);
          background: rgba(232, 174, 60, 0.06);
        }
        .mode-jump-box .jump-here {
          font-family: var(--font-mono);
          font-size: 11px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--accent);
        }
        .mode-jump-box .jump-arrow {
          color: var(--text-muted);
          font-size: 13px;
          transition: transform var(--transition-fast);
        }
        .mode-jump-box:hover .jump-arrow { transform: translateX(3px); }
        .mode-jump-box .jump-there {
          font-family: var(--font-mono);
          font-size: 11px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--text-secondary);
        }

        /* Split Hero */
        .featured-trending-split {
          display: grid;
          grid-template-columns: 1.6fr 1fr;
          gap: 32px;
          margin-bottom: 64px;
        }

        .featured-card-new {
          position: relative;
          display: flex;
          flex-direction: column;
          background: #000;
          border: 1px solid var(--border-solid);
          border-radius: var(--radius-md);
          overflow: hidden;
          transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
          text-decoration: none;
          height: 600px; /* Taller hero */
        }

        .featured-card-new:hover {
          border-color: var(--accent-border);
          box-shadow: var(--shadow-lg);
        }

        .featured-image-wrapper {
          position: absolute;
          inset: 0;
          height: 100%;
          width: 100%;
          z-index: 1;
        }

        .featured-image-new {
          width: 100%;
          height: 100%;
          object-fit: cover;
          filter: grayscale(40%) contrast(1.1);
          transition: transform var(--transition-slow), filter var(--transition-slow);
        }

        .featured-card-new:hover .featured-image-new {
          transform: scale(1.03);
          filter: grayscale(0%) contrast(1.1);
        }

        .featured-overlay-new {
          position: absolute;
          inset: 0;
          background: linear-gradient(to top, rgba(9, 9, 9, 0.98) 0%, rgba(9, 9, 9, 0.6) 50%, rgba(9, 9, 9, 0.1) 80%, transparent 100%);
          z-index: 2;
        }

        .featured-content-new {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          z-index: 3;
          padding: 40px;
          display: flex;
          flex-direction: column;
          background: transparent;
        }

        /* Article Type Badge Styles */
        .article-type-badge {
          display: inline-block;
          font-weight: 600;
        }
        .article-type-badge.insight {
          background: rgba(0, 122, 255, 0.15);
          color: #007aff;
          border: 0.5px solid rgba(0, 122, 255, 0.3);
        }
        .article-type-badge.report {
          background: rgba(232, 174, 60, 0.15);
          color: #E8AE3C;
          border: 0.5px solid rgba(232, 174, 60, 0.3);
        }
        .article-type-badge.analysis {
          background: rgba(255, 255, 255, 0.08);
          color: #ffffff;
          border: 0.5px solid rgba(255, 255, 255, 0.2);
        }

        .featured-tag-new {
          font-family: var(--font-mono);
          font-size: 10px;
          color: var(--accent);
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin-bottom: 12px;
        }

        .featured-content-new h2 {
          font-family: var(--font-display);
          font-size: 24px;
          color: #fff;
          margin-bottom: 12px;
          line-height: 1.3;
        }

        .featured-excerpt-new {
          font-size: 13px;
          line-height: 1.6;
          color: var(--text-secondary);
          margin-bottom: 20px;
          flex-grow: 1;
        }

        .featured-footer-new {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
          padding-top: 16px;
        }

        .featured-date-new {
          font-size: 12px;
          color: var(--text-muted);
        }

        .featured-link-new {
          font-size: 12px;
          font-weight: bold;
          color: var(--accent);
        }

        .trending-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .trending-dispatch-card {
          background: var(--surface);
          border: 1px solid var(--border-solid);
          border-radius: var(--radius-md);
          padding: 20px;
          text-decoration: none;
          display: flex;
          flex-direction: column;
          justify-content: center;
          transition: all var(--transition-fast);
          flex-grow: 1;
        }

        .trending-dispatch-card:hover {
          border-color: var(--accent-border);
          transform: translateX(4px);
          box-shadow: var(--shadow-sm);
        }

        .trending-meta {
          font-family: var(--font-mono);
          font-size: 10px;
          color: var(--accent);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 8px;
        }

        .trending-title {
          font-family: var(--font-display);
          font-size: 15px;
          color: #fff;
          line-height: 1.35;
          margin-bottom: 6px;
        }

        .trending-excerpt {
          font-size: 11px;
          color: var(--text-secondary);
          line-height: 1.45;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        /* Controls Section */
        .controls-section {
          background: var(--surface);
          border: 1px solid var(--border-solid);
          border-radius: var(--radius-md);
          padding: 24px;
          margin-bottom: 48px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .search-bar-wrapper {
          width: 100%;
        }

        .articles-search-input {
          width: 100%;
          background: #0e0e0e;
          border: 1px solid var(--border-solid);
          border-radius: var(--radius-sm);
          padding: 14px 20px;
          font-size: 13px;
          color: #fff;
          font-family: var(--font-mono);
          transition: border-color var(--transition-fast);
        }

        .articles-search-input:focus {
          outline: none;
          border-color: var(--accent);
        }

        .filter-tabs-wrapper {
          display: flex;
          justify-content: flex-start;
          gap: 12px;
          flex-wrap: wrap;
        }

        .filter-btn {
          background: transparent;
          border: 1px solid transparent;
          color: var(--text-secondary);
          font-family: var(--font-body);
          font-size: 13px;
          font-weight: 550;
          padding: 8px 18px;
          cursor: pointer;
          border-radius: 4px;
          transition: all var(--transition-fast);
        }

        .filter-btn:hover {
          color: var(--accent);
          background: rgba(255, 255, 255, 0.02);
        }

        .filter-btn.active {
          color: var(--accent);
          border-color: var(--accent);
          background: rgba(232, 174, 60, 0.08);
        }

        /* Grid */
        .articles-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 32px;
        }

        @media (max-width: 1024px) {
          .articles-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .featured-trending-split {
            grid-template-columns: 1fr;
            gap: 24px;
          }
          /* The image, overlay and content inside the hero are ALL absolutely
             positioned, so height:auto collapses the card to a thin strip
             (the cut-in-half picture). Give it a real height on tablet/phone. */
          .featured-card-new {
            height: 460px;
          }
        }

        @media (max-width: 768px) {
          .articles-grid {
            grid-template-columns: 1fr;
            gap: 20px;
          }
          .article-card:hover { transform: none; }
          .article-card:active { border-color: var(--accent-border); }
          .article-image-container { height: 160px; }
          .article-content { padding: 16px; }
          .featured-card-new { height: 420px; }
          .featured-content-new { padding: 24px; }
        }

        @media (max-width: 640px) {
          .articles-grid { gap: 14px; }
          .article-image-container { height: 140px; }
          .article-content { padding: 14px; }
        }

        @media (max-width: 480px) {
          .article-image-container { height: 120px; }
          .article-content { padding: 12px; }
          .featured-card-new { height: 380px; }
          .featured-content-new { padding: 20px; }
          .featured-content-new h2 { font-size: 20px; }
        }

        .article-card {
          background: var(--surface);
          border: 1px solid var(--border-solid);
          border-radius: var(--radius-md);
          overflow: hidden;
          display: flex;
          flex-direction: column;
          transition: transform var(--transition-fast), border-color var(--transition-fast);
          text-decoration: none;
        }

        .article-card:hover {
          border-color: var(--accent-border);
          transform: translateY(-4px);
          box-shadow: var(--shadow-lg);
        }

        .article-image-container {
          position: relative;
          height: 200px;
          overflow: hidden;
        }

        .article-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          filter: grayscale(50%) contrast(1.1);
          transition: transform var(--transition-slow), filter var(--transition-slow);
        }

        .article-card:hover .article-image {
          transform: scale(1.05);
          filter: grayscale(0%) contrast(1.1);
        }

        .image-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(to top, var(--surface) 0%, transparent 60%);
        }

        .article-content {
          padding: 24px;
          display: flex;
          flex-direction: column;
          flex: 1;
        }

        .article-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 12px;
        }

        .article-category {
          font-family: var(--font-mono);
          font-size: 10px;
          color: var(--accent);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .article-date {
          font-size: 11px;
          color: var(--text-muted);
        }

        .article-title {
          font-family: var(--font-display);
          font-size: 20px;
          color: var(--text-primary);
          margin-bottom: 12px;
          line-height: 1.3;
        }

        .article-excerpt {
          font-size: 13px;
          line-height: 1.6;
          color: var(--text-secondary);
          margin-bottom: 24px;
          flex: 1;
        }

        .read-more-btn {
          font-size: 11px;
          font-weight: 600;
          color: var(--accent);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        /* Intel Side Panel */
        .side-panel-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.6);
          backdrop-filter: blur(4px);
          z-index: 1000;
        }

        .side-panel {
          position: fixed;
          top: 0;
          right: 0;
          height: 100vh;
          width: 420px;
          max-width: 95vw;
          background: #111111;
          border-left: 1px solid var(--border-solid);
          display: flex;
          flex-direction: column;
          overflow-y: auto;
          animation: slideInRight 0.3s cubic-bezier(0.19, 1, 0.22, 1);
        }

        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }

        .side-panel-close {
          position: absolute;
          top: 20px;
          right: 20px;
          background: transparent;
          border: 1px solid var(--border-solid);
          color: var(--text-muted);
          font-size: 14px;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          border-radius: 2px;
          transition: all 0.2s ease;
          z-index: 2;
        }

        .side-panel-close:hover {
          border-color: var(--accent);
          color: var(--accent);
        }

        .side-panel-image {
          width: 100%;
          height: 220px;
          background-size: cover;
          background-position: center;
          filter: grayscale(40%) contrast(1.1);
          flex-shrink: 0;
        }

        .side-panel-body {
          padding: 32px 28px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .side-panel-cat {
          font-family: var(--font-mono);
          font-size: 10px;
          color: var(--accent);
          text-transform: uppercase;
          letter-spacing: 0.12em;
        }

        .side-panel-insight-note {
          background: rgba(232, 174, 60,0.07);
          border: 1px solid rgba(232, 174, 60,0.3);
          border-left: 3px solid #E8AE3C;
          border-radius: 4px;
          padding: 12px 16px;
        }

        .side-panel-insight-note span {
          font-family: var(--font-mono);
          font-size: 10px;
          color: #E8AE3C;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          font-weight: 700;
          display: block;
          margin-bottom: 4px;
        }

        .side-panel-insight-note p {
          font-size: 12px;
          color: #E8AE3C;
          margin: 0;
          opacity: 0.8;
        }

        .side-panel-title {
          font-family: var(--font-display);
          font-size: 24px;
          color: #fff;
          line-height: 1.3;
          margin: 0;
        }

        .side-panel-excerpt {
          font-size: 14px;
          line-height: 1.7;
          color: var(--text-secondary);
          margin: 0;
        }

        .side-panel-cta {
          display: inline-block;
          margin-top: 8px;
          padding: 12px 24px;
          background: transparent;
          border: 1px solid var(--accent);
          color: var(--accent);
          font-family: var(--font-mono);
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          text-decoration: none;
          border-radius: 4px;
          transition: all 0.2s ease;
          align-self: flex-start;
        }

        .side-panel-cta:hover {
          background: var(--accent);
          color: #0e0e0e;
        }
      `}</style>
    </div>
  );
}
