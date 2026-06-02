"use client";

import { useState } from "react";
import Header from "@/components/Header";

const NATURAL_IMAGES = [
  "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1600&q=80",
  "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1600&q=80",
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1600&q=80",
  "https://images.unsplash.com/photo-1600607687959-ce8a6c25118c?w=1600&q=80",
  "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1600&q=80",
];

const ENHANCED_IMAGES = [
  "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=1600&q=90&sat=1.2",
  "https://images.unsplash.com/photo-1600607686527-6fb886090705?w=1600&q=90&sat=1.2",
  "https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=1600&q=90&sat=1.2",
  "https://images.unsplash.com/photo-1512915922686-57c11dde9b6b?w=1600&q=90&sat=1.2",
  "https://images.unsplash.com/photo-1600585154526-990dced4ea0d?w=1600&q=90&sat=1.2",
];

const TABS = [
  { id: 'the-space', label: 'The Space' },
  { id: 'location', label: 'Location' },
  { id: 'life-here', label: 'Life Here' },
  { id: 'where-to', label: 'Where To?' },
  { id: 'units', label: 'Units' },
  { id: 'universe', label: 'Universe' },
  { id: 'your-move', label: 'Your Move' },
];

export default function PropertyClient() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [photoMode, setPhotoMode] = useState("natural");
  const [activeTab, setActiveTab] = useState("the-space");

  const images = photoMode === "natural" ? NATURAL_IMAGES : ENHANCED_IMAGES;

  const nextImage = () => setCurrentImageIndex((prev) => (prev + 1) % images.length);
  const prevImage = () => setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));

  const renderTabContent = () => {
    switch (activeTab) {
      case "the-space":
        return (
          <div className="tab-content-panel">
            <h2 className="display-heading">Where <em>light</em><br/>finds its home</h2>
            <div className="spec-pills">
              <div className="spec-pill"><span>3</span> Bedrooms</div>
              <div className="spec-pill"><span>2</span> Bathrooms</div>
              <div className="spec-pill"><span>120</span> sqm floor</div>
              <div className="spec-pill"><span>1</span> Parking</div>
              <div className="spec-pill"><span>180</span> Lot Area</div>
            </div>
            <div className="accordions">
               <div className="accordion-mock">Home Feel & Comfort</div>
               <div className="accordion-mock">Space Usability</div>
               <div className="accordion-mock">Story of This Space</div>
            </div>
          </div>
        );
      case "location":
        return (
          <div className="tab-content-panel">
            <h2 className="display-heading">Batasan Hills, <em>Quezon City</em></h2>
            <div className="grid-2-col">
              <div className="info-card">
                <h3>QC Zoning Highlights</h3>
                <p>Low-density residential enclave transitioning to a high-yield growth corridor.</p>
              </div>
              <div className="info-card">
                <h3>Transport Corridors</h3>
                <p>Direct connectivity to Commonwealth Avenue and the upcoming MRT-7.</p>
              </div>
              <div className="info-card">
                <h3>Regional Growth Metrics</h3>
                <p>12.4% YoY appreciation in prime land values within a 5km radius.</p>
              </div>
            </div>
          </div>
        );
      case "life-here":
        return (
          <div className="tab-content-panel">
             <h2 className="display-heading">Life <em>Here</em></h2>
             <div className="life-stats-grid">
               <div className="stat-box"><h2>88<span>%</span></h2><p>Walkability Score</p></div>
               <div className="stat-box"><h2>A+</h2><p>Neighborhood Affinity</p></div>
               <div className="stat-box"><h2>24/7</h2><p>Security Perimeter</p></div>
             </div>
             <p className="narrative-text">A serene, gated community favored by legal professionals, government officials, and established business families.</p>
          </div>
        );
      case "where-to":
        return (
          <div className="tab-content-panel">
            <h2 className="display-heading">Proximity <em>Nodes</em></h2>
            <ul className="where-to-list">
              <li><span>UP Diliman</span> <span className="dist">4.2 km (12 mins)</span></li>
              <li><span>Ever Gotesco Commonwealth</span> <span className="dist">2.5 km (8 mins)</span></li>
              <li><span>Batasang Pambansa Complex</span> <span className="dist">1.8 km (5 mins)</span></li>
              <li><span>Trinoma / SM North</span> <span className="dist">8.5 km (25 mins)</span></li>
            </ul>
          </div>
        );
      case "units":
        return (
          <div className="tab-content-panel">
            <h2 className="display-heading">Structural <em>Models</em></h2>
            <div className="units-grid">
               <div className="unit-card"><h4>The Alpha Layout</h4><p>180sqm Lot / 120sqm Floor. Open plan living.</p></div>
               <div className="unit-card"><h4>The Beta Expansion</h4><p>200sqm Lot / 150sqm Floor. Added lanai and pool deck.</p></div>
            </div>
          </div>
        );
      case "universe":
        return (
          <div className="tab-content-panel">
            <h2 className="display-heading">Macroeconomic <em>Integration</em></h2>
            <div className="universe-data">
              <div className="u-row"><span>Asset Tier</span> <strong>Core Growth</strong></div>
              <div className="u-row"><span>Ecosystem Node</span> <strong>North Metro Manila</strong></div>
              <div className="u-row"><span>Yield Trajectory</span> <strong>Aggressive (6-8% PA)</strong></div>
            </div>
          </div>
        );
      case "your-move":
        return (
          <div className="tab-content-panel your-move-panel">
            <h2 className="display-heading">Initiate <em>Acquisition</em></h2>
            <div className="transaction-interface">
              <p>Current Valuation: <span className="price-tag">₱24,500,000</span></p>
              <button className="primary-action-btn">BOOK PRIVATE VIEWING</button>
              <div className="broker-link">
                <img src="https://images.unsplash.com/photo-1560250097-0b93528c311a?w=100&q=80" alt="Broker" className="broker-mini-avatar"/>
                <div>
                  <h4>Alexander Vance</h4>
                  <p>Principal Strategist (Sector Alpha)</p>
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="property-v6-wrapper">
      <Header />
      
      {/* ZONE 1: HERO PORTAL */}
      <section className="zone-1-hero" style={{ backgroundImage: `url(${images[currentImageIndex]})` }}>
        <div className="hero-overlay-gradient"></div>
        
        <div className="hero-intel">
          <p className="hero-label">ScoutIt &middot; Residential Briefing</p>
          <h1 className="hero-title">Batasan Hills House &amp; Lot</h1>
          <p className="hero-location">Batasan Hills, Quezon City</p>
          <p className="hero-hook">Positioned within one of QC's fastest-evolving residential corridors.</p>
        </div>

        {/* Navigation Arrows */}
        <button className="photo-arrow left" onClick={prevImage}>❮</button>
        <button className="photo-arrow right" onClick={nextImage}>❯</button>

        {/* Photo Controls */}
        <div className="photo-controls">
          <div className="photo-controls-left">
            <div className="photo-toggle">
              <button 
                className={`toggle-btn ${photoMode === 'natural' ? 'active' : ''}`}
                onClick={() => setPhotoMode('natural')}
              >Natural</button>
              <button 
                className={`toggle-btn ${photoMode === 'enhanced' ? 'active' : ''}`}
                onClick={() => setPhotoMode('enhanced')}
              >Enhanced</button>
            </div>
            <div className="photo-dots">
              {images.map((_, idx) => (
                <div key={idx} className={`dot ${currentImageIndex === idx ? 'active' : ''}`} onClick={() => setCurrentImageIndex(idx)}></div>
              ))}
            </div>
          </div>
          <div className="photo-count">{currentImageIndex + 1} / {images.length}</div>
        </div>
      </section>

      {/* ZONE 2: HORIZONTAL RIBBON */}
      <section className="zone-2-ribbon">
        <div className="ribbon-inner">
          {TABS.map((tab) => (
            <div 
              key={tab.id} 
              className={`ribbon-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </div>
          ))}
        </div>
      </section>

      {/* ZONE 3: DYNAMIC DATA POPULATION */}
      <section className="zone-3-content">
        {renderTabContent()}
      </section>

      <style>{`
        .property-v6-wrapper {
          display: flex;
          flex-direction: column;
          min-height: 100vh;
          background: var(--bg);
          color: var(--text-primary);
        }

        /* ZONE 1 */
        .zone-1-hero {
          position: relative;
          height: 65vh;
          background-size: cover;
          background-position: center;
          transition: background-image 0.6s ease;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
        }

        .hero-overlay-gradient {
          position: absolute;
          inset: 0;
          background: linear-gradient(to top, rgba(14,14,14,1) 0%, rgba(14,14,14,0.3) 50%, rgba(14,14,14,0.8) 100%);
          pointer-events: none;
        }

        .hero-intel {
          position: absolute;
          top: 100px;
          left: 40px;
          z-index: 10;
        }

        .hero-label {
          font-family: var(--font-mono);
          font-size: 11px;
          color: var(--accent);
          letter-spacing: 0.2em;
          text-transform: uppercase;
          margin-bottom: 8px;
        }

        .hero-title {
          font-family: var(--font-display);
          font-size: 48px;
          margin-bottom: 8px;
        }

        .hero-location {
          font-size: 16px;
          color: var(--text-secondary);
          margin-bottom: 8px;
        }
        
        .hero-hook {
          font-family: var(--font-display);
          font-size: 22px;
          font-style: italic;
          color: var(--text-primary);
          max-width: 600px;
        }

        .photo-arrow {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          background: rgba(0,0,0,0.5);
          border: 1px solid rgba(255,255,255,0.2);
          color: white;
          width: 44px;
          height: 44px;
          border-radius: 50%;
          cursor: pointer;
          z-index: 10;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s;
        }

        .photo-arrow:hover {
          background: var(--accent);
          color: black;
          border-color: var(--accent);
        }

        .photo-arrow.left { left: 24px; }
        .photo-arrow.right { right: 24px; }

        .photo-controls {
          position: absolute;
          bottom: 24px;
          left: 40px;
          right: 40px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          z-index: 10;
        }

        .photo-controls-left {
          display: flex;
          align-items: center;
          gap: 24px;
        }

        .photo-toggle {
          background: rgba(0,0,0,0.6);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 20px;
          display: flex;
          padding: 4px;
        }

        .toggle-btn {
          background: transparent;
          color: var(--text-secondary);
          border: none;
          padding: 8px 16px;
          border-radius: 16px;
          font-size: 11px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.3s;
        }

        .toggle-btn.active {
          background: var(--accent);
          color: black;
          font-weight: bold;
        }

        .photo-dots {
          display: flex;
          gap: 8px;
        }

        .dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--text-muted);
          cursor: pointer;
          transition: all 0.3s;
        }

        .dot.active {
          width: 24px;
          border-radius: 3px;
          background: var(--accent);
        }

        .photo-count {
          font-family: var(--font-mono);
          font-size: 12px;
          color: var(--accent);
          letter-spacing: 0.2em;
        }

        /* ZONE 2 */
        .zone-2-ribbon {
          background: var(--surface);
          border-bottom: 1px solid var(--border-solid);
          border-top: 1px solid var(--border-solid);
          position: sticky;
          top: 0;
          z-index: 50;
        }

        .ribbon-inner {
          display: flex;
          overflow-x: auto;
          scrollbar-width: none;
        }

        .ribbon-tab {
          padding: 20px 32px;
          font-size: 13px;
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.1em;
          cursor: pointer;
          border-bottom: 2px solid transparent;
          transition: all 0.3s;
          white-space: nowrap;
        }

        .ribbon-tab:hover {
          color: var(--text-primary);
          background: rgba(255,255,255,0.02);
        }

        .ribbon-tab.active {
          color: var(--accent);
          border-bottom: 2px solid var(--accent);
          background: rgba(200, 169, 110, 0.05);
        }

        /* ZONE 3 */
        .zone-3-content {
          flex: 1;
          padding: 60px 40px;
          max-width: 1200px;
          margin: 0 auto;
          width: 100%;
        }

        .tab-content-panel {
          animation: fadeIn 0.4s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .display-heading {
          font-family: var(--font-display);
          font-size: 42px;
          margin-bottom: 40px;
          font-weight: 300;
        }

        .display-heading em {
          color: var(--accent);
          font-style: italic;
        }

        .spec-pills {
          display: flex;
          flex-wrap: wrap;
          gap: 16px;
          margin-bottom: 40px;
        }

        .spec-pill {
          background: var(--surface);
          border: 1px solid var(--border-solid);
          padding: 16px 24px;
          border-radius: 4px;
          font-size: 13px;
          color: var(--text-secondary);
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .spec-pill span {
          font-family: var(--font-display);
          font-size: 24px;
          color: var(--text-primary);
        }

        .accordions {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .accordion-mock {
          background: var(--surface);
          border: 1px solid var(--border-solid);
          padding: 20px 24px;
          border-radius: 4px;
          font-size: 16px;
          cursor: pointer;
        }

        .grid-2-col {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
        }

        .info-card {
          background: var(--surface);
          border: 1px solid var(--border-solid);
          padding: 32px;
          border-radius: 4px;
        }

        .info-card h3 {
          color: var(--accent);
          margin-bottom: 12px;
          font-size: 18px;
        }

        .info-card p {
          color: var(--text-secondary);
          line-height: 1.6;
        }

        .life-stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
          margin-bottom: 32px;
        }

        .stat-box {
          background: var(--surface);
          border: 1px solid var(--border-solid);
          padding: 32px;
          border-radius: 4px;
          text-align: center;
        }

        .stat-box h2 {
          font-family: var(--font-display);
          font-size: 48px;
          color: var(--text-primary);
          margin-bottom: 8px;
        }

        .stat-box h2 span {
          font-size: 24px;
          color: var(--accent);
        }

        .stat-box p {
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.1em;
          font-size: 11px;
        }

        .narrative-text {
          font-size: 18px;
          color: var(--text-secondary);
          line-height: 1.8;
          max-width: 800px;
        }

        .where-to-list {
          list-style: none;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .where-to-list li {
          display: flex;
          justify-content: space-between;
          background: var(--surface);
          border: 1px solid var(--border-solid);
          padding: 24px;
          border-radius: 4px;
          font-size: 16px;
        }

        .where-to-list .dist {
          color: var(--accent);
          font-family: var(--font-mono);
          font-size: 13px;
        }

        .units-grid {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .unit-card {
          background: var(--surface);
          border: 1px solid var(--border-solid);
          padding: 24px;
          border-radius: 4px;
        }

        .unit-card h4 {
          font-size: 20px;
          color: var(--accent);
          margin-bottom: 8px;
        }

        .universe-data {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .u-row {
          display: flex;
          justify-content: space-between;
          background: var(--surface);
          border: 1px solid var(--border-solid);
          padding: 24px;
          border-radius: 4px;
        }

        .u-row span {
          color: var(--text-secondary);
        }

        .transaction-interface {
          background: var(--surface);
          border: 1px solid var(--accent-border);
          padding: 40px;
          border-radius: 4px;
          max-width: 600px;
        }

        .price-tag {
          display: block;
          font-family: var(--font-display);
          font-size: 48px;
          color: var(--text-primary);
          margin: 16px 0 32px 0;
        }

        .primary-action-btn {
          width: 100%;
          background: var(--accent);
          color: #000;
          border: none;
          padding: 20px;
          font-size: 13px;
          font-weight: bold;
          text-transform: uppercase;
          letter-spacing: 0.2em;
          border-radius: 4px;
          cursor: pointer;
          margin-bottom: 32px;
          transition: all 0.3s;
        }

        .primary-action-btn:hover {
          background: #e0c58e;
          transform: translateY(-2px);
        }

        .broker-link {
          display: flex;
          align-items: center;
          gap: 16px;
          padding-top: 24px;
          border-top: 1px solid var(--border-solid);
        }

        .broker-mini-avatar {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          border: 1px solid var(--accent);
          filter: grayscale(100%);
        }

        .broker-link h4 {
          font-size: 16px;
          margin-bottom: 4px;
        }

        .broker-link p {
          font-size: 12px;
          color: var(--text-secondary);
        }
      `}</style>
    </div>
  );
}
