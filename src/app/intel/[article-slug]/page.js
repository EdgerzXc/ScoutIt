import Header from "@/components/Header";
import Link from "next/link";
import { notFound } from "next/navigation";

const ARTICLE_DB = {
  "bgc-spatial-movement": {
    title: "BGC Spatial Movement",
    category: "Residential",
    date: "June 2026",
    image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&q=80",
    lead: "Bonifacio Global City's central core is witnessing a rapid structural migration. High-net-worth capital is shifting away from dense skyscrapers toward boutique, low-density modernist villas.",
    body: [
      "As structural requirements for urban living undergo a dramatic realignment, BGC's premier residential sectors are experiencing unprecedented demand. Modern tropical designs, characterized by double-glazed glass enclosures, natural cross-ventilation, and private pocket gardens, have emerged as the absolute standard for low-density luxury.",
      "Voters of private capital are increasingly targeting low-rise properties that offer acoustic isolation and spatial control. This migration is not merely a lifestyle adjustment; it is a long-term capital placement strategy focused on assets that retain value through architectural distinction and location-based density limits.",
      "According to ScoutIt transaction registries, the average listing-to-contract duration for properties featuring private spatial buffers has compressed by over 40% in the last quarter, signaling an urgent, highly concentrated acquisition wave."
    ],
    recommendation: "Target properties in BGC Core that offer private outdoor space, cross-ventilation designs, and low-density layouts (e.g., fewer than 4 units per floor plate)."
  },
  "return-of-quiet-luxury": {
    title: "The Return of Quiet Luxury",
    category: "Residential",
    date: "May 2026",
    image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200&q=80",
    lead: "A quiet, highly private revolution is reshaping Quezon City's elite residential market. Flashy suburban estates are being bypassed in favor of architecturally hidden residences.",
    body: [
      "In Quezon City's traditional luxury pockets, developers are responding to a subtle yet powerful demand shift. Buyers are no longer interested in massive, visible facades. Instead, they seek 'invisible luxury'—structures that blend seamlessly with their natural surroundings, offering complete privacy from the street while presenting spectacular spatial volume internally.",
      "These properties prioritize high-quality raw materials—reclaimed hardwoods, exposed structural concrete, and matte bronze fixtures—over ornate decorations. The focus is on natural light manipulation, double-height ceilings, and interior courtyards that serve as private sanctuaries.",
      "ScoutIt market analysts track a growing roster of transactions executed entirely off-market, highlighting the premium placed on absolute privacy and discretion in this sector."
    ],
    recommendation: "Prioritize New Manila and Batasan Hills off-market curations that feature high perimeter wall integration and inward-facing courtyard architecture."
  },
  "green-office-demand": {
    title: "Green Office Demand",
    category: "Commercial",
    date: "June 2026",
    image: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&q=80",
    lead: "Global multinational corporations are forcing a design evolution in Manila's business districts. Non-compliant commercial properties are experiencing rapid capital flight.",
    body: [
      "Tenant mandates have shifted permanently toward carbon-neutral, LEED-certified environments. Major international conglomerates operating in Makati and BGC now enforce strict green requirements for all future leases, leaving traditional high-rise buildings with rising vacancies.",
      "Developers are scrambling to retrofit older glass structures with low-emissivity glazing, smart energy grids, and water reclamation systems. New developments, however, are building eco-corporate DNA directly into their layout, using double-skin facades that reduce air conditioning reliance and rain harvesting systems that power entire cooling towers.",
      "ScoutIt research reveals premium grade-A properties that hold LEED Platinum credentials are capturing rental premiums of up to 25% over non-certified assets in the same district, proving sustainability is now directly tied to investment yield."
    ],
    recommendation: "Acquire or lease office spaces that hold at least LEED Gold certifications and verify local utility integration (e.g. graywater recycling pipelines)."
  },
  "bgc-commercial-corridors": {
    title: "BGC Commercial Corridors",
    category: "Commercial",
    date: "April 2026",
    image: "https://images.unsplash.com/photo-1582653291997-079a1c04e5d1?w=1200&q=80",
    lead: "High-density retail environments are giving way to open-air sky parks. The evolution of BGC's commercial plazas points toward integrated, design-first urban gardens.",
    body: [
      "Traditional commercial layouts are being remodeled to meet a consumer demand for wellness and space. Plazas and high-density shopping structures are integrating massive, glass-domed green zones, open-air pedestrian avenues, and micro-climate gardens that actively cool the surroundings.",
      "This shift is changing how commercial properties are valued. Ground-floor frontage, once the absolute standard for premium rents, is now sharing value with upper-level 'garden zones' that host premier culinary and social spaces in open-air settings.",
      "Transaction structures for commercial space are reflecting this design change, with brands prioritizing layouts that offer outdoor seating, natural ventilation, and direct green-corridor connectivity."
    ],
    recommendation: "Prioritize acquisitions in mixed-use commercial developments that feature rooftop green integration and a ratio of at least 20% dedicated green open space."
  },
  "surf-front-land-rush": {
    title: "Surf-Front Land Rush",
    category: "Hospitality",
    date: "June 2026",
    image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200&q=80",
    lead: "Siargao's rapid economic expansion is pushing boutique resort developers further down the coast. The search for raw coastal frontage is entering a critical phase.",
    body: [
      "The global focus on Siargao has created an active land grab along the General Luna coastline. With prime Cloud 9 spots fully saturated, boutique operators and international hospitality brands are acquiring land in neighboring towns, bringing island minimalist design principles with them.",
      "The architectural standard in these new sectors focuses heavily on native materials integrated with modern engineering. Coco-wood framing, high-pitched thatch roofs designed for heavy tropical rainfall, and polished concrete floor plates are the visual markers of these high-yield retreats.",
      "ScoutIt land records show land valuation along the extended northern coast has appreciated by over 80% year-on-year, driven by buyers seeking boutique resort layouts."
    ],
    recommendation: "Target parcels located within 10 minutes of the new surf breaks that feature natural sand dune protection and secure access corridors."
  },
  "off-grid-island-living": {
    title: "Off-Grid Island Living",
    category: "Hospitality",
    date: "May 2026",
    image: "https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=1200&q=80",
    lead: "Palawan's remote eco-resorts are setting the global standard for luxury off-grid infrastructure, combining raw bamboo builds with advanced solar microgrids.",
    body: [
      "As environmental regulations tighten, Palawan developers are abandoning traditional grid connections entirely. Ultra-luxury resorts are designing structures that are 100% self-sustaining, utilizing solar microgrids, advanced battery storage, and localized composting water treatment facilities.",
      "Architecturally, this requires a deep respect for local geography. Buildings are raised on structural stilts to preserve coastal ecosystems, using reclaimed teak and structurally treated bamboo that naturally flexes during weather events.",
      "This off-grid luxury model is capturing high-velocity yields as global travelers seek locations that offer premium comforts alongside a zero-footprint environment."
    ],
    recommendation: "Ensure any island acquisition has a certified independent fresh-water source and a solar installation footprint that supports peak cooling loads."
  },
  "poblacion-food-architecture": {
    title: "Poblacion Food Architecture",
    category: "Culinary",
    date: "June 2026",
    image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&q=80",
    lead: "Makati's creative culinary scene is breathing new life into old structures. Industrial-minimalist designs are converting abandoned warehouses into premier dining spots.",
    body: [
      "Poblacion's architectural landscape is evolving from residential grids to experimental culinary architecture. Old warehouse frames and low-rise apartments are being preserved externally while their interiors are completely gutted to reveal steel trusses, raw brick, and high ceilings.",
      "These industrial spaces host multi-concept culinary dining halls and micro-roasteries. The design highlights raw textures—exposed iron beams, concrete counters, and warm mood lighting—creating a distinct architectural vibe that appeals to Manila's design-conscious diners.",
      "The rent-per-square-meter metric in these repurposed spaces has risen sharply, reflecting the premium value created by design-first renovations."
    ],
    recommendation: "Evaluate properties with high structural ceiling clearance (4m+) that permit mezzanine integration and feature structural load-bearing steel."
  },
  "design-first-ridge-dining": {
    title: "Design-First Ridge Dining",
    category: "Culinary",
    date: "May 2026",
    image: "https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?w=1200&q=80",
    lead: "Tagaytay's famous ridge is undergoing a glass-enclosed architectural evolution, framing the Taal Lake panorama within minimalist structures.",
    body: [
      "Tagaytay Ridge dining is no longer about simple rustic viewing decks. Architects are deploying cantilevered glass pavilions and modernist steel-framed structures that extend over the ridge, offering uninterrupted, cinematic views of Taal Volcano.",
      "These spaces integrate indoor dining with natural cliff-side flora, using retractable glass walls that allow mountain breezes to circulate during cooler months. The lighting design is kept highly subtle to ensure the natural nighttime panorama remains the primary focus.",
      "This architectural evolution has positioned Tagaytay as a premium destination for design-driven culinary tourism, drawing high-income weekend crowds from the capital."
    ],
    recommendation: "Focus on cantilevered steel-framed structures that have completed verified geological soil checks along the Tagaytay ridge line."
  }
};

