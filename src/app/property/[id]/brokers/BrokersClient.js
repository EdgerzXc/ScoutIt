"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getBrokers } from "@/data/mockDb";
import "./brokers.css";

const TIER_MAP = { Diamond: 1, Platinum: 2, Gold: 3, Silver: 4, Bronze: 5 };

function normalizeTier(broker) {
  if (typeof broker.subscriptionTier === "number") return broker.subscriptionTier;
  return TIER_MAP[broker.subscriptionLabel] ?? 5;
}

export default function BrokersClient({ slug }) {
  const [brokers, setBrokers]             = useState([]);
  const [loading, setLoading]             = useState(true);
  const [activeFormBroker, setActiveFormBroker] = useState(null);
  const [formData, setFormData]           = useState({ name: "", phone: "", message: "" });
  const [submittedBrokerId, setSubmittedBrokerId] = useState(null);

  useEffect(() => {
    async function loadBrokers() {
      try {
        const res  = await fetch("/api/cms");
        const data = await res.json();
        if (data.brokers && data.brokers.length > 0) {
          setBrokers(data.brokers);
        } else {
          setBrokers(getBrokers());
        }
      } catch {
        setBrokers(getBrokers());
      } finally {
        setLoading(false);
      }
    }
    loadBrokers();
  }, []);

  const handleRetainClick = (brokerId) => {
    setActiveFormBroker(activeFormBroker === brokerId ? null : brokerId);
    setSubmittedBrokerId(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e, brokerId) => {
    e.preventDefault();
    setSubmittedBrokerId(brokerId);
    setFormData({ name: "", phone: "", message: "" });
    setTimeout(() => {
      setActiveFormBroker(null);
      setSubmittedBrokerId(null);
    }, 4000);
  };

  // Top Rated: sort by rating descending
  const topRatedBrokers = [...brokers].sort((a, b) => b.rating - a.rating);

  // Recommended: sort by subscriptionTier ascending then rating descending
  const recommendedBrokers = [...brokers].sort((a, b) => {
    const ta = normalizeTier(a);
    const tb = normalizeTier(b);
    if (ta !== tb) return ta - tb;
    return b.rating - a.rating;
  });

  const renderBrokerCard = (broker, isRecommended = false) => {
    const isFormOpen = activeFormBroker === broker.id;
    const isSuccess  = submittedBrokerId === broker.id;

    let tierClass = "";
    let tierBadgeText = "";
    if (isRecommended) {
      const tier = normalizeTier(broker);
      switch (tier) {
        case 1: tierClass = "tier-1-card diamond-card";  tierBadgeText = "DIAMOND PARTNER";  break;
        case 2: tierClass = "tier-2-card platinum-card"; tierBadgeText = "PLATINUM PARTNER"; break;
        case 3: tierClass = "tier-3-card gold-card";     tierBadgeText = "GOLD PARTNER";     break;
        case 4: tierClass = "tier-4-card silver-card";   tierBadgeText = "SILVER PARTNER";   break;
        case 5: tierClass = "tier-5-card bronze-card";   tierBadgeText = "BRONZE PARTNER";   break;
        default: break;
      }
    }

    return (
      <div
        key={broker.id}
        className={`broker-item-card ${isRecommended ? "recommended-card" : "top-rated-card"} ${tierClass} ${isFormOpen ? "form-expanded" : ""}`}
      >
        {isRecommended && tierBadgeText && (
          <div className="tier-badge-label">{tierBadgeText}</div>
        )}
        
        <div className="broker-main-row">
          <div
            className="broker-avatar-img"
            style={{ backgroundImage: `url(${broker.image})` }}
          />
          <div className="broker-detail-col">
            <div className="broker-name-header">
              <h3 className="broker-name-txt">{broker.name}</h3>
              <span className="leris-badge">LERIS COMPLIANT</span>
            </div>
            <p className="broker-license-txt">{broker.license}</p>
            <p className="broker-closures-txt">{broker.closures}</p>
            
            <div className="niche-pills-row">
              {broker.niche.map((tag) => (
                <span key={tag} className="niche-pill-tag">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <div className="broker-rating-box">
            <span className="rating-num">{broker.rating}</span>
            <span className="rating-lbl">SCOUT RATING</span>
          </div>
        </div>

        <div className="broker-actions-row">
          <Link href={`/brokers/${broker.id}`} className="action-profile-btn" style={{ textDecoration: 'none', display: 'inline-block' }}>
            View Full Profile →
          </Link>
          <button
            type="button"
            className={`action-retain-btn ${isFormOpen ? "active" : ""}`}
            onClick={() => handleRetainClick(broker.id)}
          >
            {isFormOpen ? "Cancel" : "Retain via ScoutIt"}
          </button>
        </div>

        {isFormOpen && (
          <div className="inline-intent-form-container">
            {isSuccess ? (
              <div className="form-success-alert">
                ✓ Inquiry submitted. An authorized broker will contact you shortly.
              </div>
            ) : (
              <form onSubmit={(e) => handleSubmit(e, broker.id)} className="intent-form">
                <h4 className="form-title">Submit Letter of Intent</h4>
                <div className="form-fields-grid">
                  <input
                    type="text"
                    name="name"
                    required
                    placeholder="Your Full Name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="form-input-field"
                  />
                  <input
                    type="tel"
                    name="phone"
                    required
                    placeholder="Contact Number (e.g. +63 917 ...)"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="form-input-field"
                  />
                  <textarea
                    name="message"
                    required
                    rows="3"
                    placeholder={`Write a brief message regarding ${slug === "batasan-hills" ? "Batasan Hills House & Lot" : "this property"}`}
                    value={formData.message}
                    onChange={handleInputChange}
                    className="form-textarea-field"
                  />
                </div>
                <button type="submit" className="form-submit-btn">
                  Submit Retention Request
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="brokers-wrapper">
      {/* Sticky header nav */}
      <nav className="brokers-sticky-nav">
        <Link href={`/property/${slug || "batasan-hills"}`} className="nav-back-link">
          ← Back to Property
        </Link>
        <span className="nav-brand-logo">SCOUTIT</span>
        <span className="nav-prop-info">
          {slug === "batasan-hills" ? "Batasan Hills, Quezon City" : "Property Profile"}
        </span>
      </nav>

      <main className="brokers-main-content">
        <header className="brokers-page-header">
          <span className="gold-section-label">AUTHORIZED BROKERS</span>
          <h1 className="brokers-page-title">Verified Representation</h1>
          <p className="brokers-page-subtitle">
            Direct coordination and transactional representation for this asset tier.
          </p>
        </header>

        <div className="brokers-columns-container">
          {loading ? (
            <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "80px 0", color: "var(--text-muted)", fontSize: "13px", letterSpacing: "0.1em" }}>
              LOADING VERIFIED BROKERS...
            </div>
          ) : (
            <>
              {/* Column 1: Top Rated Brokers */}
              <section className="brokers-section-group top-rated-section">
                <h2 className="section-group-heading">Top Rated Brokers</h2>
                <div className="brokers-cards-list">
                  {topRatedBrokers.map((b) => renderBrokerCard(b, false))}
                </div>
              </section>

              {/* Column 2: Recommended Brokers */}
              <section className="brokers-section-group recommended-section">
                <h2 className="section-group-heading">Recommended Brokers</h2>
                <div className="brokers-cards-list">
                  {recommendedBrokers.map((b) => renderBrokerCard(b, true))}
                </div>
              </section>
            </>
          )}
        </div>

        <footer className="brokers-compliance-footer">
          <p>
            ScoutIt is a spatial intelligence archive. In compliance with R.A. 9646 (Real Estate Service Act of the Philippines), all property site visits, formal negotiation tables, and contract signings must be structured and validated by licensed real estate brokers.
          </p>
        </footer>
      </main>
    </div>
  );
}
