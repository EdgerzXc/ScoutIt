"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import "./brokers.css";

const EMPTY_FORM = { name: "", phone: "", message: "" };

export default function BrokersClient({ slug }) {
  const [brokers, setBrokers] = useState([]);
  const [property, setProperty] = useState(null);
  const [represented, setRepresented] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeFormBroker, setActiveFormBroker] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [submittedBrokerId, setSubmittedBrokerId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function loadRoster() {
      try {
        const response = await fetch(`/api/property/${encodeURIComponent(slug)}/brokers`, { cache: "no-store" });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Property roster unavailable");
        if (!cancelled) {
          setProperty(data.property || null);
          setBrokers(Array.isArray(data.brokers) ? data.brokers : []);
          setRepresented(data.represented === true);
        }
      } catch (loadError) {
        if (!cancelled) setError(loadError.message || "Property roster unavailable");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadRoster();
    return () => { cancelled = true; };
  }, [slug]);

  const toggleForm = (brokerId = null) => {
    setActiveFormBroker(activeFormBroker === brokerId ? null : brokerId);
    setSubmittedBrokerId(null);
    setError("");
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((previous) => ({ ...previous, [name]: value }));
  };

  const handleSubmit = async (event, brokerId = null) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const response = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertySlug: slug,
          preferredBrokerId: brokerId || undefined,
          ...formData,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Inquiry could not be routed");
      setSubmittedBrokerId(brokerId || "lister");
      setFormData(EMPTY_FORM);
    } catch (submitError) {
      setError(submitError.message || "Inquiry could not be routed");
    } finally {
      setSubmitting(false);
    }
  };

  const renderForm = (brokerId = null) => {
    const formKey = brokerId || "lister";
    if (submittedBrokerId === formKey) {
      return <div className="form-success-alert" role="status">✓ Inquiry routed to the current property recipient.</div>;
    }
    return (
      <form onSubmit={(event) => handleSubmit(event, brokerId)} className="intent-form">
        <h4 className="form-title">Send a property inquiry</h4>
        <div className="form-fields-grid">
          <input type="text" name="name" required placeholder="Your Full Name" value={formData.name} onChange={handleInputChange} className="form-input-field" />
          <input type="tel" name="phone" required placeholder="Contact Number (e.g. +63 917 ...)" value={formData.phone} onChange={handleInputChange} className="form-input-field" />
          <textarea name="message" required rows="3" placeholder="Tell the recipient what you want to verify." value={formData.message} onChange={handleInputChange} className="form-textarea-field" />
        </div>
        {error && <p className="form-error-alert" role="alert">{error}</p>}
        <button type="submit" className="form-submit-btn" disabled={submitting}>{submitting ? "Routing inquiry…" : "Send inquiry"}</button>
      </form>
    );
  };

  return (
    <div className="brokers-wrapper">
      <nav className="brokers-sticky-nav">
        <Link href={`/property/${slug || "batasan-hills"}`} className="nav-back-link">← Back to Property</Link>
        <span className="nav-brand-logo">SCOUTIT</span>
        <span className="nav-prop-info">{property?.title || "Property Profile"}</span>
      </nav>

      <main className="brokers-main-content">
        <header className="brokers-page-header">
          <span className="gold-section-label">PROPERTY REPRESENTATION</span>
          <h1 className="brokers-page-title">Authorized Broker Roster</h1>
          <p className="brokers-page-subtitle">Only the current visible, contactable representation for this property appears here.</p>
        </header>

        {loading ? (
          <div className="roster-empty-state">LOADING PROPERTY ROSTER…</div>
        ) : error && brokers.length === 0 ? (
          <div className="roster-empty-state" role="alert">{error}</div>
        ) : (
          <>
            {represented ? (
              <div className="brokers-cards-list property-roster-list">
                {brokers.map((broker) => (
                  <div key={broker.id} className="broker-item-card recommended-card">
                    <div className="broker-main-row">
                      <div className="broker-avatar-img" style={broker.image ? { backgroundImage: `url(${broker.image})` } : undefined} aria-hidden="true" />
                      <div className="broker-detail-col">
                        <div className="broker-name-header"><h2 className="broker-name-txt">{broker.name}</h2><span className="leris-badge">AUTHORIZED ROSTER</span></div>
                        <p className="broker-license-txt">{broker.headline || broker.firm || "Licensed property representative"}</p>
                        {broker.license && <p className="broker-closures-txt">PRC reference on file</p>}
                        {broker.specializations?.length > 0 && <div className="niche-pills-row">{broker.specializations.map((tag) => <span key={tag} className="niche-pill-tag">{tag}</span>)}</div>}
                      </div>
                      <div className="broker-rating-box"><span className="rating-num">{broker.rating || "—"}</span><span className="rating-lbl">SCOUT RATING</span></div>
                    </div>
                    <div className="broker-actions-row">
                      <Link href={`/brokers/${broker.id}`} className="action-profile-btn">View Profile →</Link>
                      <button type="button" className={`action-retain-btn ${activeFormBroker === broker.id ? "active" : ""}`} onClick={() => toggleForm(broker.id)}>{activeFormBroker === broker.id ? "Cancel" : "Contact Broker"}</button>
                    </div>
                    {activeFormBroker === broker.id && <div className="inline-intent-form-container">{renderForm(broker.id)}</div>}
                  </div>
                ))}
              </div>
            ) : (
              <section className="roster-empty-state">
                <h2>No active broker representation</h2>
                <p>This property is currently unrepresented. New inquiries go to the uploader or lister.</p>
                <button type="button" className="action-retain-btn" onClick={() => toggleForm("lister")}>{activeFormBroker === "lister" ? "Cancel" : "Contact uploader / lister"}</button>
                {activeFormBroker === "lister" && <div className="inline-intent-form-container">{renderForm(null)}</div>}
              </section>
            )}
          </>
        )}

        <footer className="brokers-compliance-footer"><p>ScoutIt displays representation state as a current operational signal. Roster visibility does not replace independent verification of license, authority, or transaction terms.</p></footer>
      </main>
    </div>
  );
}