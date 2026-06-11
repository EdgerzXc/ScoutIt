import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Link from "next/link";
import { notFound } from "next/navigation";
import ServiceConnectionPortal from "@/components/connection/ServiceConnectionPortal";
import { DetailPageAccessGate } from "@/components/ui/EarlyAccessGate";
import { getResearchers } from "@/data/mockResearchers";

const DUMMY_RESEARCHERS = getResearchers();

export async function generateMetadata({ params }) {
  const { "researcher-slug": slug } = await params;
  const r = DUMMY_RESEARCHERS.find(x => x.id === slug);
  return {
    title: r ? `${r.name} · Site Intelligence Profile` : "Site Researcher Profile",
    description: r ? r.bio : "Verified ScoutIt partner site researcher."
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
              <span className="icon-badge">🔒 SECURE ANALYST LINK</span>
              <p>{r.reports}</p>
            </div>
          </div>

          {/* Right Column: Bio & Specialties */}
          <div className="profile-right-column">
            <header className="profile-header">
              <span className="vector-label">Research Profile &middot; {r.clearanceTier}</span>
              <h1 className="profile-name">{r.name}</h1>
              <p className="profile-title">{r.title} // {r.location}</p>
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

      <style>{`
        .page-wrapper {
          background: var(--bg);
          color: var(--text-primary);
          min-height: 100vh;
        }

        .broker-detail-main {
          padding: 60px 45px 80px 45px;
          max-width: 1400px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 64px;
        }

        /* Profile Layout */
        .profile-grid {
          display: grid;
          grid-template-columns: 320px 1fr;
          gap: 60px;
          border-bottom: 1px solid var(--border-solid);
          padding-bottom: 60px;
        }

        @media (max-width: 900px) {
          .profile-grid {
            grid-template-columns: 1fr;
            gap: 40px;
          }
          .profile-left-column {
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
          }
        }

        /* Left Column */
        .profile-left-column {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .detail-avatar {
          width: 100%;
          aspect-ratio: 1 / 1;
          max-width: 320px;
          border-radius: 4px;
          background-size: cover;
          background-position: center;
          border: 1px solid var(--border-solid);
          filter: grayscale(100%) contrast(1.15);
          transition: filter var(--transition-slow);
        }

        .detail-avatar:hover {
          filter: grayscale(0%) contrast(1.15);
        }

        .detail-metrics-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
          width: 100%;
        }

        .detail-metric-card {
          background: var(--surface);
          border: 1px solid var(--border-solid);
          padding: 12px 6px;
          border-radius: 4px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
        }

        .metric-lbl {
          font-size: 8px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--text-muted);
          margin-bottom: 4px;
          line-height: 1.1;
        }

        .metric-val {
          font-family: var(--font-display);
          font-size: 11px;
          color: var(--accent);
          font-weight: 600;
          line-height: 1.1;
          white-space: nowrap;
        }

        .detail-closures-box {
          background: rgba(0,0,0,0.4);
          border: 1px dashed var(--border-solid);
          border-radius: 4px;
          padding: 16px 20px;
          text-align: center;
        }

        .icon-badge {
          font-family: var(--font-mono);
          font-size: 9px;
          color: var(--text-muted);
          letter-spacing: 0.1em;
          display: block;
          margin-bottom: 6px;
        }

        .detail-closures-box p {
          font-size: 12px;
          color: var(--text-secondary);
          margin: 0;
        }

        /* Right Column */
        .profile-right-column {
          display: flex;
          flex-direction: column;
          gap: 32px;
        }

        .profile-header {
          border-bottom: 1px solid var(--border-solid);
          padding-bottom: 24px;
        }

        .vector-label {
          font-family: var(--font-mono);
          font-size: 11px;
          color: var(--accent);
          letter-spacing: 0.15em;
          text-transform: uppercase;
          display: block;
          margin-bottom: 8px;
        }

        .profile-name {
          font-family: var(--font-display);
          font-size: 42px;
          font-weight: 500;
          color: #fff;
          margin: 0 0 8px 0;
        }

        .profile-title {
          font-size: 14px;
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin: 0;
        }

        .profile-body-content {
          display: flex;
          flex-direction: column;
          gap: 32px;
        }

        .detail-section h3 {
          font-family: var(--font-mono);
          font-size: 11px;
          color: var(--accent);
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin: 0 0 16px 0;
          border-bottom: 1px solid rgba(255,255,255,0.03);
          padding-bottom: 8px;
        }

        .bio-paragraph {
          font-size: 15px;
          line-height: 1.8;
          color: var(--text-secondary);
        }

        .focus-pills-list {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
        }

        .focus-pill {
          background: var(--surface);
          border: 1px solid var(--border-solid);
          color: var(--text-primary);
          padding: 8px 16px;
          border-radius: 4px;
          font-size: 12px;
          font-family: var(--font-body);
        }

        /* Curated Properties List */
        .detail-curations-section h3 {
          font-family: var(--font-display);
          font-size: 24px;
          color: #fff;
          margin: 0 0 6px 0;
        }

        .section-desc {
          font-size: 13px;
          color: var(--text-secondary);
          margin: 0 0 32px 0;
        }

        .detail-curations-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 32px;
        }

        @media (max-width: 900px) {
          .detail-curations-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 600px) {
          .detail-curations-grid {
            grid-template-columns: 1fr;
          }
        }

        .curation-card {
          background: var(--surface);
          border: 1px solid var(--border-solid);
          border-radius: var(--radius-md);
          overflow: hidden;
          text-decoration: none;
          display: flex;
          flex-direction: column;
          transition: all var(--transition-fast);
        }

        .curation-card:hover {
          border-color: var(--accent-border);
          transform: translateY(-4px);
        }

        .curation-card-img {
          height: 160px;
          background-size: cover;
          background-position: center;
        }

        .curation-card-body {
          padding: 20px;
          display: flex;
          flex-direction: column;
          flex: 1;
        }

        .curation-card-cat {
          font-family: var(--font-mono);
          font-size: 9px;
          color: var(--accent);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 8px;
        }

        .curation-card-body h4 {
          font-family: var(--font-display);
          font-size: 18px;
          color: var(--text-primary);
          margin-bottom: 16px;
          line-height: 1.3;
          flex: 1;
        }

        .curation-card-link {
          font-size: 11px;
          font-weight: 600;
          color: var(--accent);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .empty-curations-msg {
          grid-column: 1 / -1;
          text-align: center;
          padding: 40px 0;
          color: var(--text-muted);
          font-size: 13px;
          font-style: italic;
        }
      `}</style>
    </div>
  );
}
