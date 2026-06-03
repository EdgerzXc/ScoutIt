"use client";

import Header from "@/components/Header";

const DUMMY_BROKERS = [
  {
    id: "br-01",
    name: "Miguel Torres, REB",
    title: "Principal Strategist",
    specialty: "Ultra-Luxury Residential",
    location: "BGC Focus",
    bio: "With over a decade of experience in BGC and the greater Manila market, Miguel specializes in industrial-modern residential estates and adaptive reuse projects.",
    image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=800&q=80",
    closures: "3 Verified Closures // BGC Focus",
    managedProperties: ["Aurelia Residences", "The Estate Makati", "Park Central Towers"],
    clearanceTier: "Tier 1 - Alpha"
  },
  {
    id: "br-02",
    name: "Elena Santos, REB",
    title: "Global Capital Manager",
    specialty: "Grade A Office Spaces",
    location: "Makati Core",
    bio: "Elena provides structural insights for institutional clients, guiding commercial acquisitions and corporate relocations.",
    image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&q=80",
    closures: "2 Verified Closures // QC Residential",
    managedProperties: ["Zuellig Building", "Arthaland Century Pacific", "PBCom Tower"],
    clearanceTier: "Tier 2 - Omega"
  },
  {
    id: "br-03",
    name: "Marco Reyes, REB",
    title: "Lead Arbitrage Analyst",
    specialty: "STR & Resort Properties",
    location: "STR Sector",
    bio: "Marco connects visionary operators with prime coastal assets and boutique hospitality opportunities across the archipelago, specializing in modern tropical STR architecture.",
    image: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=800&q=80",
    closures: "4 Verified Closures // STR Sector",
    managedProperties: ["Siargao Tropical Villa", "Palawan Eco-Retreat", "Boracay Grand"],
    clearanceTier: "Tier 1 - Alpha"
  },
  {
    id: "br-04",
    name: "Julian Sy",
    title: "Industrial & Logistics",
    specialty: "Warehousing & Supply Chain",
    location: "Laguna & Batangas",
    bio: "Focusing on the expanding industrial corridors south of Manila, Julian engineers strategic acquisitions for logistics hubs.",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80",
    closures: "2 Verified Closures // Laguna & Batangas",
    managedProperties: ["Laguna Technopark", "Batangas Port Terminal"],
    clearanceTier: "Tier 3 - Beta"
  },
  {
    id: "br-05",
    name: "Camille Laurel",
    title: "Architectural Asset Advisor",
    specialty: "Heritage & Conservation",
    location: "Quezon City",
    bio: "An advocate for adaptive reuse, Camille brokers the transfer and restoration of culturally significant structures.",
    image: "https://images.unsplash.com/photo-1598550874175-4d0ef436c909?w=800&q=80",
    closures: "1 Verified Closure // Quezon City",
    managedProperties: ["New Manila Mansions", "Capitol Hills Estates"],
    clearanceTier: "Tier 2 - Omega"
  },
  {
    id: "br-06",
    name: "Sofia Araneta",
    title: "Boutique Hospitality Specialist",
    specialty: "Culinary Estates",
    location: "Tagaytay & South",
    bio: "Sofia identifies pre-development opportunities in rising economic zones, advising private equity on long-term holds.",
    image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=800&q=80",
    closures: "2 Verified Closures // Tagaytay & South",
    managedProperties: ["Antonio's Tagaytay", "Gallery by Chele (South Branch)"],
    clearanceTier: "Tier 3 - Beta"
  },
];

import { useState } from "react";

