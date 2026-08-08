import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Lock } from "lucide-react";
import ServiceConnectionPortal from "@/components/connection/ServiceConnectionPortal";
import { DetailPageAccessGate } from "@/components/ui/EarlyAccessGate";
import { siteUrl } from "@/lib/siteUrl";
import "@/app/directory-detail.css";


const DUMMY_PHOTOGRAPHERS = [];

export async function generateMetadata({ params }) {
  const { "photographer-slug": slug } = await params;
  const ph = DUMMY_PHOTOGRAPHERS.find(p => p.id === slug);
  return {
    title: ph ? `${ph.name} · Photographer Profile` : "Photographer Profile",
    description: ph ? ph.bio : "Verified ScoutIt partner photographer.",
    // Without this the profile inherits `canonical: "/photographers"` from the
    // parent layout, pointing Google at the directory instead of this page.
    alternates: { canonical: siteUrl(`/photographers/${slug}`) },
  };
}

export default async function PhotographerDetailPage({ params }) {
  const { "photographer-slug": slug } = await params;
  const ph = DUMMY_PHOTOGRAPHERS.find(p => p.id === slug);

  if (!ph) {
    notFound();
  }

  return (
    <div className="page-wrapper">
      <Header />
      
      <main className="broker-detail-main">
        {/* Access Gate — restricted profile */}
        <DetailPageAccessGate
          rosterType="Photography Network"
          providerName={ph.name}
        />

        {/* Profile Split layout */}
        <section className="profile-grid">
          
          {/* Left Column: Avatar & Trust Credentials */}
          <div className="profile-left-column">
            <div 
              className="detail-avatar" 
              style={{ backgroundImage: `url(${ph.image})` }}
            ></div>
            
            {/* 3-Metric Block */}
            <div className="detail-metrics-grid">
              {ph.metrics.map((m, idx) => (
                <div key={idx} className="detail-metric-card">
                  <span className="metric-lbl">{m.label}</span>
                  <span className="metric-val">{m.value}</span>
                </div>
              ))}
            </div>

            <div className="detail-closures-box">
              <span className="icon-badge"><Lock size={12} strokeWidth={1.5} style={{verticalAlign:"-2px", marginRight:"4px"}} />SECURE CREATOR LINK</span>
              <p>{ph.shoots}</p>
            </div>
          </div>

          {/* Right Column: Bio & Specialties */}
          <div className="profile-right-column">
            <header className="profile-header">
              <span className="vector-label">Creative Profile &middot; {ph.clearanceTier}</span>
              <h1 className="profile-name">{ph.name}</h1>
              <p className="profile-title">{ph.title} {"//"} {ph.location}</p>
            </header>

            <div className="profile-body-content">
              <div className="detail-section">
                <h3>Operational Profile Biography</h3>
                <p className="bio-paragraph">{ph.bio}</p>
              </div>

              <div className="detail-section">
                <h3>Operational Focus & Technical Specs</h3>
                <div className="focus-pills-list">
                  <span className="focus-pill">Specialty: {ph.specialty}</span>
                  <span className="focus-pill">Equipment: {ph.equipment}</span>
                  <span className="focus-pill">Style: {ph.style}</span>
                  <span className="focus-pill">Sessions: {ph.sessions}</span>
                  <span className="focus-pill">Credentials: {ph.license}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Curated Properties List */}
        <section className="detail-curations-section">
          <h3>Photographed Spaces Showcase</h3>
          <p className="section-desc">Active structural designs and showcase assets captured by this creator.</p>
          
          <div className="detail-curations-grid">
            {ph.managedProperties.map((prop) => (
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
            {ph.managedProperties.length === 0 && (
              <div className="empty-curations-msg">
                No active property showcase spaces currently linked to this roster channel.
              </div>
            )}
          </div>
        </section>

        {/* Connection Form Component (Client Side) */}
        <section className="portal-section">
          <ServiceConnectionPortal providerName={ph.name} serviceType="Photographer" />
        </section>

      </main>
      <Footer />

    </div>
  );
}
