"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import TurnstileGate from "@/components/ui/TurnstileGate";
import TrustBadge from "@/components/ui/TrustBadge";
import { trackEvent, GA_EVENTS } from "@/lib/analytics";
import "./brokers.css";

const EMPTY_FORM = { name: "", phone: "", message: "" };

export default function BrokersClient({ slug }) {
  const [brokers, setBrokers] = useState([]);
  const [property, setProperty] = useState(null);
  const [represented, setRepresented] = useState(false);
  const [contactable, setContactable] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeFormBroker, setActiveFormBroker] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [submittedBrokerId, setSubmittedBrokerId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  const turnstileRef = useRef(null);

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
          setContactable(data.contactable === true);
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

  const toggleForm = (formKey = null) => {
    setActiveFormBroker(activeFormBroker === formKey ? null : formKey);
    setSubmittedBrokerId(null);
    setError("");
    setTurnstileToken("");
    turnstileRef.current?.reset();
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
          turnstileToken,
          ...formData,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Inquiry could not be routed");
      setSubmittedBrokerId(brokerId || "lister");
      setFormData(EMPTY_FORM);
      trackEvent(GA_EVENTS.INQUIRY_SENT, { channel: 'broker_form', property_slug: slug, routed_to: brokerId ? 'broker' : 'lister' });
    } catch (submitError) {
      setError(submitError.message || "Inquiry could not be routed");
      turnstileRef.current?.reset();
    } finally {
      setSubmitting(false);
    }
  };

  const renderForm = (brokerId = null, formKey = null) => {
    const key = formKey || brokerId || "lister";
    if (submittedBrokerId === (brokerId || "lister")) {
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
        <TurnstileGate
          ref={turnstileRef}
          action="property-inquiry"
          onToken={setTurnstileToken}
          onError={setError}
        />
        {error && <p className="form-error-alert" role="alert">{error}</p>}
        <button type="submit" className="form-submit-btn" disabled={submitting || !turnstileToken}>{submitting ? "Routing inquiry…" : "Send inquiry"}</button>
      </form>
    );
  };

  const renderBrokerCard = (broker, formIdPrefix) => {
    const formKey = `${formIdPrefix}-${broker.id}`;
    const isActiveForm = activeFormBroker === formKey;
    const isMatch = formIdPrefix === "match";

    return (
      <div key={formKey} className={`broker-item-card ${isMatch ? "recommended-card match-card" : ""}`}>
        <div className="broker-main-row">
          <div className="broker-avatar-img" style={broker.image ? { backgroundImage: `url(${broker.image})` } : undefined} aria-hidden="true" />
          <div className="broker-detail-col">
            <div className="broker-name-header">
              <h2 className="broker-name-txt">{broker.name}</h2>
              <span className="leris-badge">AUTHORIZED ROSTER</span>
            </div>
            <p className="broker-license-txt">{broker.headline || broker.firm || "Licensed property representative"}</p>
            
            {/* Trust Badges */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", margin: "8px 0" }}>
              <TrustBadge badgeId="IDENTITY_VERIFIED" />
              <TrustBadge badgeId="AUTHORIZED_REPRESENTATION" />
            </div>

            {broker.license && <p className="broker-closures-txt">PRC reference on file</p>}
            {broker.specializations?.length > 0 && <div className="niche-pills-row">{broker.specializations.map((tag) => <span key={tag} className="niche-pill-tag">{tag}</span>)}</div>}
          </div>
          <div className="broker-rating-box"><span className="rating-num">{broker.rating || "—"}</span><span className="rating-lbl">SCOUT RATING</span></div>
        </div>
        <div className="broker-actions-row">
          <Link href={`/brokers/${broker.id}`} className="action-profile-btn">View Profile →</Link>
          <button type="button" className={`action-retain-btn ${isActiveForm ? "active" : ""}`} onClick={() => toggleForm(formKey)}>
            {isActiveForm ? "Cancel" : "Contact Broker"}
          </button>
        </div>
        {isActiveForm && <div className="inline-intent-form-container">{renderForm(broker.id, formKey)}</div>}
      </div>
    );
  };

  return (
    <div className="brokers-wrapper">
      <nav className="brokers-sticky-nav" aria-label="Property broker roster navigation">
        <Link href={`/property/${slug || "batasan-hills"}`} className="nav-back-link">← Back to Property</Link>
        <span className="nav-brand-logo">SCOUTIT</span>
        <span className="nav-prop-info">{property?.title || "Property Profile"}</span>
      </nav>

      <div className="brokers-main-content">
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
              <div className="broker-layers-container">
                {/* LAYER 2: SCOUTIT MATCH */}
                {brokers.length > 0 && (
                  <section className="broker-layer scoutit-match-layer">
                    <header className="layer-header" style={{ marginBottom: "20px" }}>
                      <span className="gold-section-label" style={{ fontFamily: "var(--font-mono)", fontSize: "var(--type-micro)", color: "var(--accent)", letterSpacing: "0.15em", textTransform: "uppercase" }}>RECOMMENDED REPRESENTATION</span>
                      <h2 className="layer-title" style={{ fontFamily: "var(--font-body)", fontSize: "24px", color: "var(--on-surface)", marginTop: "4px" }}>ScoutIt Match ✦</h2>
                      <p className="layer-subtitle" style={{ fontFamily: "var(--font-body)", fontSize: "14px", color: "var(--text-muted)", lineHeight: 1.6, marginTop: "8px", maxWidth: "700px" }}>
                        Our recommendation algorithm weights verified ratings, detail completeness, and subscription tier. 
                        Because detail relevance is a primary input, money alone cannot buy the top slot.
                      </p>
                    </header>
                    <div className="brokers-cards-list property-roster-list">
                      {brokers.slice(0, 1).map((broker) => renderBrokerCard(broker, "match"))}
                    </div>
                  </section>
                )}

                {/* LAYER 1: INDEPENDENT RATING (TOP RATED) */}
                {brokers.length > 0 && (
                  <section className="broker-layer top-rated-layer" style={{ marginTop: "48px" }}>
                    <header className="layer-header" style={{ marginBottom: "20px" }}>
                      <span className="gold-section-label" style={{ fontFamily: "var(--font-mono)", fontSize: "var(--type-micro)", color: "var(--accent)", letterSpacing: "0.15em", textTransform: "uppercase" }}>INDEPENDENT RATING</span>
                      <h2 className="layer-title" style={{ fontFamily: "var(--font-body)", fontSize: "24px", color: "var(--on-surface)", marginTop: "4px" }}>Top Rated</h2>
                      <p className="layer-subtitle" style={{ fontFamily: "var(--font-body)", fontSize: "14px", color: "var(--text-muted)", lineHeight: 1.6, marginTop: "8px", maxWidth: "700px" }}>
                        The complete authorized roster for this property, ranked strictly by verified independent ratings. 
                        This ranking is purely meritocratic and is untouched by commercial tier.
                      </p>
                    </header>
                    <div className="brokers-cards-list property-roster-list">
                      {[...brokers].sort((a, b) => b.rating - a.rating).map((broker) => renderBrokerCard(broker, "rated"))}
                    </div>
                  </section>
                )}
              </div>
            ) : contactable ? (
              <section className="roster-empty-state">
                <h2>No active broker representation</h2>
                <p>This property is currently unrepresented. New inquiries route to the verified uploader or lister.</p>
                <button type="button" className="action-retain-btn" onClick={() => toggleForm("lister")}>{activeFormBroker === "lister" ? "Cancel" : "Contact uploader / lister"}</button>
                {activeFormBroker === "lister" && <div className="inline-intent-form-container">{renderForm(null)}</div>}
              </section>
            ) : (
              <section className="roster-empty-state" role="status">
                <h2>Representation details unavailable</h2>
                <p>This public listing does not yet have a verified routing record. No broker or recipient is being implied.</p>
              </section>
            )}
          </>
        )}

        <footer className="brokers-compliance-footer"><p>ScoutIt displays representation state as a current operational signal. Roster visibility does not replace independent verification of license, authority, or transaction terms.</p></footer>
      </div>
    </div>
  );
}