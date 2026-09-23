"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ScoutItWordmark from "@/components/brand/ScoutItWordmark";
import TrustBadge from "@/components/ui/TrustBadge";
import BrokerConnectForm from "./BrokerConnectForm";
import "./brokers.css";


export default function BrokersClient({ slug }) {
  const [brokers, setBrokers] = useState([]);
  const [property, setProperty] = useState(null);
  const [represented, setRepresented] = useState(false);
  const [contactable, setContactable] = useState(false);
  // A-147: uploader/lister disclosure for the unrepresented state —
  // "Anonymous" or the public owner's name, resolved server-side.
  const [uploader, setUploader] = useState(null);
  const [ownerFreeContact, setOwnerFreeContact] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeFormBroker, setActiveFormBroker] = useState(null);

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
          setUploader(typeof data.uploader === "string" ? data.uploader : null);
          setOwnerFreeContact(data.ownerFreeContact === true);
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
    setError("");
  };

  const renderBrokerCard = (broker) => {
    const formKey = `roster-${broker.id}`;
    const isActiveForm = activeFormBroker === formKey;

    return (
      <div key={formKey} className="broker-item-card">
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
          <div className="broker-rating-box"><span className="rating-num">—</span><span className="rating-lbl">BUILDING RECORD</span></div>
        </div>
        <div className="broker-actions-row">
          <Link href={`/brokers/${broker.id}`} className="action-profile-btn">View Profile →</Link>
          <button type="button" className={`action-retain-btn ${isActiveForm ? "active" : ""}`} onClick={() => toggleForm(formKey)}>
            {isActiveForm ? "Cancel" : broker.freeContact ? "Contact Broker · Free" : "Contact Broker · 1 Connect"}
          </button>
        </div>
        {isActiveForm && <div className="inline-intent-form-container"><BrokerConnectForm propertySlug={slug} brokerId={broker.id} freeContact={broker.freeContact === true} /></div>}
      </div>
    );
  };

  return (
    <div className="brokers-wrapper">
      <nav className="brokers-sticky-nav" aria-label="Property broker roster navigation">
        {slug ? (
        <Link href={`/property/${slug}`} className="nav-back-link">← Back to Property</Link>
        ) : null}
        <ScoutItWordmark href="/" className="nav-brand-logo" />
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
                {brokers.length > 0 && (
                  <section className="broker-layer scoutit-match-layer">
                    <header className="layer-header" style={{ marginBottom: "20px" }}>
                      <span className="gold-section-label" style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--accent)", letterSpacing: "0.12em", textTransform: "uppercase" }}>CURRENT REPRESENTATION</span>
                      <h2 className="layer-title" style={{ fontFamily: "var(--font-body)", fontSize: "24px", color: "var(--on-surface)", marginTop: "4px" }}>Authorized advisors</h2>
                      <p className="layer-subtitle" style={{ fontFamily: "var(--font-body)", fontSize: "14px", color: "var(--text-muted)", lineHeight: 1.6, marginTop: "8px", maxWidth: "700px" }}>
                        Roster order follows current representation authority. It is not a rating, recommendation, or paid trust ranking.
                      </p>
                    </header>
                    <div className="brokers-cards-list property-roster-list">
                      {brokers.map((broker) => renderBrokerCard(broker))}
                    </div>
                  </section>
                )}
              </div>
            ) : contactable ? (
              <section className="roster-empty-state">
                <h2>No active broker representation</h2>
                <p>This property is currently unrepresented. New inquiries route to the verified uploader or lister.</p>
                {uploader ? <p>Listed by {uploader}</p> : null}
                <button type="button" className="action-retain-btn" onClick={() => toggleForm("lister")}>{activeFormBroker === "lister" ? "Cancel" : ownerFreeContact ? "Contact lister · Free" : "Contact lister · 1 Connect"}</button>
                {activeFormBroker === "lister" && <div className="inline-intent-form-container"><BrokerConnectForm propertySlug={slug} freeContact={ownerFreeContact} recipientLabel="owner" /></div>}
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
