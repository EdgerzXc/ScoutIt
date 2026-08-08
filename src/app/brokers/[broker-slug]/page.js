import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Link from "next/link";
import { notFound } from "next/navigation";
import ConnectionPortal from "@/components/connection/ConnectionPortal";

import { getCmsBundle } from "@/lib/cmsCache";
import { siteUrl } from "@/lib/siteUrl";
import "./broker-detail.css";

export async function generateMetadata({ params }) {
  const { "broker-slug": slug } = await params;
  const bundle = await getCmsBundle();
  const broker = bundle.brokers.find(b => b.id === slug);
  return {
    title: broker ? `${broker.name} · Advisor Profile` : "Advisor Profile",
    description: broker ? broker.bio : "Vetted space intelligence advisor.",
    // Without this the profile inherits `canonical: "/brokers"` from
    // src/app/brokers/layout.js, which tells Google to index the directory
    // instead of this profile.
    alternates: { canonical: siteUrl(`/brokers/${slug}`) },
  };
}

export default async function BrokerDetailPage({ params }) {
  const { "broker-slug": slug } = await params;
  const bundle = await getCmsBundle();
  const broker = bundle.brokers.find(b => b.id === slug);

  if (!broker) {
    notFound();
  }

  return (
    <div className="page-wrapper">
      <Header />
      
      <main className="broker-detail-main">
        {/* Profile Split layout */}
        <section className="profile-grid">
          
          {/* Left Column: Avatar & Trust Credentials */}
          <div className="profile-left-column">
            <div 
              className="detail-avatar" 
              style={{ backgroundImage: `url(${broker.image})` }}
            ></div>
            
            {/* 3-Metric Block */}
            <div className="detail-metrics-grid">
              {broker.metrics.map((m, idx) => (
                <div key={idx} className="detail-metric-card">
                  <span className="metric-lbl">{m.label}</span>
                  <span className="metric-val">{m.value}</span>
                </div>
              ))}
            </div>

            <div className="detail-closures-box">
              <span className="icon-badge">SECURE ROSTER LINK</span>
              <p>{broker.closures}</p>
            </div>

            {broker.scoutRating != null && (
              <div className="scout-rating-box">
                <span className="scout-rating-box-label">Scout Rating</span>
                <span className="scout-rating-box-score" style={{ color: broker.scoutRating >= 85 ? "#4caf7d" : "#E8AE3C" }}>
                  {broker.scoutRating}<span style={{ fontSize: "16px", color: "var(--text-muted)" }}>/100</span>
                </span>
                <div className="scout-rating-breakdown">
                  <span>Active Retentions 40% &middot; Continuity 40% &middot; Stewardship 20%</span>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Bio & Specialties */}
          <div className="profile-right-column">
            <header className="profile-header">
              <span className="vector-label">Advisory Profile &middot; {broker.clearanceTier}</span>
              <h1 className="profile-name">{broker.name}</h1>
              <p className="profile-title">{broker.title} {"//"} {broker.location}</p>
              {/* RA 9646: badge renders only when staff ticked License_Verified
                  in Airtable after checking the PRC registry. */}
              {broker.licenseVerified && (
                <span className="prc-verified-badge">
                  ✓ PRC VERIFIED{broker.license ? ` · ${broker.license}` : ""}
                </span>
              )}
            </header>

            <div className="profile-body-content">
              <div className="detail-section">
                <h3>Operational Profile biography</h3>
                <p className="bio-paragraph">{broker.bio}</p>
              </div>

              <div className="detail-section">
                <h3>Operational Focus area</h3>
                <div className="focus-pills-list">
                  <span className="focus-pill">Specialty: {broker.specialty}</span>
                  <span className="focus-pill">Location: {broker.location}</span>
                  <span className="focus-pill">Clearance: {broker.clearanceTier}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Curated Spaces Grid */}
        <section className="detail-curations-section">
          <h3>Curated Spaces under Management</h3>
          <p className="section-desc">Active listings and structural briefs managed by this advisor.</p>
          
          <div className="detail-curations-grid">
            {broker.managedProperties.map((prop) => (
              <Link href={`/property/${prop.slug}`} key={prop.slug} className="curation-card">
                <div 
                  className="curation-card-img" 
                  style={{ backgroundImage: `url(${prop.image})` }}
                ></div>
                <div className="curation-card-body">
                  <span className="curation-card-cat">{prop.category}</span>
                  <h4>{prop.title}</h4>
                  <span className="curation-card-link">View Showcase Briefing →</span>
                </div>
              </Link>
            ))}
            {broker.managedProperties.length === 0 && (
              <div className="empty-curations-msg">
                No active property showcase spaces currently linked to this roster channel.
              </div>
            )}
          </div>
        </section>

        {/* Connection Form Component (Client Side) */}
        <section className="portal-section">
          <ConnectionPortal brokerName={broker.name} brokerId={broker.id} />
        </section>


      </main>
      <Footer />

    </div>
  );
}
