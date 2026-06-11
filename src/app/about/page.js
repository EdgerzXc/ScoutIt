"use client";

import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export default function AboutPage() {
  return (
    <div className="page-wrapper">
      <Header />
      <main className="about-main">
        <header className="manifesto-header">
          <span className="vector-label">Vector 05</span>
          <h1 className="manifesto-title">The ScoutIt Manifesto</h1>
        </header>

        <section className="manifesto-content">
          <div className="lead-paragraph">
            <p>
              ScoutIt is not a marketplace. We are a space intelligence platform engineering the acquisition and transfer of prime real estate assets across the Philippine archipelago.
            </p>
          </div>

          <div className="editorial-grid">
            <div className="editorial-col">
              <h3>01. The Matrix</h3>
              <p>
                In a fragmented market, information asymmetry dictates value. Our platform aggregates and synthesizes spatial data into a unified, high-fidelity matrix. We bypass traditional listings to provide institutional-grade intelligence on premium residential, commercial, and hospitality assets.
              </p>
            </div>
            
            <div className="editorial-col">
              <h3>02. The Advisors</h3>
              <p>
                Algorithms parse data, but human intuition navigates complexity. The ScoutIt roster comprises elite, vetted advisors specializing in niche sectors—from ultra-luxury bespoke residences in the Makati CBD to high-yield industrial corridors in the south.
              </p>
            </div>
            
            <div className="editorial-col">
              <h3>03. The Architecture</h3>
              <p>
                Our structural framework—the v6 Design DNA—is built on absolute precision and minimalism. We remove the noise. No price tags, no intrusive banners. Just pure, verified asset data presented in a frictionless interface designed for serious capital deployment.
              </p>
            </div>
          </div>

          <div className="vision-block">
            <h2 className="vision-heading">Redefining Capital Placement in Emerging Asia.</h2>
            <p className="vision-text">
              The Philippines stands at an economic inflection point. As global supply chains realign and domestic wealth generation accelerates, the demand for structured, reliable asset intelligence has never been higher. ScoutIt bridges the gap between vision and acquisition.
            </p>
          </div>
        </section>
      </main>
      <Footer />

      <style>{`
        .page-wrapper {
          background: var(--bg);
          color: var(--text-primary);
          min-height: 100vh;
        }

        .about-main {
          padding: 80px 40px;
          max-width: 1000px;
          margin: 0 auto;
        }

        .manifesto-header {
          text-align: center;
          margin-bottom: 80px;
        }

        .vector-label {
          font-family: var(--font-mono);
          font-size: 10px;
          color: var(--accent);
          letter-spacing: 0.15em;
          text-transform: uppercase;
        }

        .manifesto-title {
          font-family: var(--font-display);
          font-size: 56px;
          margin: 24px 0;
          color: var(--text-primary);
          letter-spacing: -0.02em;
        }

        .lead-paragraph {
          font-family: var(--font-display);
          font-size: 28px;
          line-height: 1.5;
          color: var(--accent);
          text-align: center;
          max-width: 800px;
          margin: 0 auto 80px;
        }

        .editorial-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 40px;
          margin-bottom: 80px;
        }

        @media (max-width: 768px) {
          .editorial-grid {
            grid-template-columns: 1fr;
          }
        }

        .editorial-col h3 {
          font-family: var(--font-mono);
          font-size: 14px;
          color: var(--text-primary);
          margin-bottom: 16px;
          border-bottom: 1px solid var(--border-solid);
          padding-bottom: 12px;
        }

        .editorial-col p {
          font-size: 14px;
          line-height: 1.8;
          color: var(--text-secondary);
        }

        .vision-block {
          background: var(--surface);
          border: 1px solid var(--border-solid);
          padding: 64px;
          text-align: center;
          border-radius: var(--radius-md);
        }

        .vision-heading {
          font-family: var(--font-display);
          font-size: 32px;
          color: var(--text-primary);
          margin-bottom: 24px;
        }

        .vision-text {
          font-size: 16px;
          line-height: 1.8;
          color: var(--text-secondary);
          max-width: 600px;
          margin: 0 auto;
        }
      `}</style>
    </div>
  );
}