export async function generateMetadata({ params }) {
  const { "article-slug": slug } = await params;
  const article = ARTICLE_DB[slug];
  return {
    title: article ? `${article.title} &middot; Intel Briefing` : "Intel Briefing",
    description: article ? article.lead : "Real estate news and intelligence."
  };
}

export default async function IntelArticlePage({ params }) {
  const { "article-slug": slug } = await params;
  const article = ARTICLE_DB[slug];

  if (!article) {
    notFound();
  }

  // Get related articles (any other articles in the same category, or just random ones)
  const related = Object.entries(ARTICLE_DB)
    .filter(([key]) => key !== slug)
    .slice(0, 3)
    .map(([key, val]) => ({ slug: key, ...val }));

  return (
    <div className="page-wrapper">
      <Header />
      
      <main className="article-main">
        {/* Dynamic Hero Banner */}
        <section className="article-hero" style={{ backgroundImage: `url(${article.image})` }}>
          <div className="hero-overlay"></div>
          <div className="hero-content">
            <span className="article-category-tag">{article.category}</span>
            <h1 className="article-title">{article.title}</h1>
            <span className="article-date-tag">{article.date}</span>
          </div>
        </section>

        {/* Article Body */}
        <section className="article-body-container">
          <div className="article-content-wrapper">
            <p className="article-lead-text">{article.lead}</p>
            
            <div className="article-paragraphs">
              {article.body.map((para, idx) => (
                <p key={idx} className="article-paragraph">{para}</p>
              ))}
            </div>

            {/* Advisory Note */}
            <div className="advisory-box">
              <span className="advisory-label">SCOUTIT BRIEFING RECOMMENDATION</span>
              <p className="advisory-text">{article.recommendation}</p>
            </div>
          </div>
        </section>

        {/* Related Briefings Section */}
        <section className="related-section">
          <h3 className="related-title">Related Briefings</h3>
          <div className="related-grid">
            {related.map((rel) => (
              <Link href={`/intel/${rel.slug}`} key={rel.slug} className="related-card">
                <div className="related-img-wrap" style={{ backgroundImage: `url(${rel.image})` }}></div>
                <div className="related-card-body">
                  <span className="related-cat">{rel.category}</span>
                  <h4>{rel.title}</h4>
                  <span className="related-link">Read Analysis →</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </main>

      <style>{`
        .page-wrapper {
          background: var(--bg);
          color: var(--text-primary);
          min-height: 100vh;
        }

        .article-main {
          max-width: 1400px;
          margin: 0 auto;
          padding-bottom: 80px;
        }

        .article-hero {
          height: 50vh;
          min-height: 350px;
          background-size: cover;
          background-position: center;
          position: relative;
          display: flex;
          align-items: flex-end;
          padding: 60px 45px;
        }

        .hero-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(to top, rgba(14,14,14,0.95) 0%, rgba(14,14,14,0.4) 60%, transparent 100%);
        }

        .hero-content {
          position: relative;
          z-index: 2;
          max-width: 800px;
        }

        .article-category-tag {
          font-family: var(--font-mono);
          font-size: 11px;
          color: var(--accent);
          text-transform: uppercase;
          letter-spacing: 0.15em;
          margin-bottom: 12px;
          display: block;
        }

        .article-title {
          font-family: var(--font-display);
          font-size: clamp(32px, 5vw, 48px);
          font-weight: bold;
          color: #fff;
          margin-bottom: 16px;
          line-height: 1.25;
        }

        .article-date-tag {
          font-size: 12px;
          color: var(--text-muted);
          letter-spacing: 0.05em;
        }

        /* Body Container */
        .article-body-container {
          padding: 60px 45px;
          display: flex;
          justify-content: center;
        }

        .article-content-wrapper {
          max-width: 780px;
          width: 100%;
        }

        .article-lead-text {
          font-family: var(--font-display);
          font-size: 22px;
          font-style: italic;
          line-height: 1.6;
          color: var(--accent);
          margin-bottom: 40px;
          opacity: 0.95;
        }

        .article-paragraphs {
          display: flex;
          flex-direction: column;
          gap: 24px;
          margin-bottom: 56px;
        }

        .article-paragraph {
          font-size: 15px;
          line-height: 1.8;
          color: var(--text-secondary);
        }

        /* Advisory Box */
        .advisory-box {
          background: rgba(200, 169, 110, 0.05);
          border: 1px solid var(--accent-border);
          border-radius: var(--radius-md);
          padding: 32px;
          margin-bottom: 56px;
          position: relative;
        }

        .advisory-box::before {
          content: '';
          position: absolute;
          left: 0;
          top: 10%;
          bottom: 10%;
          width: 3px;
          background: var(--accent);
        }

        .advisory-label {
          font-family: var(--font-mono);
          font-size: 10px;
          color: var(--accent);
          letter-spacing: 0.1em;
          text-transform: uppercase;
          margin-bottom: 12px;
          display: block;
          font-weight: bold;
        }

        .advisory-text {
          font-size: 14px;
          line-height: 1.6;
          color: var(--text-primary);
          margin: 0;
        }

        /* Related Section */
        .related-section {
          border-top: 1px solid var(--border-solid);
          padding: 60px 45px 0 45px;
        }

        .related-title {
          font-family: var(--font-display);
          font-size: 24px;
          color: #fff;
          margin-bottom: 32px;
        }

        .related-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 32px;
        }

        @media (max-width: 768px) {
          .related-grid {
            grid-template-columns: 1fr;
          }
          .article-hero {
            padding: 40px 20px;
          }
          .article-body-container {
            padding: 40px 20px;
          }
        }

        .related-card {
          background: var(--surface);
          border: 1px solid var(--border-solid);
          border-radius: var(--radius-md);
          overflow: hidden;
          text-decoration: none;
          display: flex;
          flex-direction: column;
          transition: all var(--transition-fast);
        }

        .related-card:hover {
          border-color: var(--accent-border);
          transform: translateY(-4px);
        }

        .related-img-wrap {
          height: 140px;
          background-size: cover;
          background-position: center;
        }

        .related-card-body {
          padding: 20px;
          display: flex;
          flex-direction: column;
          flex: 1;
        }

        .related-cat {
          font-family: var(--font-mono);
          font-size: 9px;
          color: var(--accent);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 8px;
        }

        .related-card-body h4 {
          font-family: var(--font-display);
          font-size: 16px;
          color: var(--text-primary);
          margin-bottom: 16px;
          line-height: 1.3;
          flex: 1;
        }

        .related-link {
          font-size: 11px;
          font-weight: 600;
          color: var(--accent);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
      `}</style>
    </div>
  );
}
