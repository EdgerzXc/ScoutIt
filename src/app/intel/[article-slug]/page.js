import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getArticleBySlug, getArticles } from "@/data/mock/mockArticles";
import { fetchIntel } from "@/lib/airtable";
import { siteUrl } from "@/lib/siteUrl";
import { parseArticleBlocks, blocksFromLegacy } from "@/lib/articleSchema";
import ArticleBlocks from "@/components/intel/ArticleBlocks";
import InvestigationDossier from "@/components/intel/InvestigationDossier";
import ActiveDetourHud from "@/components/intel/ActiveDetourHud";
import FulfilmentTerminal from "@/components/intel/FulfilmentTerminal";
import { getInvestigation } from "@/data/mock/investigations";
import GlassPanel from "@/components/ui/GlassPanel";
import HoverCard from "@/components/ui/HoverCard";
import SampleIntelDisclosure from "@/components/intel/SampleIntelDisclosure";
import "./article-detail.css";

async function getLiveArticle(slug) {
  const apiKey = process.env.AIRTABLE_API_KEY;
  const baseId = process.env.AIRTABLE_BASE_ID;
  
  if (apiKey && baseId) {
    try {
      const airtableArticles = await fetchIntel(apiKey, baseId);
      const matched = airtableArticles.find(a => a.slug === slug);
      if (matched) {
        let category = matched.category || "Residential";
        if (category.toLowerCase() === "hospitality") category = "Hospitality";
        if (category.toLowerCase() === "culinary") category = "Culinary";
        return {
          ...matched,
          category,
          isSample: false
        };
      }
    } catch (e) {
      console.error("Failed to load article from Airtable:", e);
    }
  }
  // Fall back to the editorial mock set — the same articles the homepage and
  // intel hub link to, so those links always resolve instead of 404ing.
  return getArticleBySlug(slug);
}

async function getLiveRelated(slug) {
  const apiKey = process.env.AIRTABLE_API_KEY;
  const baseId = process.env.AIRTABLE_BASE_ID;
  
  const baseArticles = [...getArticles()];
  
  if (apiKey && baseId) {
    try {
      const airtableArticles = await fetchIntel(apiKey, baseId);
      airtableArticles.forEach(item => {
        if (!baseArticles.some(x => x.slug === item.slug)) {
          let category = item.category || "Residential";
          if (category.toLowerCase() === "hospitality") category = "Hospitality";
          if (category.toLowerCase() === "culinary") category = "Culinary";
          
          baseArticles.unshift({
            slug: item.slug || item.id,
            title: item.title,
            category,
            date: item.date || "Just Now",
            excerpt: item.excerpt || "",
            image: item.image || ""
          });
        }
      });
    } catch (e) {
      console.error("Failed to load related articles from Airtable:", e);
    }
  }
  
  return baseArticles
    .filter(art => art.slug !== slug)
    .slice(0, 3);
}

export async function generateMetadata({ params }) {
  const { "article-slug": slug } = await params;
  const article = await getLiveArticle(slug);
  const isSample = article ? Boolean(article.isSample) : false;
  return {
    title: article ? `${article.title} &middot; Intel Briefing` : "Intel Briefing",
    description: article ? article.lead : "Real estate news and intelligence.",
    // Without this the article inherits `canonical: "/intel"` from
    // src/app/intel/layout.js, which tells Google to index the hub instead.
    alternates: { canonical: siteUrl(`/intel/${slug}`) },
    ...(isSample ? { robots: { index: false, follow: true } } : {}),
  };
}

