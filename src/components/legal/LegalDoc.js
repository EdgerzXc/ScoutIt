import Link from "next/link";
import "./legal-doc.css";
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
          <div className="legal-disclaimer" role="note">
            <span className="legal-disclaimer-label">⚠ Draft — not yet legally reviewed</span>
            <p>
              This is a working draft, written in plain language to be transparent about how
              ScoutIt intends to operate during our pre-launch period. It has{" "}
              <strong>not yet been reviewed or approved by a licensed attorney</strong>, it is not
              final, and it may change before ScoutIt opens to the public. Nothing here is legal
              advice. If anything is unclear, please reach out before relying on it.
            </p>
          </div>

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

    </div>
  );
}
