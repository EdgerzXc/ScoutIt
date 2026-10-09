import { notFound, permanentRedirect } from "next/navigation";
import Link from "next/link";
import AtmosphereBackground from "@/components/ui/AtmosphereBackground";
import PositionZeroContactCard from "@/components/property/PositionZeroContactCard";

import { siteUrl } from "@/lib/siteUrl";
import { extractFacts } from "@/lib/shareBriefing";
import { buildPropertyJsonLd, mergeFaqIntoOverride } from "@/lib/propertySchema";
import { escapeJsonLd } from "@/lib/jsonLdScript";
import { getAnsweredFaqs } from "@/lib/faqServer";
import ResidentialFlow from "@/components/property/ResidentialFlow";
import CommercialFlow from "@/components/property/CommercialFlow";
import ClaimPropertyPanel from "@/components/property/ClaimPropertyPanel";
import PropertyViewTracker from "@/components/analytics/PropertyViewTracker";
import ViaTelemetryTracker from "@/components/property/ViaTelemetryTracker";

import { getCmsBundle } from "@/lib/cmsCache";
import { stripPremiumFields } from "@/lib/premiumFields";
import { getHistoricalPropertyRedirect } from "@/lib/propertyRedirects";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { VIA_STATUS } from "@/lib/viaRouting";

export const revalidate = 3600;

const CATEGORY_TO_LAYOUT_MAP = {
  residential: ResidentialFlow,
  commercial: CommercialFlow,
  str: CommercialFlow,
  hospitality: CommercialFlow,
  restaurants: CommercialFlow,
  venues: CommercialFlow,
  default: ResidentialFlow,
};

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  let seoTitle = `Property Intel — ${resolvedParams.id} — ScoutIt`;
  let seoDescription = "Property Intelligence Vector";
  let imageUrl = siteUrl("/api/og");
  let canonicalUrl = siteUrl(`/property/${resolvedParams.id}`);

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

      seoTitle = match.seo_title || `${title} | ${sqm ? sqm + " sqm " : ""}${cat}`;
      seoDescription =
        match.seo_description ||
        `A premium architectural asset in ${match.location || "the Philippines"}. Explore the full market briefing on ScoutIt.`;

      const photo = Array.isArray(match.photos) ? match.photos.find(Boolean) : match.photo || match.image;
      const ogParams = new URLSearchParams();
      ogParams.set("title", title);
      ogParams.set("category", cat);
      if (sqm) ogParams.set("sqm", sqm);
      if (photo) ogParams.set("image", photo);

      imageUrl = siteUrl(`/api/og?${ogParams.toString()}`);
      if (match.slug) canonicalUrl = siteUrl(`/property/${match.slug}`);
    }
  } catch {}

  return {
    title: seoTitle,
    description: seoDescription,
    // MANDATORY VIA SEO RULE (Section 10 & Technical Review):
    // The canonical tag MUST point strictly back to the root property page (/property/[slug]).
    // Search engines must never index individual broker VIA permutations as duplicate content.
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title: seoTitle,
      description: seoDescription,
      url: canonicalUrl,
      siteName: "ScoutIt",
      images: [{ url: imageUrl, width: 1200, height: 630, alt: seoTitle }],
      locale: "en_US",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: seoTitle,
      description: seoDescription,
      images: [imageUrl],
    },
  };
}

