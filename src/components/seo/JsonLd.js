import { siteUrl } from "@/lib/siteUrl";

// ═══════════════════════════════════════════════════════════════
// SITE-WIDE STRUCTURED DATA — the entity signal
//
// This file is how a search engine decides WHAT SCOUTIT IS. It matters more
// than usual here for two reasons:
//
//   1. scoutit.space is already indexed (Aug 2026), so these values are being
//      read on every crawl. Getting them wrong is not a future problem.
//   2. "ScoutIt" is a CONTESTED brand name — there is a Scoutit in India with a
//      longer history and its own LinkedIn presence, plus an EV-battery ScoutIt
//      and several older Scout/ScoutIt entities. Disambiguation happens here,
//      not by repeating the word more often on the page.
// ═══════════════════════════════════════════════════════════════

export default function JsonLd() {
  const url = siteUrl();

  const organizationSchema = {
    "@context": "https://schema.org",

    // ⚠️ WAS "RealEstateAgent" until 2026-08-08. That directly contradicted
    // /terms, which states ScoutIt is "deliberately and strictly NOT a real
    // estate broker, real estate salesperson, real estate appraiser, real
    // estate consultant, or real estate dealer under Republic Act No. 9646."
    //
    // So the site told humans one thing in its Terms and told Google the
    // opposite in machine-readable structured data. RESA is a licensing statute;
    // asserting an unlicensed brokerage type is the kind of claim that is
    // expensive precisely because it was never deliberate.
    //
    // "Organization" is the honest parent type. ScoutIt is an intelligence and
    // software platform; the licensed practitioners are third parties who
    // transact entirely off-platform.
    "@type": "Organization",
    "@id": `${url}/#organization`,
    name: "ScoutIt",
    legalName: "ScoutIt Space Intelligence Platform",

    // Disambiguation fields. "Philippines" does more work than "ScoutIt" does —
    // it separates this entity from India, from the EV battery, and from
    // aerospace/satellite "space intelligence" in a single word.
    alternateName: ["ScoutIt Philippines", "ScoutIt Space Intelligence"],
    url: url,
    logo: `${url}/assets/scoutit_logo.png`,

    // Matches the positioning already landing in the index, rather than the
    // earlier "real estate directory" framing that /about explicitly rejects.
    description:
      "ScoutIt is the Philippines' first spatial commerce platform. It turns every kind of space into clear, verified intelligence: homes, offices, venues and restaurants.",
    knowsAbout: [
      "Spatial commerce",
      "Property intelligence",
      "Space intelligence",
      "Philippine real estate data",
      "Commercial and residential space analysis",
    ],
    address: {
      "@type": "PostalAddress",
      addressLocality: "Taguig",
      addressRegion: "Metro Manila",
      addressCountry: "PH",
    },
    areaServed: {
      "@type": "Country",
      name: "Philippines",
    },

    // ⚠️ `sameAs` REMOVED 2026-08-08 — deliberately, and it must stay empty
    // until each URL is verified.
    //
    // It previously listed twitter.com/scoutit, facebook.com/scoutit.ph and
    // linkedin.com/company/scoutit. `sameAs` is an assertion that those profiles
    // ARE THIS ENTITY. Given a competing Scoutit with its own LinkedIn company
    // page, an unverified entry risks telling Google that ScoutIt Philippines
    // and that company are the same organisation — the exact opposite of what a
    // contested brand name needs.
    //
    // An absent `sameAs` costs nothing. A wrong one merges your entity with
    // someone else's. Add them back one at a time, only after confirming the
    // account is ours. See ACTION/02_YOURS.md Y8.
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${url}/#website`,
    url: url,
    name: "ScoutIt",
    // Was "Intelligent Property Briefings & Real Estate Directory Philippines".
    // "Real Estate Directory" is the exact category /about says ScoutIt is not.
    description:
      "Property and space intelligence for the Philippines — verified briefings on homes, offices, venues and restaurants.",
    inLanguage: "en-PH",
    publisher: {
      "@id": `${url}/#organization`,
    },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${url}/discover?search={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
    </>
  );
}
