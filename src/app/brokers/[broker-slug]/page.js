import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Link from "next/link";
import { notFound } from "next/navigation";
import ConnectionPortal from "@/components/connection/ConnectionPortal";
import BrokerDossierIdentity from "@/components/brokers/BrokerDossierIdentity";
import BrokerRecommendations from "@/components/brokers/BrokerRecommendations";
import BrokerContributions from "@/components/brokers/BrokerContributions";
import BrokerCareerHistory from "@/components/brokers/BrokerCareerHistory";

import { getCmsBundle } from "@/lib/cmsCache";
import { siteUrl } from "@/lib/siteUrl";
import {
  DOSSIER_REPRESENTATION_STATES,
  buildRepresentationSection,
  findPublicBroker,
  publicBrokerIdentity,
  resolveBrokerAuthorityId,
} from "@/lib/brokerDossier";
import { brokerDossierRobots, buildBrokerDossierJsonLd } from "@/lib/brokerDossierSchema";
import { escapeJsonLd } from "@/lib/jsonLdScript";
import { loadBrokerRepresentationAuthority } from "@/lib/serverBrokerDossier";
import { buildRecommendationSection } from "@/lib/brokerRecommendations";
import { buildScoutItRecord } from "@/lib/brokerMetrics";
import { buildCareerHistorySection } from "@/lib/brokerCareerHistory";
import { buildBrokerCredential } from "@/lib/brokerCredential";
import { loadBrokerCredentialRecord } from "@/lib/serverBrokerCredential";
import { loadBrokerCareerClaims } from "@/lib/serverBrokerCareerHistory";
import { loadBrokerMetricSnapshot } from "@/lib/serverBrokerMetrics";
import { buildContributionSection } from "@/lib/brokerContributions";
import {
  loadBrokerContributionAuthority,
  loadBrokerRecommendationAuthority,
} from "@/lib/serverBrokerSocialProof";
import "./broker-detail.css";

export async function generateMetadata({ params }) {
  const { "broker-slug": slug } = await params;
  const bundle = await getCmsBundle();
  const broker = findPublicBroker(bundle.brokers, slug);
  const identity = publicBrokerIdentity(broker);
  const canonical = siteUrl(`/brokers/${identity?.id || slug}`);
  const title = identity ? `${identity.name} · Advisor Profile` : "Advisor Profile";
  const description = identity?.bio || "Vetted space intelligence advisor.";

  return {
    title,
    description,
    // Without this the profile inherits `canonical: "/brokers"` from
    // src/app/brokers/layout.js, which tells Google to index the directory
    // instead of this profile.
    alternates: { canonical },
    // An example profile carries illustrative figures. The page says so to
    // humans; this says the same thing to crawlers.
    robots: identity ? brokerDossierRobots(identity) : undefined,
    openGraph: {
      type: "profile",
      title,
      description,
      url: canonical,
      siteName: "ScoutIt",
      images: identity?.image ? [{ url: identity.image, alt: identity.name }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: identity?.image ? [identity.image] : undefined,
    },
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
  const broker = findPublicBroker(bundle.brokers, slug);

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

  // Independent authorities, read in parallel. Neither can block the dossier:
  // each resolves to its own state and a failed read renders as a read failure
  // rather than as an absence of recommendations or contributions.
  const [recommendationLookup, contributionLookup, metricLookup, careerLookup, credentialRecord] =
    await Promise.all([
      loadBrokerRecommendationAuthority(authorityId),
      loadBrokerContributionAuthority(authorityId),
      loadBrokerMetricSnapshot(authorityId),
      loadBrokerCareerClaims(authorityId),
      loadBrokerCredentialRecord(authorityId),
    ]);
  // RA 9646: a PRC licence lapses after three years, so the badge and the
  // structured-data claim both depend on its expiry, not on a one-time tick.
  const credential = buildBrokerCredential({ identity, record: credentialRecord });
  const scoutItRecord = buildScoutItRecord({ lookup: metricLookup });
  // Built from its own lookup, with no reference to the snapshot above. The two
  // templates share no input (A-023: never merged in storage, projection or UI).
  const careerHistory = buildCareerHistorySection({ authorityId, lookup: careerLookup });
  const recommendations = buildRecommendationSection({
    authorityId,
    lookup: recommendationLookup,
  });
  const contributions = buildContributionSection({
    authorityId,
    lookup: contributionLookup,
  });

  const jsonLd = buildBrokerDossierJsonLd({ identity, credential });

  return (
    <div className="page-wrapper">
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: escapeJsonLd(JSON.stringify(jsonLd)) }}
        />
      )}
      <Header />

      <main className="broker-detail-main">
        <BrokerDossierIdentity identity={identity} record={scoutItRecord} credential={credential} />

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

        {/* Secondary template. A-023 requires the ScoutIt Record (rendered in
            the identity block above) to always precede Career History. */}
        <BrokerCareerHistory section={careerHistory} />

        <BrokerRecommendations section={recommendations} />

        <BrokerContributions section={contributions} />

        {/* Connection Form Component (Client Side) */}
        <section className="portal-section">
          <ConnectionPortal brokerName={identity.name} brokerId={identity.id} />
        </section>


      </main>
      <Footer />

    </div>
  );
}