export default async function IntelArticlePage({ params, searchParams }) {
  const { "article-slug": slug } = await params;

  /* ── THE DETOUR ────────────────────────────────────────────────────
     A reader can arrive here two ways: browsing Intel, or through a door
     on a property page ("how does this ordinance affect my building?").
     The second is a round trip — it has to end by putting them back where
     they started, on Chapter 10 "Your Move", with a verdict.

     `fromProperty` is what distinguishes the two. Without it this is just
     an article and both the HUD and the terminal render nothing. */
  const sp = (await searchParams) || {};
  const fromProperty = typeof sp.fromProperty === "string" && sp.fromProperty
    ? sp.fromProperty
    : null;
  const door = typeof sp.door === "string" ? sp.door : null;
  const article = await getLiveArticle(slug);

  if (!article) {
    notFound();
  }

  const related = await getLiveRelated(slug);

  // The chaptered dossier used to live on the Stratosphere layer page. It
  // belongs here: the reader has already chosen this story. Articles
  // without a dossier simply render without the section.
  const dossier = getInvestigation(slug);

  return (
    <div className="page-wrapper">
      <Header />
      
      {fromProperty ? (
        <ActiveDetourHud
          fromProperty={fromProperty}
          propertyTitle={null}
          door={door}
          relationReason={dossier?.impactRadius || null}
        />
      ) : null}

      <main className="article-main">
        {/* Dynamic Hero Banner */}
        <section className="article-hero" style={{ backgroundImage: `url(${article.image})` }}>
          <div className="hero-overlay"></div>
          <div className="hero-content">
            {article.isSample ? <SampleIntelDisclosure /> : null}
            <div className="flex items-center gap-3 mb-3">
              <span className="article-category-tag" style={{ margin: 0 }}>{article.category}</span>
              {article.city ? (
                <span className="font-mono text-[12px] text-text-secondary border border-surface-variant/80 px-2 py-0.5 rounded-xs uppercase bg-black/40 backdrop-blur-sm">
                  📍 {article.city}
                </span>
              ) : null}
            </div>
            <h1 className="article-title">{article.title}</h1>
            <span className="article-date-tag">{article.date}</span>
          </div>
        </section>

        {/* Article Body */}
        <section className="article-body-container">
          <div className="article-content-wrapper">
            {article.isSample ? (
              <GlassPanel className="p-4 mb-8 border-l-2 border-l-gold-accent bg-gold-accent/5">
                <SampleIntelDisclosure />
                <p className="font-serif text-sm text-text-secondary m-0">
                  This illustrative briefing is retained so invited testers can evaluate the full Intel experience. It is not a live market report.
                </p>
              </GlassPanel>
            ) : null}
            {/* Insight disclaimer banner */}
            {["INSIGHT", "Insight"].includes(article.category) || ["INSIGHT", "Insight"].includes(article.intelType) || ["INSIGHT", "Insight"].includes(article.type) ? (
              <GlassPanel className="p-4 mb-8 border-l-2 border-l-gold-accent bg-gold-accent/5">
                <span className="font-mono text-[12px] text-gold-accent tracking-[0.12em] uppercase block mb-1">ScoutIt Insight</span>
                <p className="font-serif text-sm text-text-secondary m-0">This is a ScoutIt Insight — a projection based on available data, not a verified fact.</p>
              </GlassPanel>
            ) : null}
            {article.lead ? <p className="article-lead-text">{article.lead}</p> : null}

            {/* Universal block body — every article (legacy or uploaded) renders
                through the same ArticleBlocks reader. */}
            <div className="article-paragraphs">
              <ArticleBlocks blocks={parseArticleBlocks(article.bodyJson) || blocksFromLegacy(article)} />
            </div>

            {/* Advisory Note */}
            {article.recommendation ? (
              <GlassPanel className="p-6 mt-12 bg-surface-alt border-surface-variant">
                <span className="font-mono text-[12px] text-gold-accent tracking-[0.12em] uppercase block mb-3">SCOUTIT BRIEFING RECOMMENDATION</span>
                <p className="font-serif text-sm text-text-primary leading-relaxed m-0">{article.recommendation}</p>
              </GlassPanel>
            ) : null}

            {/* OSINT Source & Provenance Card */}
            {article.sourceName ? (
              <GlassPanel className="p-6 mt-6 bg-surface-alt/70 border border-surface-variant">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div>
                    <span className="font-mono text-[12px] text-gold-accent tracking-[0.12em] uppercase block mb-1">OSINT SOURCE & PROVENANCE</span>
                    <p className="font-sans text-xs text-text-secondary m-0">Synthesized from primary filing &bull; <strong className="text-text-primary">{article.sourceName}</strong></p>
                  </div>
                  {article.sourceUrl ? (
                    <a href={article.sourceUrl} target="_blank" rel="noopener noreferrer" className="font-mono text-[12px] text-gold-accent hover:underline flex items-center gap-1.5 no-underline border border-gold-accent/30 px-3 py-1.5 rounded-sm hover:bg-gold-accent/10 transition-colors">
                      <span>View Source Gazette</span>
                      <span>↗</span>
                    </a>
                  ) : null}
                </div>
              </GlassPanel>
            ) : null}

            {/* Bi-Directional Discovery Gateway */}
            <GlassPanel className="p-6 mt-10 bg-surface-alt/90 border border-gold-accent/30 rounded-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-gold-accent/5 rounded-full blur-3xl pointer-events-none" />
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
                <div>
                  <span className="font-mono text-[12px] text-gold-accent tracking-[0.12em] uppercase block mb-1">
                    APPLY THIS INTELLIGENCE
                  </span>
                  <h4 className="font-serif text-lg text-text-primary mb-1">
                    Explore spaces connected to this briefing
                  </h4>
                  <p className="font-sans text-xs text-text-secondary m-0 max-w-md">
                    {article.city
                      ? `Discover verified listings, developments, and opportunities across ${article.city}.`
                      : `View verified properties matching the ${article.category || 'market'} intelligence profile.`}
                  </p>
                </div>
                <Link
                  href={article.city ? `/property?q=${encodeURIComponent(article.city)}` : `/property?type=${encodeURIComponent(article.category || 'Commercial')}`}
                  className="font-mono text-[12px] tracking-wider uppercase font-semibold text-background bg-gold-accent hover:opacity-90 px-5 py-3 rounded transition-all active:scale-95 text-center shrink-0 shadow-[0_0_15px_rgba(232,174,60,0.25)]"
                >
                  Explore Affected Spaces →
                </Link>
              </div>
            </GlassPanel>
          </div>
        </section>

        {dossier ? <InvestigationDossier dossier={dossier} /> : null}

        {fromProperty && dossier ? (
          <FulfilmentTerminal
            signal={dossier}
            fromProperty={fromProperty}
            originPropertyTitle={null}
            affectedSpaces={dossier.affectedSpaces || []}
          />
        ) : null}

        {/* Related Briefings Section */}
        <section className="related-section">
          <h3 className="related-title">Related Briefings</h3>
          <div className="related-grid">
            {related.map((rel) => (
              <Link href={`/intel/${rel.slug}`} key={rel.slug} style={{textDecoration: 'none'}}>
                <HoverCard className="related-card flex flex-col h-full bg-surface-alt border border-surface-variant overflow-hidden">
                  <div className="related-img-wrap" style={{ backgroundImage: `url(${rel.image})` }}></div>
                  <div className="related-card-body">
                    <span className="related-cat">{rel.category}</span>
                    <h4>{rel.title}</h4>
                    <span className="related-link text-gold-accent mt-4 inline-block font-serif">Read Analysis →</span>
                  </div>
                </HoverCard>
              </Link>
            ))}
          </div>
        </section>
      </main>
      <Footer />

    </div>
  );
}
