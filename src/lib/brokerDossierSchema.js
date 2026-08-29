// ═══════════════════════════════════════════════════════════════
// A-023 phase 6 — structured data and robots policy for the broker dossier.
//
// Two claims are deliberately withheld here, both of which a naive schema
// would emit by default:
//
//  1. `RealEstateAgent`. The site-wide schema asserted this type until
//     2026-08-08 and it contradicted /terms, which states ScoutIt is strictly
//     not a real estate broker under RA 9646. A *broker* on the platform may
//     genuinely hold that type — but only once staff have verified the PRC
//     licence. Unverified brokers are described as `Person`, and their licence
//     number is not published at all.
//
//  2. `aggregateRating`. Google renders it as stars in the result. A-023
//     forbids shipping a star average, so emitting one here would put stars in
//     search results that the page itself refuses to display — the same
//     "told humans one thing, told Google another" failure as above.
//
// Example profiles produce no structured data and are non-indexable: a
// machine-readable claim about an invented advisor is worse than no claim.
// ═══════════════════════════════════════════════════════════════

import { siteUrl } from "@/lib/siteUrl";

const text = (value) => String(value ?? "").trim();

/**
 * Robots policy for one dossier.
 *
 * Returns `undefined` for a real profile so Next's default (indexable) applies,
 * and an explicit noindex for an example profile. `follow` stays true so the
 * links out of the page are still crawled.
 */
export function brokerDossierRobots(identity) {
  if (identity?.isExample === true) return { index: false, follow: true };
  return undefined;
}

/**
 * Build the dossier's JSON-LD, or null when nothing may honestly be asserted.
 */
export function buildBrokerDossierJsonLd({ identity, credential = null } = {}) {
  if (!identity) return null;
  // No structured data for an invented advisor.
  if (identity.isExample === true) return null;

  const id = text(identity.id);
  const name = text(identity.name);
  if (!id || !name) return null;

  const url = siteUrl(`/brokers/${id}`);
  // RA 9646: `licenseVerified` alone is a one-time staff tick. A PRC licence
  // expires after three years, so the licensed type and the credential block
  // require the licence to be CURRENT — otherwise this asserts, in
  // machine-readable form, that someone holds a licence that has lapsed.
  const verified = credential?.canAssertLicensedProfession === true;

  const schema = {
    "@context": "https://schema.org",
    "@type": verified ? "RealEstateAgent" : "Person",
    "@id": `${url}#advisor`,
    name,
    url,
    mainEntityOfPage: url,
    // The platform is the publisher; the advisor is a third party who
    // transacts off-platform. `worksFor` would assert employment that does
    // not exist, so the relationship is left unstated.
    knowsAbout: [identity.specialty, identity.title].map(text).filter(Boolean),
  };

  if (text(identity.bio)) schema.description = text(identity.bio);
  if (text(identity.image)) schema.image = text(identity.image);
  if (text(identity.title)) schema.jobTitle = text(identity.title);
  if (text(identity.location)) {
    schema.areaServed = { "@type": "Place", name: text(identity.location) };
  }

  // The licence number is evidence of a verified credential. Publishing it
  // for an unverified broker would lend the number authority it has not earned.
  if (verified && text(identity.license)) {
    schema.hasCredential = {
      "@type": "EducationalOccupationalCredential",
      credentialCategory: "Professional License",
      identifier: text(identity.license),
      recognizedBy: {
        "@type": "Organization",
        name: "Professional Regulation Commission",
      },
    };
  }

  return schema;
}
