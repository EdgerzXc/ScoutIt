import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

// Shared presentational shell for ScoutIt legal documents (Terms, Privacy).
// Pages pass data only — no styling or structure lives in the page files.
//
// props:
//   eyebrow   string  — mono uppercase label (e.g. "LAYER 09 // PLATFORM GOVERNANCE")
//   title     string  — serif page title
//   meta      string  — effective date / one-line context
//   intro     string  — lead paragraph above the numbered sections
//   sections  array    — [{ num, title, body }] ; body splits on blank lines into <p>
//   related   object   — { href, label } cross-link rendered at the foot
export default function LegalDoc({ eyebrow, title, meta, intro, sections, related }) {
  return (
    <div className="legal-page">
      <Header />

      <main className="legal-main">
        <div className="legal-hero">
          <span className="legal-eyebrow">{eyebrow}</span>
          <h1 className="legal-title">{title}</h1>
          <p className="legal-meta">{meta}</p>
        </div>

        <div className="legal-body">
          <div className="legal-intro">
            <p>{intro}</p>
          </div>

          <div className="legal-sections">
            {sections.map((s) => (
              <section key={s.num} className="legal-section">
                <div className="legal-section-header">
                  <span className="legal-section-num">{s.num}</span>
                  <h2 className="legal-section-title">{s.title}</h2>
                </div>
                <div className="legal-section-body">
                  {s.body.split("\n\n").map((para, i) => (
                    <p key={i}>{para}</p>
                  ))}
                </div>
              </section>
            ))}
          </div>

          {related ? (
            <div className="legal-footer-note">
              <p>
                Also read our <Link href={related.href}>{related.label}</Link>.
              </p>
            </div>
          ) : null}
        </div>
      </main>

      <Footer />

      <style>{`
        .legal-page {
          background: #0a0a0a;
          min-height: 100vh;
          color: #f5f3ee;
        }

        .legal-main {
          max-width: 780px;
          margin: 0 auto;
          padding: 80px 24px 120px;
        }

        .legal-hero {
          margin-bottom: 56px;
          padding-bottom: 44px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.07);
        }

        .legal-eyebrow {
          display: block;
          font-family: var(--font-geist-mono, monospace);
          font-size: 10px;
          letter-spacing: 0.2em;
          color: var(--accent, #E8AE3C);
          text-transform: uppercase;
          margin-bottom: 16px;
        }

        .legal-title {
          font-family: Georgia, 'Times New Roman', serif;
          font-size: clamp(2.2rem, 5vw, 3.5rem);
          font-weight: 400;
          color: #f5f3ee;
          margin: 0 0 16px;
          line-height: 1.1;
        }

        .legal-meta {
          font-family: var(--font-geist-mono, monospace);
          font-size: 11px;
          letter-spacing: 0.07em;
          color: rgba(200, 200, 200, 0.45);
          text-transform: uppercase;
          line-height: 1.6;
        }

        .legal-body {
          display: flex;
          flex-direction: column;
        }

        .legal-intro p {
          font-size: 16px;
          line-height: 1.75;
          color: rgba(245, 243, 238, 0.72);
          margin: 0 0 48px;
        }

        .legal-sections {
          display: flex;
          flex-direction: column;
        }

        .legal-section {
          padding: 38px 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        }

        .legal-section-header {
          display: flex;
          align-items: baseline;
          gap: 16px;
          margin-bottom: 16px;
        }

        .legal-section-num {
          font-family: var(--font-geist-mono, monospace);
          font-size: 11px;
          letter-spacing: 0.1em;
          color: var(--accent, #E8AE3C);
          flex-shrink: 0;
        }

        .legal-section-title {
          font-family: Georgia, 'Times New Roman', serif;
          font-size: 1.3rem;
          font-weight: 400;
          color: #f5f3ee;
          margin: 0;
          line-height: 1.3;
        }

        .legal-section-body {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .legal-section-body p {
          font-size: 14.5px;
          line-height: 1.8;
          color: rgba(200, 200, 200, 0.68);
          margin: 0;
          white-space: pre-line;
        }

        .legal-footer-note {
          padding-top: 44px;
          font-size: 13px;
          color: rgba(200, 200, 200, 0.45);
        }

        .legal-footer-note a {
          color: var(--accent, #E8AE3C);
          text-decoration: none;
        }
        .legal-footer-note a:hover {
          text-decoration: underline;
        }

        @media (max-width: 640px) {
          .legal-main { padding: 60px 16px 80px; }
        }
      `}</style>
    </div>
  );
}
