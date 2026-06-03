"use client";

import Header from "@/components/Header";
import Link from "next/link";
import { useState } from "react";

const ARTICLES = [
  {
    slug: "bgc-spatial-movement",
    title: "BGC Spatial Movement",
    category: "Residential",
    date: "June 2026",
    excerpt: "A rise in demand for low-density residences drives modernist villa acquisitions across Bonifacio Global City core.",
    image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80"
  },
  {
    slug: "return-of-quiet-luxury",
    title: "The Return of Quiet Luxury",
    category: "Residential",
    date: "May 2026",
    excerpt: "Local high-net-worth buyers increasingly favor hidden properties in Quezon City over flashy, visible estates.",
    image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80"
  },
  {
    slug: "green-office-demand",
    title: "Green Office Demand",
    category: "Commercial",
    date: "June 2026",
    excerpt: "Global firms in Manila mandate LEED-certified workspaces, shaping future skyscraper architectural footprints.",
    image: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80"
  },
  {
    slug: "bgc-commercial-corridors",
    title: "BGC Commercial Corridors",
    category: "Commercial",
    date: "April 2026",
    excerpt: "Retail podiums and commercial corridors evolve to incorporate open-air sky parks and wellness zones.",
    image: "https://images.unsplash.com/photo-1582653291997-079a1c04e5d1?w=800&q=80"
  },
  {
    slug: "surf-front-land-rush",
    title: "Surf-Front Land Rush",
    category: "Hospitality",
    date: "June 2026",
    excerpt: "Boutique island developers scramble to acquire coastal land along General Luna's extended surf breaks.",
    image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80"
  },
  {
    slug: "off-grid-island-living",
    title: "Off-Grid Island Living",
    category: "Hospitality",
    date: "May 2026",
    excerpt: "Resort developers in Palawan shift fully to off-grid solar microgrids, green water treatment, and teak designs.",
    image: "https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=800&q=80"
  },
  {
    slug: "poblacion-food-architecture",
    title: "Poblacion Food Architecture",
    category: "Culinary",
    date: "June 2026",
    excerpt: "Industrial modernist overlays reshape abandoned residential warehouses into multi-concept culinary destinations.",
    image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80"
  },
  {
    slug: "design-first-ridge-dining",
    title: "Design-First Ridge Dining",
    category: "Culinary",
    date: "May 2026",
    excerpt: "Tagaytay culinary spaces design glass-enclosed structures that maximize views of the Taal Volcano ridge.",
    image: "https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?w=800&q=80"
  }
];

export default function IntelPage() {
  const [filter, setFilter] = useState("All");

  const categories = ["All", "Residential", "Commercial", "Hospitality", "Culinary"];

  const filteredArticles = filter === "All"
    ? ARTICLES
    : ARTICLES.filter(art => art.category === filter);

  return (
    <div className="page-wrapper">
      <Header />
      <main className="intel-main">
        <header className="page-header">
          <span className="vector-label">Layer 02 // Editorial Briefings</span>
          <h1 className="page-title">News &amp; Intelligence</h1>
          <p className="page-subtitle">Tracing architectural shifts, spatial design, and development movements.</p>
        </header>

        {/* Filter Navigation */}
        <section className="filter-section">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`filter-btn ${filter === cat ? "active" : ""}`}
            >
              {cat}
            </button>
          ))}
        </section>

        {/* Featured Hero Article */}
        {filter === "All" && ARTICLES[0] && (
          <section className="featured-section">
            <Link href={`/intel/${ARTICLES[0].slug}`} className="featured-card">
              <div className="featured-image-container">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={ARTICLES[0].image} alt={ARTICLES[0].title} className="featured-image" />
                <div className="featured-overlay"></div>
              </div>
              <div className="featured-content">
                <span className="featured-tag">{ARTICLES[0].category} &middot; Featured Briefing</span>
                <h2>{ARTICLES[0].title}</h2>
                <p className="featured-excerpt">{ARTICLES[0].excerpt}</p>
                <div className="featured-footer">
                  <span className="featured-date">{ARTICLES[0].date}</span>
                  <span className="featured-link">Read Deep Analysis →</span>
                </div>
              </div>
            </Link>
          </section>
        )}

        {/* Roster Grid */}
        <section className="grid-container">
          <div className="articles-grid">
            {filteredArticles.slice(filter === "All" ? 1 : 0).map((art) => (
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
                  <span className="read-more-btn">Read Briefing →</span>
                </div>
              </Link>
            ))}
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
          margin-bottom: 40px;
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

        .filter-section {
          display: flex;
          justify-content: center;
          gap: 16px;
          margin-bottom: 56px;
          border-bottom: 1px solid var(--border-solid);
          padding-bottom: 16px;
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

        /* Featured Card */
        .featured-section {
          margin-bottom: 64px;
        }

        .featured-card {
          display: flex;
          background: var(--surface);
          border: 1px solid var(--border-solid);
          border-radius: var(--radius-md);
          overflow: hidden;
          transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
          text-decoration: none;
          height: 380px;
        }

        .featured-card:hover {
          border-color: var(--accent-border);
          box-shadow: var(--shadow-lg);
        }

        .featured-image-container {
          flex: 1.2;
          position: relative;
          overflow: hidden;
          height: 100%;
        }

        .featured-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          filter: grayscale(40%) contrast(1.1);
          transition: transform var(--transition-slow), filter var(--transition-slow);
        }

        .featured-card:hover .featured-image {
          transform: scale(1.03);
          filter: grayscale(0%) contrast(1.1);
        }

        .featured-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(to right, transparent 60%, var(--surface) 100%);
        }

        .featured-content {
          flex: 1;
          padding: 40px;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .featured-tag {
          font-family: var(--font-mono);
          font-size: 10px;
          color: var(--accent);
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin-bottom: 16px;
        }

        .featured-content h2 {
          font-family: var(--font-display);
          font-size: 32px;
          color: #fff;
          margin-bottom: 16px;
          line-height: 1.2;
        }

        .featured-excerpt {
          font-size: 14px;
          line-height: 1.7;
          color: var(--text-secondary);
          margin-bottom: 32px;
        }

        .featured-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-top: 1px solid var(--border-solid);
          padding-top: 16px;
        }

        .featured-date {
          font-size: 12px;
          color: var(--text-muted);
        }

        .featured-link {
          font-size: 12px;
          font-weight: bold;
          color: var(--accent);
          letter-spacing: 0.05em;
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
          .featured-card {
            flex-direction: column;
            height: auto;
          }
          .featured-image-container {
            height: 240px;
          }
          .featured-overlay {
            background: linear-gradient(to top, var(--surface) 0%, transparent 100%);
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
