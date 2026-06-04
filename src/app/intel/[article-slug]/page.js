import Header from "@/components/Header";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getArticleBySlug, getArticles } from "@/data/mockDb";
import { fetchIntel } from "@/lib/airtable";

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
          category
        };
      }
    } catch (e) {
      console.error("Failed to load article from Airtable:", e);
    }
  }
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
  return {
    title: article ? `${article.title} &middot; Intel Briefing` : "Intel Briefing",
    description: article ? article.lead : "Real estate news and intelligence."
  };
}

export default async function IntelArticlePage({ params }) {
  const { "article-slug": slug } = await params;
  const article = await getLiveArticle(slug);

  if (!article) {
    notFound();
  }

  const related = await getLiveRelated(slug);

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
