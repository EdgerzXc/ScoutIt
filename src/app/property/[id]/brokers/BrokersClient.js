"use client";

import { useState } from "react";
import Link from "next/link";
import "./brokers.css";

const BROKERS_DATA = {
  verified: [
    {
      id: "miguel-torres",
      name: "Miguel Torres, REB",
      role: "Licensed Real Estate Broker",
      license: "PRC REB License No. 0019284",
      rating: 84,
      closures: "3 Verified Closures // BGC Focus",
      niche: ["Industrial Modern", "BGC Residential", "Asset Valuation"],
      avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=150&q=80",
    },
    {
      id: "elena-santos",
      name: "Elena Santos, REB",
      role: "Licensed Real Estate Broker",
      license: "PRC REB License No. 0021485",
      rating: 76,
      closures: "2 Verified Closures // QC Residential",
      niche: ["QC Luxury Estates", "Family Homes", "Negotiation"],
      avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&q=80",
    }
  ],
  featured: [
    {
      id: "marco-reyes",
      name: "Marco Reyes, REB",
      role: "Senior Partner & Broker",
      license: "PRC REB License No. 0011593",
      rating: 92,
      closures: "4 Verified Closures // STR Sector",
      niche: ["Short Term Rentals", "Yield Optimization", "Siargao/BGC"],
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80",
      scoutitPick: true,
    }
  ]
};

export default function BrokersClient({ slug }) {
  const [activeFormBroker, setActiveFormBroker] = useState(null);
  const [formData, setFormData] = useState({ name: "", phone: "", message: "" });
  const [submittedBrokerId, setSubmittedBrokerId] = useState(null);

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

  const renderBrokerCard = (broker, isFeatured = false) => {
    const isFormOpen = activeFormBroker === broker.id;
    const isSuccess = submittedBrokerId === broker.id;

    return (
      <div
        key={broker.id}
        className={`broker-item-card ${isFeatured ? "featured-card" : ""} ${isFormOpen ? "form-expanded" : ""}`}
      >
        {broker.scoutitPick && <div className="scoutit-pick-badge">SCOUTIT PICK</div>}
        
        <div className="broker-main-row">
          <div
            className="broker-avatar-img"
            style={{ backgroundImage: `url(${broker.avatar})` }}
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
          <button type="button" className="action-profile-btn">
            View Full Profile →
          </button>
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

        {/* Section 1 */}
        <section className="brokers-section-group">
          <h2 className="section-group-heading">Verified for this Space</h2>
          <div className="brokers-cards-list">
            {BROKERS_DATA.verified.map((b) => renderBrokerCard(b, false))}
          </div>
        </section>

        {/* Section 2 */}
        <section className="brokers-section-group" style={{ marginTop: "40px" }}>
          <h2 className="section-group-heading">Featured Partners</h2>
          <div className="brokers-cards-list">
            {BROKERS_DATA.featured.map((b) => renderBrokerCard(b, true))}
          </div>
        </section>

        <footer className="brokers-compliance-footer">
          <p>
            ScoutIt is a spatial intelligence archive. In compliance with R.A. 9646 (Real Estate Service Act of the Philippines), all property site visits, formal negotiation tables, and contract signings must be structured and validated by licensed real estate brokers.
          </p>
        </footer>
      </main>
    </div>
  );
}
