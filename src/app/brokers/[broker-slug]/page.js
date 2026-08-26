import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Link from "next/link";
import { notFound } from "next/navigation";
import ConnectionPortal from "@/components/connection/ConnectionPortal";

import { getCmsBundle } from "@/lib/cmsCache";
import { siteUrl } from "@/lib/siteUrl";
import {
  DOSSIER_REPRESENTATION_STATES,
  buildRepresentationSection,
  publicBrokerIdentity,
  resolveBrokerAuthorityId,
} from "@/lib/brokerDossier";
import { loadBrokerRepresentationAuthority } from "@/lib/serverBrokerDossier";
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

// A-023: what the Current Representations section is allowed to say in each
// state. Only one of these four is an assertion that the broker represents
// nothing; the other three say why we cannot make that claim.
const REPRESENTATION_COPY = {
  [DOSSIER_REPRESENTATION_STATES.NONE_ELIGIBLE]:
    "No eligible public property representations are attached to this dossier.",
  [DOSSIER_REPRESENTATION_STATES.NOT_LINKED]:
    "This dossier is not yet linked to the representation record, so its properties cannot be shown here.",
  [DOSSIER_REPRESENTATION_STATES.LOOKUP_FAILED]:
    "The representation record could not be reached. This is a temporary read failure, not a statement about this advisor's properties.",
};

export default async function BrokerDetailPage({ params }) {
  const { "broker-slug": slug } = await params;
  const bundle = await getCmsBundle();
  const broker = bundle.brokers.find(b => b.id === slug);

  if (!broker) {
    notFound();
  }

  // Everything below renders from the allowlisted projection, never from the
  // raw Airtable record.
  const identity = publicBrokerIdentity(broker);
  if (!identity) {
    notFound();
  }

  const authorityId = resolveBrokerAuthorityId(identity.id);
  const { lookup, propertiesByAuthorityId } = await loadBrokerRepresentationAuthority(
    authorityId,
    bundle.properties,
  );
  const representations = buildRepresentationSection({
    authorityId,
    lookup,
    propertiesByAuthorityId,
  });

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
              style={{ backgroundImage: `url(${identity.image})` }}
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
              <span className="vector-label">Advisory Profile &middot; {identity.clearanceTier}</span>
              <h1 className="profile-name">{identity.name}</h1>
              <p className="profile-title">{identity.title} {"//"} {identity.location}</p>
              {/* RA 9646: badge renders only when staff ticked License_Verified
                  in Airtable after checking the PRC registry. */}
              {identity.licenseVerified && (
                <span className="prc-verified-badge">
                  ✓ PRC VERIFIED{identity.license ? ` · ${identity.license}` : ""}
                </span>
              )}
            </header>

            <div className="profile-body-content">
              <div className="detail-section">
                <h2>Operational Profile biography</h2>
                <p className="bio-paragraph">{identity.bio}</p>
              </div>

              <div className="detail-section">
                <h2>Operational Focus area</h2>
                <div className="focus-pills-list">
                  <span className="focus-pill">Specialty: {identity.specialty}</span>
                  <span className="focus-pill">Location: {identity.location}</span>
                  <span className="focus-pill">Clearance: {identity.clearanceTier}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Current representations are generated from the Supabase
            representation authority. Brokers cannot add or reorder them. */}
        <section className="detail-curations-section">
          <h2>Current Representations</h2>
          <p className="section-desc">Only active, visible, contactable, owner-accepted property representations appear here.</p>

          <div className="detail-curations-grid">
            {representations.cards.map((card) => (
              <Link href={card.href} key={card.slug} className="curation-card">
                <div
                  className="curation-card-img"
                  style={{ backgroundImage: `url(${card.image})` }}
                ></div>
                <div className="curation-card-body">
                  <span className="curation-card-cat">{card.category}</span>
                  <h3>{card.title}</h3>
                  <span className="curation-card-link">View Showcase Briefing →</span>
                </div>
              </Link>
            ))}
            {representations.state !== DOSSIER_REPRESENTATION_STATES.LISTED && (
              <div
                className={`empty-curations-msg${representations.claimsEmptiness ? "" : " representation-notice"}`}
                role={representations.state === DOSSIER_REPRESENTATION_STATES.LOOKUP_FAILED ? "status" : undefined}
              >
                {REPRESENTATION_COPY[representations.state]}
              </div>
            )}
          </div>
        </section>

        {/* Connection Form Component (Client Side) */}
        <section className="portal-section">
          <ConnectionPortal brokerName={identity.name} brokerId={identity.id} />
        </section>


      </main>
      <Footer />

    </div>
  );
}
