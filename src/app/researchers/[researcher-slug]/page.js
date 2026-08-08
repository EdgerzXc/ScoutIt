import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Lock } from "lucide-react";
import ServiceConnectionPortal from "@/components/connection/ServiceConnectionPortal";
import { DetailPageAccessGate } from "@/components/ui/EarlyAccessGate";
import { siteUrl } from "@/lib/siteUrl";
import "@/app/directory-detail.css";


const DUMMY_RESEARCHERS = [];

export async function generateMetadata({ params }) {
  const { "researcher-slug": slug } = await params;
  const r = DUMMY_RESEARCHERS.find(x => x.id === slug);
  return {
    title: r ? `${r.name} · Site Intelligence Profile` : "Site Researcher Profile",
    description: r ? r.bio : "Verified ScoutIt partner site researcher.",
    // Without this the profile inherits `canonical: "/researchers"` from the
    // parent layout, pointing Google at the directory instead of this page.
    alternates: { canonical: siteUrl(`/researchers/${slug}`) },
  };
}

export default async function ResearcherDetailPage({ params }) {
  const { "researcher-slug": slug } = await params;
  const r = DUMMY_RESEARCHERS.find(x => x.id === slug);

  if (!r) {
    notFound();
  }

  return (
    <div className="page-wrapper">
      <Header />
      
      <main className="broker-detail-main">
        {/* Access Gate — restricted profile */}
        <DetailPageAccessGate
          rosterType="Research Network"
          providerName={r.name}
        />

        {/* Profile Split layout */}
        <section className="profile-grid">
          
          {/* Left Column: Avatar & Trust Credentials */}
          <div className="profile-left-column">
            <div 
              className="detail-avatar" 
              style={{ backgroundImage: `url(${r.image})` }}
            ></div>
            
            {/* 3-Metric Block */}
            <div className="detail-metrics-grid">
              {r.metrics.map((m, idx) => (
                <div key={idx} className="detail-metric-card">
                  <span className="metric-lbl">{m.label}</span>
                  <span className="metric-val">{m.value}</span>
                </div>
              ))}
            </div>

            <div className="detail-closures-box">
              <span className="icon-badge"><Lock size={12} strokeWidth={1.5} style={{verticalAlign:"-2px", marginRight:"4px"}} />SECURE ANALYST LINK</span>
              <p>{r.reports}</p>
            </div>
          </div>

          {/* Right Column: Bio & Specialties */}
          <div className="profile-right-column">
            <header className="profile-header">
              <span className="vector-label">Research Profile &middot; {r.clearanceTier}</span>
              <h1 className="profile-name">{r.name}</h1>
              <p className="profile-title">{r.title} {"//"} {r.location}</p>
            </header>

            <div className="profile-body-content">
              <div className="detail-section">
                <h3>Operational Profile Biography</h3>
                <p className="bio-paragraph">{r.bio}</p>
              </div>

              <div className="detail-section">
                <h3>Operational Focus & Markets</h3>
                <div className="focus-pills-list">
                  <span className="focus-pill">Focus: {r.focus}</span>
                  <span className="focus-pill">Turnaround: {r.turnaround}</span>
                  <span className="focus-pill">Markets: {r.markets}</span>
                  <span className="focus-pill">Credentials: {r.license}</span>
                </div>
              </div>

              <div className="detail-section">
                <h3>Standard Report Deliverables</h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginTop: "10px" }}>
                  {r.deliverables.map((item) => (
                    <div key={item} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "var(--text-secondary)" }}>
                      <span style={{ color: "var(--accent)", fontSize: "11px" }}>✓</span>
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Researched Properties List */}
        <section className="detail-curations-section">
          <h3>Vetted Intelligence Briefings</h3>
          <p className="section-desc">Active structural briefs and site assessments executed by this analyst.</p>
          
          <div className="detail-curations-grid">
            {r.managedProperties.map((prop) => (
              <Link href={`/property/${prop.slug}`} key={prop.slug} className="curation-card">
                <div 
                  className="curation-card-img" 
                  style={{ backgroundImage: `url(${prop.image})` }}
                ></div>
                <div className="curation-card-body">
                  <span className="curation-card-cat">{prop.category}</span>
                  <h4>{prop.title}</h4>
                  <span className="curation-card-link">View Structural Briefing →</span>
                </div>
              </Link>
            ))}
            {r.managedProperties.length === 0 && (
              <div className="empty-curations-msg">
                No active property showcase spaces currently linked to this roster channel.
              </div>
            )}
          </div>
        </section>

        {/* Connection Form Component (Client Side) */}
        <section className="portal-section">
          <ServiceConnectionPortal providerName={r.name} serviceType="Researcher" />
        </section>

      </main>
      <Footer />

    </div>
  );
}
