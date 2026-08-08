import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Lock } from "lucide-react";
import ServiceConnectionPortal from "@/components/connection/ServiceConnectionPortal";
import { DetailPageAccessGate } from "@/components/ui/EarlyAccessGate";
import { siteUrl } from "@/lib/siteUrl";
import "@/app/directory-detail.css";


const DUMMY_PLANNERS = [];

export async function generateMetadata({ params }) {
  const { "planner-slug": slug } = await params;
  const ep = DUMMY_PLANNERS.find(x => x.id === slug);
  return {
    title: ep ? `${ep.name} · Event Design Profile` : "Event Designer Profile",
    description: ep ? ep.bio : "Verified ScoutIt partner event planner & designer.",
    // Without this the profile inherits `canonical: "/event-planners"` from the
    // parent layout, pointing Google at the directory instead of this page.
    alternates: { canonical: siteUrl(`/event-planners/${slug}`) },
  };
}

export default async function EventPlannerDetailPage({ params }) {
  const { "planner-slug": slug } = await params;
  const ep = DUMMY_PLANNERS.find(x => x.id === slug);

  if (!ep) {
    notFound();
  }

  return (
    <div className="page-wrapper">
      <Header />
      
      <main className="broker-detail-main">
        {/* Access Gate — restricted profile */}
        <DetailPageAccessGate
          rosterType="Event Design Network"
          providerName={ep.name}
        />

        {/* Profile Split layout */}
        <section className="profile-grid">
          
          {/* Left Column: Avatar & Trust Credentials */}
          <div className="profile-left-column">
            <div 
              className="detail-avatar" 
              style={{ backgroundImage: `url(${ep.image})` }}
            ></div>
            
            {/* 3-Metric Block */}
            <div className="detail-metrics-grid">
              {ep.metrics.map((m, idx) => (
                <div key={idx} className="detail-metric-card">
                  <span className="metric-lbl">{m.label}</span>
                  <span className="metric-val">{m.value}</span>
                </div>
              ))}
            </div>

            <div className="detail-closures-box">
              <span className="icon-badge"><Lock size={12} strokeWidth={1.5} style={{verticalAlign:"-2px", marginRight:"4px"}} />SECURE DESIGN LINK</span>
              <p>{ep.events}</p>
            </div>
          </div>

          {/* Right Column: Bio & Specialties */}
          <div className="profile-right-column">
            <header className="profile-header">
              <span className="vector-label">Design Profile &middot; {ep.clearanceTier}</span>
              <h1 className="profile-name">{ep.name}</h1>
              <p className="profile-title">{ep.title} {"//"} {ep.location}</p>
            </header>

            <div className="profile-body-content">
              <div className="detail-section">
                <h3>Operational Profile Biography</h3>
                <p className="bio-paragraph">{ep.bio}</p>
              </div>

              <div className="detail-section">
                <h3>Operational Design Focus</h3>
                <div className="focus-pills-list">
                  <span className="focus-pill">Specialty: {ep.specialty}</span>
                  <span className="focus-pill">Design Style: {ep.style}</span>
                  <span className="focus-pill">Preferred Venues: {ep.venues}</span>
                  <span className="focus-pill">Credentials: {ep.license}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Styled Venues / Properties List */}
        <section className="detail-curations-section">
          <h3>Designed & Styled Spaces</h3>
          <p className="section-desc">Active spaces and event setups designed or styled by this partner.</p>
          
          <div className="detail-curations-grid">
            {ep.managedProperties.map((prop) => (
              <Link href={`/property/${prop.slug}`} key={prop.slug} className="curation-card">
                <div 
                  className="curation-card-img" 
                  style={{ backgroundImage: `url(${prop.image})` }}
                ></div>
                <div className="curation-card-body">
                  <span className="curation-card-cat">{prop.category}</span>
                  <h4>{prop.title}</h4>
                  <span className="curation-card-link">View Venue Showcase →</span>
                </div>
              </Link>
            ))}
            {ep.managedProperties.length === 0 && (
              <div className="empty-curations-msg">
                No active property showcase spaces currently linked to this roster channel.
              </div>
            )}
          </div>
        </section>

        {/* Connection Form Component (Client Side) */}
        <section className="portal-section">
          <ServiceConnectionPortal providerName={ep.name} serviceType="Event Planner" />
        </section>

      </main>
      <Footer />

    </div>
  );
}
