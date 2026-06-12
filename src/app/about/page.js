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

          <div className="ecosystem-map">
            <h2 className="protocol-heading">The ScoutIt Ecosystem</h2>
            
            <div className="eco-grid">
              {/* Column 1: The Network */}
              <div className="eco-col eco-left">
                <div className="eco-header">The Network</div>
                
                <div className="eco-node">
                  <h4>The Seekers</h4>
                  <p>Institutional buyers, high-net-worth individuals, and spatial curators entering the matrix.</p>
                </div>
                
                <div className="eco-node">
                  <h4>Asset Holders</h4>
                  <p>Prime property owners, developers, and off-market sellers deploying inventory.</p>
                </div>

                <div className="eco-node">
                  <h4>Service Elite</h4>
                  <p>Verified photographers, researchers, and event planners joining the roster.</p>
                </div>
              </div>

              {/* Column 2: The Core */}
              <div className="eco-col eco-center">
                <div className="eco-header center-header">The ScoutIt Core</div>
                
                <div className="eco-core-node">
                  <div className="core-pulse"></div>
                  <h4>Data &amp; Intelligence</h4>
                  <p>We aggregate raw spatial data, transforming it into high-fidelity intelligence (Layers 01-03).</p>
                </div>

                <div className="eco-core-node">
                  <div className="core-pulse"></div>
                  <h4>The Service Hub</h4>
                  <p>We maintain a strict, vetted roster of elite professionals ready for deployment (Layer 04).</p>
                </div>
              </div>

              {/* Column 3: The Execution */}
              <div className="eco-col eco-right">
                <div className="eco-header">The Execution</div>
                
                <div className="eco-node outcome-node">
                  <h4>Acquisition &amp; Curation</h4>
                  <p>Seekers save assets to their private Boards, triggering strategic acquisitions guided by our intel.</p>
                </div>

                <div className="eco-node outcome-node">
                  <h4>Asset Liquidity</h4>
                  <p>Owners successfully move high-value, off-market inventory to verified buyers.</p>
                </div>

                <div className="eco-node outcome-node">
                  <h4>Commissioned Deployment</h4>
                  <p>Service elites are commissioned directly by users to capture, research, or design spaces.</p>
                </div>
              </div>
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

        .ecosystem-map {
          margin: 100px 0;
          padding: 60px 40px;
          background: #0d0d0d;
          border: 1px solid var(--border-solid);
          border-radius: var(--radius-md);
        }

        .protocol-heading {
          font-family: var(--font-display);
          font-size: 32px;
          color: var(--text-primary);
          text-align: center;
          margin-bottom: 60px;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }

        .eco-grid {
          display: grid;
          grid-template-columns: 1fr 1.2fr 1fr;
          gap: 40px;
          position: relative;
        }

        .eco-grid::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 10%;
          right: 10%;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(255,184,0,0.3), transparent);
          z-index: 0;
        }

        .eco-col {
          display: flex;
          flex-direction: column;
          gap: 24px;
          z-index: 1;
        }

        .eco-header {
          font-family: var(--font-mono);
          font-size: 12px;
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.15em;
          text-align: center;
          margin-bottom: 16px;
          border-bottom: 1px solid #262626;
          padding-bottom: 12px;
        }

        .center-header {
          color: var(--accent);
          border-bottom: 1px solid rgba(255,184,0,0.3);
        }

        .eco-node {
          background: #121212;
          border: 1px solid #1f1f1f;
          padding: 24px;
          border-radius: 4px;
          transition: all 0.3s ease;
        }

        .eco-node:hover {
          border-color: rgba(255,255,255,0.2);
          transform: translateY(-2px);
        }

        .outcome-node {
          border-left: 2px solid var(--accent);
        }

        .eco-core-node {
          background: #161616;
          border: 1px solid rgba(255,184,0,0.2);
          padding: 32px 24px;
          border-radius: 4px;
          text-align: center;
          position: relative;
          box-shadow: 0 10px 30px rgba(0,0,0,0.5);
          display: flex;
          flex-direction: column;
          justify-content: center;
          height: 100%;
        }

        .core-pulse {
          position: absolute;
          top: -3px;
          left: 50%;
          transform: translateX(-50%);
          width: 40px;
          height: 2px;
          background: var(--accent);
          box-shadow: 0 0 10px var(--accent);
        }

        .eco-node h4, .eco-core-node h4 {
          font-family: var(--font-mono);
          font-size: 13px;
          color: var(--text-primary);
          margin-bottom: 12px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .eco-core-node h4 {
          color: var(--accent);
        }

        .eco-node p, .eco-core-node p {
          font-size: 13px;
          line-height: 1.6;
          color: var(--text-secondary);
        }

        @media (max-width: 900px) {
          .eco-grid {
            grid-template-columns: 1fr;
            gap: 60px;
          }
          .eco-grid::before {
            display: none;
          }
          .ecosystem-map {
            padding: 40px 20px;
          }
          .eco-core-node {
            padding: 24px;
          }
        }
      `}</style>
    </div>
  );
}