export default function BrokersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeBroker, setActiveBroker] = useState(null);

  const filteredBrokers = DUMMY_BROKERS.filter(broker => {
    const term = searchTerm.toLowerCase();
    const matchLocation = broker.location.toLowerCase().includes(term);
    const matchName = broker.name.toLowerCase().includes(term);
    const matchProperties = broker.managedProperties.some(p => p.toLowerCase().includes(term));
    return matchLocation || matchName || matchProperties;
  });

  return (
    <div className="page-wrapper">
      <Header />
      <main className="brokers-main">
        <header className="page-header">
          <span className="vector-label">LAYER 03 // PARTNER NETWORK</span>
          <h1 className="page-title">Intelligence Roster</h1>
          <p className="page-subtitle">Directory of elite Space Intelligence advisors across the Philippines.</p>
        </header>

        <section className="search-section">
          <input 
            type="text" 
            className="roster-search-input"
            placeholder="FILTER AGENT DIRECTORY BY GEOGRAPHICAL LOCATION OR SPECIFIC ASSET CODE..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </section>

        <section className="grid-container">
          <div className="brokers-grid">
            {filteredBrokers.map((broker) => (
              <div key={broker.id} className="broker-card" onClick={() => setActiveBroker(broker)}>
                <div className="broker-image-container">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={broker.image} alt={broker.name} className="broker-image" />
                  <div className="image-overlay"></div>
                </div>
                <div className="broker-content">
                  <span className="broker-location">{broker.location}</span>
                  <h2 className="broker-name">{broker.name}</h2>
                  <p className="broker-title">{broker.title}</p>
                  <p className="broker-specialty">Specialty: <span>{broker.specialty}</span></p>
                  
                  <p className="broker-bio">{broker.bio}</p>
                  
                  <div className="broker-footer">
                    <div className="broker-stats">
                      <span className="stat-value" style={{ fontSize: '12px' }}>{broker.closures}</span>
                    </div>
                    <button className="btn-contact">Focus →</button>
                  </div>
                </div>
              </div>
            ))}
            {filteredBrokers.length === 0 && (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
                No intelligence advisors found matching your criteria.
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Deep Focus Mode Panel */}
      <div className={`broker-focus-overlay ${activeBroker ? 'open' : ''}`} onClick={() => setActiveBroker(null)}>
        <div className="broker-focus-panel" onClick={(e) => e.stopPropagation()}>
          {activeBroker && (
            <>
              <button className="close-panel-btn" onClick={() => setActiveBroker(null)}>✕ CLOSE</button>
              
              <div className="panel-header">
                <div className="panel-avatar" style={{ backgroundImage: `url(${activeBroker.image})` }}></div>
                <div className="panel-title-block">
                  <h2>{activeBroker.name}</h2>
                  <h3>{activeBroker.title} // {activeBroker.clearanceTier}</h3>
                  <div className="panel-tags">
                    <span>{activeBroker.location}</span>
                    <span>{activeBroker.closures}</span>
                  </div>
                </div>
              </div>

              <div className="panel-body">
                <div className="panel-section">
                  <h4>Operational Profile</h4>
                  <p>{activeBroker.bio}</p>
                </div>

                <div className="panel-section">
                  <h4>Historical Asset Placement Chart</h4>
                  <ul className="asset-list">
                    {activeBroker.managedProperties.map((prop, idx) => (
                      <li key={idx}><span className="asset-code">ASSET-{idx + 1}</span> {prop}</li>
                    ))}
                  </ul>
                </div>

                <div className="panel-section form-section">
                  <h4>Request Contact Portal Clearance</h4>
                  <form className="clearance-form" onSubmit={(e) => e.preventDefault()}>
                    <input type="text" placeholder="YOUR IDENTIFICATION ALIAS" required />
                    <input type="email" placeholder="SECURE COMM LINK (EMAIL)" required />
                    <textarea placeholder="STATE YOUR ACQUISITION INTENT..." rows="3" required></textarea>
                    <button type="submit" className="submit-clearance-btn">INITIALIZE HANDSHAKE</button>
                  </form>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <style>{`
        .page-wrapper {
          background: var(--bg);
          color: var(--text-primary);
          min-height: 100vh;
        }

        .brokers-main {
          padding: 60px 40px;
          max-width: 1400px;
          margin: 0 auto;
        }

        .page-header {
          text-align: center;
          margin-bottom: 40px;
        }

        .search-section {
          max-width: 800px;
          margin: 0 auto 64px auto;
        }

        .roster-search-input {
          width: 100%;
          background: #1a1a1a;
          border: 1px solid #333333;
          padding: 16px 24px;
          color: var(--text-primary);
          font-family: var(--font-body);
          font-size: 13px;
          letter-spacing: 0.05em;
          outline: none;
          transition: border-color 0.3s ease, box-shadow 0.3s ease;
          border-radius: 4px;
        }

        .roster-search-input:focus {
          border-color: #c8a96e;
          box-shadow: 0 0 12px rgba(200, 169, 110, 0.15);
        }

        .roster-search-input::placeholder {
          color: #666666;
        }

        .vector-label {
          font-family: var(--font-mono);
          font-size: 12px;
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
          color: var(--text-muted);
          letter-spacing: 0.05em;
        }

        .brokers-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 32px;
        }

        @media (max-width: 1024px) {
          .brokers-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 768px) {
          .brokers-grid {
            grid-template-columns: 1fr;
          }
        }

        .broker-card {
          background: var(--surface);
          border: 1px solid var(--border-solid);
          border-radius: var(--radius-md);
          overflow: hidden;
          display: flex;
          flex-direction: column;
          cursor: pointer;
          transition: transform 0.38s ease, box-shadow 0.38s ease, border-color 0.38s ease;
        }

        .broker-card:hover {
          border-color: var(--accent-border);
          box-shadow: var(--shadow-lg);
          transform: translateY(-4px);
        }

        .broker-image-container {
          position: relative;
          height: 280px;
          overflow: hidden;
        }

        .broker-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          filter: grayscale(80%) contrast(1.1);
          transition: transform 0.6s ease, filter 0.6s ease;
        }

        .broker-card:hover .broker-image {
          transform: scale(1.05);
          filter: grayscale(0%) contrast(1.1);
        }

        .image-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(to top, var(--surface) 0%, transparent 60%);
        }

        .broker-content {
          padding: 24px;
          display: flex;
          flex-direction: column;
          flex: 1;
        }

        .broker-location {
          font-family: var(--font-mono);
          font-size: 10px;
          color: var(--accent);
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin-bottom: 8px;
        }

        .broker-name {
          font-family: var(--font-display);
          font-size: 22px;
          color: var(--text-primary);
          margin-bottom: 4px;
        }

        .broker-title {
          font-size: 12px;
          color: var(--text-secondary);
          margin-bottom: 16px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .broker-specialty {
          font-size: 13px;
          color: var(--text-muted);
          margin-bottom: 16px;
        }

        .broker-specialty span {
          color: var(--text-primary);
        }

        .broker-bio {
          font-size: 14px;
          line-height: 1.6;
          color: var(--text-secondary);
          margin-bottom: 32px;
          flex: 1;
        }

        .broker-footer {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          border-top: 1px solid var(--border-solid);
          padding-top: 16px;
        }

        .broker-stats {
          display: flex;
          flex-direction: column;
        }

        .stat-value {
          font-family: var(--font-display);
          font-size: 24px;
          color: var(--text-primary);
        }

        .stat-label {
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: var(--text-muted);
        }

        .btn-contact {
          background: transparent;
          border: 1px solid var(--accent);
          padding: 8px 16px;
          border-radius: 4px;
          color: var(--accent);
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-contact:hover {
          background: var(--accent);
          color: #000;
        }

        /* Focus Panel Styles */
        .broker-focus-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: rgba(0,0,0,0.8);
          backdrop-filter: blur(8px);
          z-index: 1000;
          display: flex;
          justify-content: flex-end;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.4s ease;
        }

        .broker-focus-overlay.open {
          opacity: 1;
          pointer-events: auto;
        }

        .broker-focus-panel {
          width: 100%;
          max-width: 600px;
          height: 100%;
          background: #121212;
          border-left: 1px solid var(--border-solid);
          transform: translateX(100%);
          transition: transform 0.5s cubic-bezier(0.19, 1, 0.22, 1);
          display: flex;
          flex-direction: column;
          overflow-y: auto;
          position: relative;
        }

        .broker-focus-overlay.open .broker-focus-panel {
          transform: translateX(0);
        }

        .close-panel-btn {
          position: absolute;
          top: 24px;
          right: 24px;
          background: rgba(255,255,255,0.05);
          border: 1px solid var(--border-solid);
          color: var(--text-secondary);
          padding: 8px 12px;
          font-family: var(--font-mono);
          font-size: 10px;
          cursor: pointer;
          border-radius: 4px;
          transition: all 0.2s;
          z-index: 10;
        }

        .close-panel-btn:hover {
          background: var(--accent);
          color: #000;
          border-color: var(--accent);
        }

        .panel-header {
          padding: 60px 40px 40px 40px;
          border-bottom: 1px solid var(--border-solid);
          background: linear-gradient(180deg, #1a1a1a 0%, #121212 100%);
          display: flex;
          align-items: flex-end;
          gap: 24px;
        }

        .panel-avatar {
          width: 120px;
          height: 120px;
          border-radius: 4px;
          background-size: cover;
          background-position: center;
          border: 1px solid var(--border-solid);
          filter: grayscale(100%);
        }

        .panel-title-block h2 {
          font-family: var(--font-display);
          font-size: 32px;
          color: #fff;
          margin: 0 0 8px 0;
        }

        .panel-title-block h3 {
          font-family: var(--font-mono);
          font-size: 12px;
          color: var(--accent);
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin: 0 0 16px 0;
          font-weight: 400;
        }

        .panel-tags {
          display: flex;
          gap: 12px;
        }

        .panel-tags span {
          background: rgba(255,255,255,0.05);
          padding: 4px 12px;
          border-radius: 4px;
          font-size: 11px;
          font-family: var(--font-mono);
          color: var(--text-secondary);
          text-transform: uppercase;
        }

        .panel-body {
          padding: 40px;
          display: flex;
          flex-direction: column;
          gap: 40px;
        }

        .panel-section h4 {
          font-family: var(--font-display);
          font-size: 18px;
          color: #fff;
          margin-bottom: 16px;
          border-bottom: 1px solid rgba(255,255,255,0.1);
          padding-bottom: 8px;
        }

        .panel-section p {
          color: var(--text-secondary);
          line-height: 1.6;
          font-size: 14px;
        }

        .asset-list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .asset-list li {
          background: #1a1a1a;
          border: 1px solid #333333;
          padding: 16px;
          border-radius: 4px;
          font-size: 14px;
          color: var(--text-primary);
          display: flex;
          align-items: center;
        }

        .asset-code {
          font-family: var(--font-mono);
          font-size: 10px;
          color: var(--accent);
          margin-right: 16px;
          background: rgba(200, 169, 110, 0.1);
          padding: 4px 8px;
          border-radius: 2px;
        }

        .clearance-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .clearance-form input,
        .clearance-form textarea {
          background: rgba(0,0,0,0.3);
          border: 1px solid #333;
          padding: 16px;
          color: #fff;
          font-family: var(--font-mono);
          font-size: 12px;
          border-radius: 4px;
          transition: border-color 0.3s;
          outline: none;
        }

        .clearance-form input:focus,
        .clearance-form textarea:focus {
          border-color: var(--accent);
        }

        .submit-clearance-btn {
          background: var(--accent);
          color: #000;
          border: none;
          padding: 16px;
          font-family: var(--font-mono);
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          border-radius: 4px;
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .submit-clearance-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(200, 169, 110, 0.3);
        }
      `}</style>
    </div>
  );
}
