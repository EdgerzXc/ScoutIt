import { siteUrl } from "@/lib/siteUrl";

export default function JsonLd() {
  const url = siteUrl();

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "RealEstateAgent",
    "@id": `${url}/#organization`,
    name: "ScoutIt",
    legalName: "ScoutIt Space Intelligence Platform",
    url: url,
    logo: `${url}/assets/scoutit_logo.png`,
    description: "ScoutIt transforms Philippine commercial and residential real estate into intelligent property briefings.",
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
    sameAs: [
      "https://twitter.com/scoutit",
      "https://facebook.com/scoutit.ph",
      "https://linkedin.com/company/scoutit",
    ],
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${url}/#website`,
    url: url,
    name: "ScoutIt",
    description: "Intelligent Property Briefings & Real Estate Directory Philippines",
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
