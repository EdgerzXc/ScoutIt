"use client";

import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export default function AboutPage() {
  return (
    <div className="page-wrapper">
      <Header />
      <main className="about-main">
        <header className="manifesto-header">
          <span className="vector-label">Our Mission</span>
          <h1 className="manifesto-title">The ScoutIt Manifesto</h1>
        </header>

        <section className="manifesto-content">
          <div className="lead-paragraph">
            <p>
              ScoutIt isn't a listing site. We're the Philippines' first spatial commerce platform — the intelligence layer that helps people read, understand, and choose space with confidence.
            </p>
          </div>

          <div className="editorial-grid">
            <div className="editorial-col">
              <h3>01. The Intelligence</h3>
              <p>
                The market is noisy and full of half-truths. We gather the scattered facts about a space — the numbers, the neighborhood, the real demand — and turn them into one clear, verified briefing. No fake listings. No guesswork.
              </p>
            </div>

            <div className="editorial-col">
              <h3>02. The People</h3>
              <p>
                Data only goes so far. Behind every space is a vetted network — brokers, photographers, researchers, planners — real professionals, rated only by verified results, never by who paid the most.
              </p>
            </div>

            <div className="editorial-col">
              <h3>03. The Experience</h3>
              <p>
                We stripped out everything that wastes your time. No pop-ups, no pressure, no inflated prices — just calm, verified information in a space as considered as the ones you're looking for.
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
                  <p>Buyers, renters, and the simply curious — anyone deciding on a space and wanting the real story behind it.</p>
                </div>

                <div className="eco-node">
                  <h4>Space Owners</h4>
                  <p>Owners, developers, and landlords who want the right eyes on their space — not just more clicks.</p>
                </div>

                <div className="eco-node">
                  <h4>The Professionals</h4>
                  <p>Verified brokers, photographers, researchers, and planners who make every space decision count.</p>
                </div>
              </div>

              {/* Column 2: The Core */}
              <div className="eco-col eco-center">
                <div className="eco-header center-header">The ScoutIt Core</div>
                
                <div className="eco-core-node">
                  <div className="core-pulse"></div>
                  <h4>The Intelligence</h4>
                  <p>We turn scattered facts about every space into one clear, verified briefing you can trust.</p>
                </div>

                <div className="eco-core-node">
                  <div className="core-pulse"></div>
                  <h4>The Network</h4>
                  <p>We keep a vetted roster of professionals — rated by results — ready when you need them.</p>
                </div>
              </div>

              {/* Column 3: The Execution */}
              <div className="eco-col eco-right">
                <div className="eco-header">The Execution</div>
                
                <div className="eco-node outcome-node">
                  <h4>Confident Decisions</h4>
                  <p>Seekers save spaces to their private Board and decide with real signals, not sales pressure.</p>
                </div>

                <div className="eco-node outcome-node">
                  <h4>The Right Match</h4>
                  <p>Owners reach the people genuinely interested in their space — and the brokers who can close.</p>
                </div>

                <div className="eco-node outcome-node">
                  <h4>Work That Counts</h4>
                  <p>Professionals get hired directly to capture, research, or design the spaces people care about.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="vision-block">
            <h2 className="vision-heading">Why this matters now.</h2>
            <p className="vision-text">
              The Philippines is growing fast, and space — where people live, work, gather, and build — is at the center of it. Yet the way we find it still runs on fake listings, guesswork, and pressure. ScoutIt is the first to treat space as something you should understand before you commit. That's what a spatial commerce platform is, and we're the first to build one here.
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
          background: linear-gradient(90deg, transparent, rgba(232, 174, 60,0.3), transparent);
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
          border-bottom: 1px solid rgba(232, 174, 60,0.3);
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
          border: 1px solid rgba(232, 174, 60,0.2);
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
