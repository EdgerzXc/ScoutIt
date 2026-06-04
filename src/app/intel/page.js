"use client";

import Header from "@/components/Header";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getArticles, getProperties } from "@/data/mockDb";

const MOCK_CATEGORIES = {
  "batasan-hills": "Residential",
  "aurelia-residences": "Residential",
  "the-estate-makati": "Residential",
  "gridwork-studio": "Commercial",
  "zuellig-building": "Commercial",
  "arthaland-century-pacific": "Commercial",
  "pacific-edge-villa": "STR",
  "siargao-tropical-villa": "STR",
  "palawan-eco-retreat": "Hospitality",
  "gallery-by-chele": "Restaurants",
  "antonios-tagaytay": "Restaurants",
  "the-glasshouse-bgc": "Venues"
};

export default function IntelPage() {
  const router = useRouter();
  const [filter, setFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [articles, setArticles] = useState(getArticles());
  const [propertiesList, setPropertiesList] = useState([]);

  useEffect(() => {
    async function loadCMSData() {
      try {
        const res = await fetch("/api/cms");
        if (!res.ok) throw new Error();
        const data = await res.json();

        // 1. Setup properties for asset back-linking
        const airtableProperties = data.properties || [];
        const baseProperties = getProperties().map(p => {
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
        console.error("Intel page CMS load error:", err);
      }
    }
    loadCMSData();
  }, []);

  const categories = ["All", "Residential", "Commercial", "STR", "Hospitality", "Culinary", "Venues"];

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
        <header className="page-header">
          <span className="vector-label">Layer 02 // Editorial Briefings</span>
          <h1 className="page-title">News &amp; Intelligence</h1>
          <p className="page-subtitle">Tracing architectural shifts, spatial design, and development movements.</p>
        </header>

        {/* Featured Split Hero (Only shown when filter is All and search is empty) */}
        {filter === "All" && searchQuery.trim() === "" && featuredArticle && (
          <section className="featured-trending-split">
            {/* Left Featured Card */}
            <Link href={`/intel/${featuredArticle.slug}`} className="featured-card-new">
              <div className="featured-image-wrapper">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={featuredArticle.image} alt={featuredArticle.title} className="featured-image-new" />
                <div className="featured-overlay-new"></div>
              </div>
              <div className="featured-content-new">
                <span className="featured-tag-new">{featuredArticle.category} &middot; Featured Briefing</span>
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
                className={`filter-btn ${filter === cat ? "active" : ""}`}
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
                <Link href={`/intel/${art.slug}`} key={art.slug} className="article-card">
                  <div className="article-image-container">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={art.image} alt={art.title} className="article-image" />
                    <div className="image-overlay"></div>
                  </div>
                  <div className="article-content">
                    <div className="article-header">
                      <span className="article-category">{art.category}</span>
                      <span className="article-date">{art.date}</span>
                    </div>
                    <h3 className="article-title">{art.title}</h3>
                    <p className="article-excerpt">{art.excerpt}</p>
                    
                    {/* Featured Asset Back-link Tag */}
                    {(() => {
                      const linkedProp = getLinkedProperty(art);
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

                    <span className="read-more-btn" style={{ marginTop: "16px", display: "inline-block" }}>Read Briefing →</span>
                  </div>
                </Link>
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

        /* Split Hero */
        .featured-trending-split {
          display: grid;
          grid-template-columns: 1.6fr 1fr;
          gap: 32px;
          margin-bottom: 64px;
        }

        .featured-card-new {
          display: flex;
          flex-direction: column;
          background: var(--surface);
          border: 1px solid var(--border-solid);
          border-radius: var(--radius-md);
          overflow: hidden;
          transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
          text-decoration: none;
          height: 480px;
        }

        .featured-card-new:hover {
          border-color: var(--accent-border);
          box-shadow: var(--shadow-lg);
        }

        .featured-image-wrapper {
          height: 240px;
          position: relative;
          overflow: hidden;
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
          background: linear-gradient(to top, var(--surface) 0%, transparent 100%);
        }

        .featured-content-new {
          padding: 24px;
          display: flex;
          flex-direction: column;
          flex-grow: 1;
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
          font-size: 9px;
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
          background: rgba(200, 169, 110, 0.08);
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
          .featured-card-new {
            height: auto;
          }
        }

        @media (max-width: 768px) {
          .articles-grid {
            grid-template-columns: 1fr;
          }
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
          font-size: 9px;
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
      `}</style>
    </div>
  );
}
