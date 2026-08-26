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
            
            <div className="detail-closures-box">
              <span className="icon-badge">SCOUTIT RECORD</span>
              <p>Building a ScoutIt record</p>
              <small>Qualified platform activity will appear here only after the public metric projection is available.</small>
            </div>
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
                <h2>Operational Profile biography</h2>
                <p className="bio-paragraph">{broker.bio}</p>
              </div>

              <div className="detail-section">
                <h2>Operational Focus area</h2>
                <div className="focus-pills-list">
                  <span className="focus-pill">Specialty: {broker.specialty}</span>
                  <span className="focus-pill">Location: {broker.location}</span>
                  <span className="focus-pill">Clearance: {broker.clearanceTier}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Current representations come from the authority projection in phase 2. */}
        <section className="detail-curations-section">
          <h2>Current Representations</h2>
          <p className="section-desc">Only active, visible, contactable, owner-accepted property representations appear here.</p>
          
          <div className="detail-curations-grid">
            {broker.managedProperties.map((prop) => (
              <Link href={`/property/${prop.slug}`} key={prop.slug} className="curation-card">
                <div 
                  className="curation-card-img" 
                  style={{ backgroundImage: `url(${prop.image})` }}
                ></div>
                <div className="curation-card-body">
                  <span className="curation-card-cat">{prop.category}</span>
                  <h3>{prop.title}</h3>
                  <span className="curation-card-link">View Showcase Briefing →</span>
                </div>
              </Link>
            ))}
            {broker.managedProperties.length === 0 && (
              <div className="empty-curations-msg">
                No eligible public property representations are attached to this dossier.
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
