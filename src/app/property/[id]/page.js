// Case-sensitivity routing diagnostics trigger and async params fix
import { notFound, redirect } from "next/navigation";

import { fetchProperties } from "@/lib/airtable";
import { siteUrl } from "@/lib/siteUrl";
import { extractFacts } from "@/lib/shareBriefing";
import { buildPropertyJsonLd, mergeFaqIntoOverride } from "@/lib/propertySchema";
import { getAnsweredFaqs } from "@/lib/faqServer";
import ResidentialFlow from "@/components/property/ResidentialFlow";
import CommercialFlow from "@/components/property/CommercialFlow";

// ----------------------------------------------------------------------
// INCREMENTAL STATIC REGENERATION (ISR)
// ----------------------------------------------------------------------
import { getCmsBundle } from "@/lib/cmsCache";
import { stripPremiumFields } from "@/lib/premiumFields";
import { getHistoricalPropertyRedirect } from "@/lib/propertyRedirects";

export const revalidate = 3600; 

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  let seoTitle = `Property Intel — ${resolvedParams.id} — ScoutIt`;
  let seoDescription = "Property Intelligence Vector";
  let imageUrl = siteUrl("/og-default.jpg");
  let url = siteUrl(`/property/${resolvedParams.id}`);

  try {
    const bundle = await getCmsBundle();
    const properties = bundle.properties || [];
    const match = properties.find(
      (p) =>
        (p.slug && p.slug.toLowerCase() === resolvedParams.id.toLowerCase()) ||
        (p.id && p.id === resolvedParams.id)
    );
    if (match) {
      const facts = extractFacts(match);
      const title = facts.title;
      const cat = facts.category;
      const sqm = facts.sqm;

      if (match.seo_title) seoTitle = match.seo_title;
      else seoTitle = `${title} | ${sqm ? sqm + ' sqm ' : ''}${cat}`;
      
      if (match.seo_description) seoDescription = match.seo_description;
      else seoDescription = `A premium architectural asset in ${match.location || "the Philippines"}. Explore the full market briefing and operational context on ScoutIt.`;

      // Find the highest resolution photo (usually the first one)
      const photo = Array.isArray(match.photos) ? match.photos.find(Boolean) : (match.photo || match.image);
      
      const ogParams = new URLSearchParams();
      ogParams.set('title', title);
      ogParams.set('category', cat);
      if (sqm) ogParams.set('sqm', sqm);
      if (photo) ogParams.set('image', photo);

      imageUrl = siteUrl(`/api/og?${ogParams.toString()}`);

      if (match.slug) url = siteUrl(`/property/${match.slug}`);
    }
  } catch {}

  return {
    title: seoTitle,
    description: seoDescription,
    // Without this, the page inherits `alternates.canonical: "/property"` from
    // src/app/property/layout.js — every listing was telling Google that the
    // directory index is its canonical URL, i.e. "don't index me".
    alternates: { canonical: url },
    openGraph: {
      title: seoTitle,
      description: seoDescription,
      url: url,
      siteName: 'ScoutIt',
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: seoTitle,
        },
      ],
      locale: 'en_US',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: seoTitle,
      description: seoDescription,
      images: [imageUrl],
    },
  };
}

// ----------------------------------------------------------------------
// MAP, DON'T MATCH: Strict Configuration Object
// ----------------------------------------------------------------------
const CATEGORY_TO_LAYOUT_MAP = {
  "residential": ResidentialFlow,
  "commercial": CommercialFlow,
  "str": CommercialFlow,           // Hospitality acts like commercial flow for now
  "hospitality": CommercialFlow,
  "restaurants": CommercialFlow,
  "venues": CommercialFlow,
  "default": ResidentialFlow
};

export default async function PropertyRoute({ params }) {
  const resolvedParams = await params;
  let match = null;

  try {
    const bundle = await getCmsBundle();
    const properties = bundle.properties || [];
    match = properties.find(
      (p) =>
        (p.slug && p.slug.toLowerCase() === resolvedParams.id.toLowerCase()) ||
        (p.id && p.id === resolvedParams.id)
    );
  } catch {}

  if (!match) {
    const redirectSlug = await getHistoricalPropertyRedirect(resolvedParams.id);
    if (redirectSlug) redirect(`/property/${redirectSlug}`);
    notFound();
  }

  const rawCat = match ? (match.spaceCategory || match.property_type || "default").toLowerCase() : "default";
  // Find mapped layout or fallback to default
  let layoutKey = "default";
  for (const key of Object.keys(CATEGORY_TO_LAYOUT_MAP)) {
    if (rawCat.includes(key)) {
      layoutKey = key;
      break;
    }
  }

  // The Chameleon Injection
  const InjectedLayout = CATEGORY_TO_LAYOUT_MAP[layoutKey] || CATEGORY_TO_LAYOUT_MAP["default"];

  // ── Structured data (NEW_IDEAS.md §1) ────────────────────────────────
  // Read straight from Supabase rather than our own /api/faqs route: the
  // page is statically generated with ISR, and fetching from ourselves at
  // build time breaks static generation. Best-effort — a Supabase outage
  // costs us the FAQPage node, not the page.
  let jsonLd = null;
  if (match) {
    const canonicalUrl = siteUrl(`/property/${match.slug || resolvedParams.id}`);
    const faqs = await getAnsweredFaqs(match.slug || resolvedParams.id);

    jsonLd = match.seo_json_ld
      // A hand-written override still gets the FAQ rich-result eligibility
      // the owner earned by answering questions.
      ? mergeFaqIntoOverride(match.seo_json_ld, faqs, canonicalUrl)
      : buildPropertyJsonLd(match, resolvedParams.id, faqs);
  }

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLd }}
        />
      )}
      <article className="chameleon-content-wrapper">
        {/*
          `match` is already resolved above for metadata and JSON-LD. Passing it
          down as initialData lets the flow render real content during SSR
          instead of shipping a "LOADING SPACE INTELLIGENCE…" spinner and waiting
          on a client-side /api/cms round-trip — which is what was pushing LCP
          past 7s on mobile. The flow still revalidates in the background.
        */}
        {/* §25.1 / §45 — premium fields are STRIPPED from this payload.
            This page is ISR: one document serves every visitor, so there is
            no session here to check a tier against. Previously the full deep
            intel, vault URLs and enhanced photos were serialised into the
            payload for everyone, and the UI merely hid them behind a
            localStorage tier — readable from "view source" without even
            running JavaScript.
            Entitled users now fetch the real values from
            /api/property/premium, which resolves their tier server-side.
            `lockedFeatures` / `premiumAvailable` still ride along so the
            teaser can advertise what this listing genuinely has. */}
        <InjectedLayout
          slug={resolvedParams.id}
          initialData={match ? stripPremiumFields(match, "starry") : null}
        />
      </article>
    </>
  );
}
