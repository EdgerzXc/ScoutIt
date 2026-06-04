"use client";

import Header from "@/components/Header";
import Link from "next/link";
import { useState, useEffect } from "react";
import { getBrokers } from "@/data/mockDb";

// ── Tier label → number map (mirrors airtable.js) ──────────────
const TIER_MAP = { Diamond: 1, Platinum: 2, Gold: 3, Silver: 4, Bronze: 5 };

function normalizeTier(broker) {
  // Airtable data uses subscriptionTier (number) directly
  // Mock data also uses subscriptionTier (number)
  // Guard: if somehow only label is present, convert
  if (typeof broker.subscriptionTier === "number") return broker.subscriptionTier;
  return TIER_MAP[broker.subscriptionLabel] ?? 5;
}

export default function BrokersPage() {
  const [brokers, setBrokers]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [source, setSource]       = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const res  = await fetch("/api/cms");
        const data = await res.json();

        // If Airtable returned brokers, use them; otherwise fall through to mockDb
        if (data.brokers && data.brokers.length > 0) {
          setBrokers(data.brokers);
          setSource(data.source);
        } else {
          // Airtable table is empty or not yet populated — use local mock
          setBrokers(getBrokers());
          setSource("mock_empty_table");
        }
      } catch {
        // Network error — use local mock
        setBrokers(getBrokers());
        setSource("mock_network_error");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filteredBrokers = brokers.filter((broker) => {
    const term = searchTerm.toLowerCase();
    return (
      (broker.location  || "").toLowerCase().includes(term) ||
      (broker.name      || "").toLowerCase().includes(term) ||
      (broker.specialty || "").toLowerCase().includes(term)
    );
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
          {loading ? (
            <div style={{ textAlign: "center", padding: "80px 0", color: "var(--text-muted)", fontSize: "13px", letterSpacing: "0.1em" }}>
              LOADING INTELLIGENCE ROSTER...
            </div>
          ) : (
            <div className="brokers-grid">
              {filteredBrokers.map((broker) => {
                const tier = normalizeTier(broker);
                let tierClass = "";
                let tierBadgeText = "";
                switch (tier) {
                  case 1: tierClass = "tier-1-card diamond-card";  tierBadgeText = "DIAMOND PARTNER";  break;
                  case 2: tierClass = "tier-2-card platinum-card"; tierBadgeText = "PLATINUM PARTNER"; break;
                  case 3: tierClass = "tier-3-card gold-card";     tierBadgeText = "GOLD PARTNER";     break;
                  case 4: tierClass = "tier-4-card silver-card";   tierBadgeText = "SILVER PARTNER";   break;
                  case 5: tierClass = "tier-5-card bronze-card";   tierBadgeText = "BRONZE PARTNER";   break;
                  default: break;
                }

                return (
                  <Link
                    href={`/brokers/${broker.id}`}
                    key={broker.id}
                    className={`broker-card ${tierClass}`}
                    style={{ textDecoration: "none", position: "relative" }}
                  >
                    {tierBadgeText && (
                      <div className="general-tier-badge-label">{tierBadgeText}</div>
                    )}
                    <div className="broker-image-container">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={broker.image} alt={broker.name} className="broker-image" />
                      <div className="image-overlay" />
                    </div>
                    <div className="broker-content">
                      <span className="broker-location">{broker.location}</span>
                      <h2 className="broker-name">{broker.name}</h2>
                      <p className="broker-title">{broker.title}</p>
                      <p className="broker-specialty">Specialty: <span>{broker.specialty}</span></p>
                      <p className="broker-bio">{broker.bio}</p>
                      <div className="broker-footer">
                        <div className="broker-stats">
                          <span className="stat-value" style={{ fontSize: "12px" }}>{broker.closures}</span>
                        </div>
                        <span className="btn-contact">Focus →</span>
                      </div>
                    </div>
                  </Link>
                );
              })}

              {!loading && filteredBrokers.length === 0 && (
                <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "60px 0", color: "var(--text-muted)" }}>
                  No intelligence advisors found matching your criteria.
                </div>
              )}
            </div>
          )}
        </section>

        {/* Dev source indicator — remove before final prod */}
        {source && process.env.NODE_ENV === "development" && (
          <div style={{ textAlign: "center", padding: "16px", fontSize: "11px", color: "#444", fontFamily: "monospace" }}>
            data source: {source}
          </div>
        )}
      </main>

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
          .brokers-grid { grid-template-columns: repeat(2, 1fr); }
        }

        @media (max-width: 768px) {
          .brokers-grid { grid-template-columns: 1fr; }
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

        .broker-specialty span { color: var(--text-primary); }

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

        .broker-stats { display: flex; flex-direction: column; }

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

        .general-tier-badge-label {
          position: absolute;
          top: 12px;
          right: 12px;
          font-size: 8px;
          font-weight: 700;
          letter-spacing: 1px;
          padding: 3px 8px;
          border-radius: 2px;
          font-family: var(--font-mono), monospace;
          z-index: 10;
        }

        .tier-1-card { border-color: transparent !important; box-shadow: 0 8px 32px rgba(0,242,254,0.08); position: relative; }
        .tier-1-card::before { content: ""; position: absolute; inset: -1px; z-index: -1; border-radius: 6px; background: linear-gradient(90deg, #00f2fe, #4facfe, #b19ffb, #00f2fe); background-size: 300% 300%; animation: diamondGlow 6s linear infinite; }
        .tier-1-card .general-tier-badge-label { background: linear-gradient(135deg, #00f2fe 0%, #b19ffb 100%); color: #0e0e0e; box-shadow: 0 0 8px rgba(0,242,254,0.3); }
        .tier-1-card .broker-location { color: #00f2fe; }

        .tier-2-card { border-color: #a5c2d9 !important; box-shadow: 0 4px 16px rgba(165,194,217,0.04); }
        .tier-2-card .general-tier-badge-label { background: linear-gradient(135deg, #a5c2d9 0%, #eef3f7 100%); color: #0e0e0e; }
        .tier-2-card .broker-location { color: #a5c2d9; }

        .tier-3-card { border-color: #c8a96e !important; box-shadow: 0 4px 16px rgba(200,169,110,0.04); }
        .tier-3-card .general-tier-badge-label { background: linear-gradient(135deg, #c8a96e 0%, #f7ebd3 100%); color: #0e0e0e; }
        .tier-3-card .broker-location { color: #c8a96e; }

        .tier-4-card { border-color: #8a8a8a !important; }
        .tier-4-card .general-tier-badge-label { background: linear-gradient(135deg, #8a8a8a 0%, #dcdcdc 100%); color: #0e0e0e; }
        .tier-4-card .broker-location { color: #dcdcdc; }

        .tier-5-card { border-color: #cd7f32 !important; }
        .tier-5-card .general-tier-badge-label { background: linear-gradient(135deg, #a05a2c 0%, #cd7f32 100%); color: #ffffff; }
        .tier-5-card .broker-location { color: #cd7f32; }

        @keyframes diamondGlow {
          0%   { background-position: 0% 50%; }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
    </div>
  );
}