export default async function ViaPropertyRoute({ params }) {
  const resolvedParams = await params;
  const { id: propertyParam, contactSlug } = resolvedParams;

  let match = null;
  let articles = [];
  let cmsUnavailable = false;

  try {
    const bundle = await getCmsBundle();
    const properties = bundle?.properties || [];
    articles = bundle?.intel || [];
    if (bundle?.source && (bundle.source.includes("empty_fallback") || bundle.source.includes("error"))) {
      if (properties.length === 0) {
        cmsUnavailable = true;
      }
    }
    match = properties.find(
      (p) =>
        (p.slug && p.slug.toLowerCase() === propertyParam.toLowerCase()) ||
        (p.id && p.id === propertyParam)
    );
  } catch {
    cmsUnavailable = true;
  }

  if (!match) {
    const redirectSlug = await getHistoricalPropertyRedirect(propertyParam);
    if (redirectSlug) permanentRedirect(`/property/${redirectSlug}/via/${contactSlug}`);

    if (cmsUnavailable) {
      return (
        <main className="relative min-h-screen bg-background text-text-primary flex items-center justify-center px-6">
          <AtmosphereBackground variant="stratosphere" />
          <div className="relative z-10 max-w-md text-center p-8 rounded-2xl bg-surface/60 backdrop-blur-xl border border-white/10 shadow-2xl">
            <p className="font-label-caps text-[12px] uppercase tracking-widest text-gold-accent mb-2">
              Signal Interrupted
            </p>
            <h1 className="font-headline-editorial text-2xl md:text-3xl text-on-surface mb-3">
              Space Registry Refreshing
            </h1>
            <p className="text-text-secondary text-sm leading-relaxed mb-6">
              Connection to the public property registry is temporarily updating.
            </p>
            <Link
              href={`/property/${encodeURIComponent(propertyParam)}`}
              className="bg-gold-accent hover:bg-gold-bright text-background font-working-title text-sm font-bold px-6 py-3 rounded-full transition-all duration-300"
            >
              Reload Dossier
            </Link>
          </div>
        </main>
      );
    }

    notFound();
  }

  // Resolve promoter details server-side
  let promoter = null;
  let viaStatus = VIA_STATUS.VALID;

  if (supabaseAdmin && contactSlug) {
    // Look up user profile matching slug or ID
    const { data: profile } = await supabaseAdmin
      .from("user_profiles")
      .select("id, display_name, avatar_url, headline, firm, is_profile_public")
      .or(`display_name.ilike.%${contactSlug.replace(/-/g, " ")}%,id.eq.${contactSlug}`)
      .maybeSingle();

    if (profile) {
      promoter = profile;
    } else {
      promoter = {
        id: contactSlug,
        display_name: contactSlug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      };
    }
  } else if (contactSlug) {
    promoter = {
      id: contactSlug,
      display_name: contactSlug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    };
  }

  const rawCat = match ? (match.spaceCategory || match.property_type || "default").toLowerCase() : "default";
  let layoutKey = "default";
  for (const key of Object.keys(CATEGORY_TO_LAYOUT_MAP)) {
    if (rawCat.includes(key)) {
      layoutKey = key;
      break;
    }
  }

  const InjectedLayout = CATEGORY_TO_LAYOUT_MAP[layoutKey] || CATEGORY_TO_LAYOUT_MAP["default"];

  let jsonLd = null;
  if (match && !match.is_sample) {
    const canonicalUrl = siteUrl(`/property/${match.slug || propertyParam}`);
    const faqs = await getAnsweredFaqs(match.slug || propertyParam);
    jsonLd = match.seo_json_ld
      ? mergeFaqIntoOverride(match.seo_json_ld, faqs, canonicalUrl)
      : buildPropertyJsonLd(match, propertyParam, faqs);
  }

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: escapeJsonLd(jsonLd) }}
        />
      )}
      <article className="chameleon-content-wrapper">
        {/* VIA POSITION ZERO BANNER */}
        <div className="pt-24 px-4 sm:px-6 max-w-7xl mx-auto">
          <PositionZeroContactCard
            propertySlug={match.slug || propertyParam}
            promoter={promoter}
            viaStatus={viaStatus}
          />
        </div>

        <InjectedLayout
          slug={propertyParam}
          initialData={match ? stripPremiumFields(match, "starry") : null}
          articles={articles}
        />

        <div className="claim-panel-slot">
          <ClaimPropertyPanel propertyId={propertyParam} />
        </div>

        <PropertyViewTracker propertySlug={propertyParam} />
        <ViaTelemetryTracker propertySlug={propertyParam} promoterSlug={contactSlug} />
      </article>
    </>
  );
}
