"use client";

import LayerNav from "@/components/descent/LayerNav";
import BackgroundOrbit from "@/components/descent/BackgroundOrbit";
import Link from "next/link";
import { useState, useEffect } from "react";

/* The descent, explained — what each layer does for the user. */
const DESCENT = [
  { k: "01", name: "Orbit", body: "First contact. The pitch from above — what ScoutIT is and why space decisions deserve intelligence." },
  { k: "02", name: "Stratosphere", body: "The showcase. Hand-picked spaces and stories that prove the standard we hold listings to." },
  { k: "03", name: "Metropolis", body: "The live directory. Every listing, geocoded and searchable by radius, region, and category." },
  { k: "04", name: "Crust", body: "The service ecosystem. Verified advisors, photographers, researchers, and event designers." },
  { k: "05", name: "Mantle", body: "The deep archive. The structured intelligence database doing the quiet, heavy lifting beneath you." },
  { k: "06", name: "Core", body: "Your private workspace. Your profile, your listings, your leads — command from the center." },
];

/* What you get — the advantages, by who you are. */
const ROLES = [
  {
    role: "Buyers & Tenants",
    perks: ["Curated discovery filtered to how you live and work", "Save spaces and build shortlists in one ledger", "Verified neighbourhood intel before you commit"],
  },
  {
    role: "Owners",
    perks: ["List with the Guided Wizard in minutes", "Surface your space's architectural DNA", "Receive direct pitches from vetted brokers"],
  },
  {
    role: "Brokers",
    perks: ["Verify your PRC license to unlock Broker Mode", "Manage listings and track inbound leads", "Build a public portfolio that earns trust"],
  },
  {
    role: "Service Providers",
    perks: ["Photographers, researchers, planners — get discovered", "A profile that showcases your roster and work", "Inbound inquiries from high-intent clients"],
  },
];

const ORBIT_NODES = [
  { label: "Curated Spaces", x: 260, y: 50 },
  { label: "Verified Intel", x: 442, y: 155 },
  { label: "Inbound Leads", x: 442, y: 365 },
  { label: "Public Profile", x: 260, y: 470 },
  { label: "Direct Advisors", x: 78, y: 365 },
  { label: "Your Listings", x: 78, y: 155 },
];

export default function AboutYouPage() {
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("scoutit_user");
      if (raw) setCurrentUser(JSON.parse(raw));
    } catch {}
  }, []);

  const portalHref = currentUser?.name
    ? `/profile/${encodeURIComponent(currentUser.name)}`
    : "/onboarding";

  return (
    <main className="about-you" style={{ paddingTop: "52px" }}>
      <LayerNav prev={{ href: "/layer/core", label: "The Core" }} next={null} />

      {/* Cosmic starfield backdrop — "it all orbits around you" */}
      <div className="ay-bg" aria-hidden="true">
        <BackgroundOrbit />
      </div>
      <div className="ay-scrim" aria-hidden="true" />

      <div className="ay-content">
        {/* ── HERO ── */}
        <header className="ay-hero">
          <span className="ay-kicker ay-reveal">Inner Core // About You</span>
          <h1 className="ay-title ay-reveal ay-reveal-1">It all orbits around you.</h1>
          <p className="ay-lead ay-reveal ay-reveal-2">
            ScoutIT is built so every layer — every listing, every broker, every data point — serves
            one person: you. Here is how the platform works, and exactly what you get for being at the
            center of it.
          </p>
          <span className="ay-scroll ay-reveal ay-reveal-3">Scroll ↓</span>
        </header>

        {/* ── SCHEMATIC: YOU AT THE CENTER ── */}
        <section className="ay-section">
          <span className="ay-section-k">The Schematic</span>
          <h2 className="ay-section-title">You at the center.</h2>
          <p className="ay-section-sub">
            Six systems orbit your account. Each one exists to put the right space, person, or signal
            in front of you at the right moment.
          </p>

          <div className="ay-schematic-panel">
            <div className="ay-schematic">
              <svg viewBox="0 0 520 520" role="img" aria-label="Diagram of ScoutIT systems orbiting the user">
                <defs>
                  <radialGradient id="ayCore" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#FFE9A8" />
                    <stop offset="55%" stopColor="#FFB800" />
                    <stop offset="100%" stopColor="#7A5C00" />
                  </radialGradient>
                </defs>

                <circle cx="260" cy="260" r="150" className="ay-ring" />
                <circle cx="260" cy="260" r="210" className="ay-ring ay-ring-faint" />

                {ORBIT_NODES.map((n) => (
                  <g key={n.label}>
                    <line x1="260" y1="260" x2={n.x} y2={n.y} className="ay-spoke" />
                    <circle cx={n.x} cy={n.y} r="7" className="ay-node" />
                    <text
                      x={n.x}
                      y={n.y < 70 ? n.y - 16 : n.y > 450 ? n.y + 26 : n.y - 16}
                      className="ay-node-label"
                      textAnchor="middle"
                    >
                      {n.label}
                    </text>
                  </g>
                ))}

                <circle cx="260" cy="260" r="46" fill="url(#ayCore)" className="ay-you-glow" />
                <text x="260" y="266" className="ay-you-text" textAnchor="middle">YOU</text>
              </svg>
            </div>
          </div>
        </section>

        {/* ── THE DESCENT GUIDE ── */}
        <section className="ay-section">
          <span className="ay-section-k">The Guide</span>
          <h2 className="ay-section-title">How the descent works.</h2>
          <p className="ay-section-sub">
            ScoutIT unfolds as a descent — from the first pitch in orbit down to your private core.
            Each layer hands you something on the way down.
          </p>

          <ol className="ay-descent">
            {DESCENT.map((l) => (
              <li key={l.k} className="ay-layer">
                <span className="ay-layer-k">{l.k}</span>
                <div className="ay-layer-body">
                  <h3 className="ay-layer-name">{l.name}</h3>
                  <p className="ay-layer-text">{l.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* ── ADVANTAGES BY ROLE ── */}
        <section className="ay-section">
          <span className="ay-section-k">Your Advantages</span>
          <h2 className="ay-section-title">Built for whoever you are.</h2>
          <p className="ay-section-sub">
            One platform, four kinds of power. Pick the role that fits — many people wear more than one.
          </p>

          <div className="ay-roles">
            {ROLES.map((r) => (
              <div key={r.role} className="ay-role-card">
                <h3 className="ay-role-title">{r.role}</h3>
                <ul className="ay-perks">
                  {r.perks.map((p) => (
                    <li key={p} className="ay-perk">{p}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="ay-cta-band">
          <h2 className="ay-cta-title">{currentUser ? "Your portal is waiting." : "Claim your place at the center."}</h2>
          <div className="ay-cta-actions">
            <Link href={portalHref} className="ay-cta-primary">
              {currentUser ? "Enter your profile →" : "Create your account →"}
            </Link>
            <Link href="/layer/core" className="ay-cta-secondary">Back to the Core</Link>
          </div>
        </section>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .about-you {
          position: relative;
          min-height: 100vh;
          background: #050302;
          color: var(--text-primary);
          overflow-x: hidden;
        }

        /* Cosmic backdrop + legibility scrim */
        .ay-bg {
          position: fixed;
          inset: 0;
          z-index: 0;
          pointer-events: none;
        }
        .ay-scrim {
          position: fixed;
          inset: 0;
          z-index: 1;
          pointer-events: none;
          background:
            radial-gradient(ellipse 90% 60% at 50% 38%, rgba(5,3,2,0) 0%, rgba(5,3,2,0.35) 55%, rgba(5,3,2,0.78) 100%),
            linear-gradient(180deg, rgba(5,3,2,0.55) 0%, rgba(5,3,2,0.2) 22%, rgba(5,3,2,0.45) 70%, rgba(5,3,2,0.9) 100%);
        }
        .ay-content {
          position: relative;
          z-index: 2;
        }

        /* ── Entrance ay-reveal ── */
        .ay-reveal {
          opacity: 0;
          transform: translateY(22px);
          animation: ayFadeUp 0.9s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .ay-reveal-1 { animation-delay: 0.12s; }
        .ay-reveal-2 { animation-delay: 0.26s; }
        .ay-reveal-3 { animation-delay: 0.42s; }
        @keyframes ayFadeUp {
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.55; }
          50% { opacity: 1; }
        }

        /* ── Hero ── */
        .ay-hero {
          max-width: 860px;
          margin: 0 auto;
          padding: clamp(72px, 12vw, 150px) clamp(24px, 6vw, 48px) clamp(56px, 8vw, 96px);
          text-align: center;
        }
        .ay-kicker {
          display: inline-block;
          font-family: var(--font-mono);
          font-size: 11px;
          letter-spacing: 0.32em;
          text-transform: uppercase;
          color: var(--accent);
          text-shadow: 0 0 24px rgba(255, 184, 0, 0.5);
        }
        .ay-title {
          font-family: var(--font-display);
          font-size: clamp(42px, 7vw, 88px);
          line-height: 1.03;
          margin: 22px 0 24px;
          color: #f8f1e6;
          text-shadow: 0 4px 50px rgba(0, 0, 0, 0.9);
        }
        .ay-lead {
          font-size: clamp(16px, 1.8vw, 20px);
          line-height: 1.7;
          color: rgba(248, 238, 220, 0.82);
          max-width: 62ch;
          margin: 0 auto 36px;
          text-shadow: 0 2px 24px rgba(0, 0, 0, 0.85);
        }
        .ay-scroll {
          display: inline-block;
          font-family: var(--font-mono);
          font-size: 11px;
          letter-spacing: 0.24em;
          text-transform: uppercase;
          color: var(--text-muted);
          animation: ayFadeUp 0.9s cubic-bezier(0.16,1,0.3,1) 0.42s forwards, pulse 2.4s ease-in-out 1.4s infinite;
        }

        /* ── Sections ── */
        .ay-section {
          max-width: 1080px;
          margin: 0 auto;
          padding: clamp(56px, 8vw, 104px) clamp(24px, 6vw, 48px);
        }
        .ay-section-k {
          font-family: var(--font-mono);
          font-size: 11px;
          letter-spacing: 0.28em;
          text-transform: uppercase;
          color: var(--accent);
          text-shadow: 0 0 20px rgba(255, 184, 0, 0.45);
        }
        .ay-section-title {
          font-family: var(--font-display);
          font-size: clamp(30px, 4.6vw, 54px);
          line-height: 1.08;
          margin: 14px 0 16px;
          color: #f8f1e6;
          text-shadow: 0 3px 40px rgba(0, 0, 0, 0.85);
        }
        .ay-section-sub {
          font-size: clamp(15px, 1.6vw, 18px);
          line-height: 1.7;
          color: rgba(248, 238, 220, 0.7);
          max-width: 58ch;
          margin: 0 0 48px;
          text-shadow: 0 2px 18px rgba(0, 0, 0, 0.8);
        }

        /* ── Schematic (glass panel over stars) ── */
        .ay-schematic-panel {
          display: flex;
          justify-content: center;
          padding: clamp(24px, 4vw, 48px);
          border: 1px solid rgba(255, 184, 0, 0.16);
          border-radius: 20px;
          background: radial-gradient(ellipse at center, rgba(20, 12, 4, 0.55) 0%, rgba(8, 5, 2, 0.4) 70%);
          backdrop-filter: blur(6px);
          -webkit-backdrop-filter: blur(6px);
          box-shadow: 0 30px 80px rgba(0, 0, 0, 0.5), inset 0 0 80px rgba(255, 184, 0, 0.04);
        }
        .ay-schematic { width: 100%; display: flex; justify-content: center; }
        .ay-schematic svg { width: 100%; max-width: 500px; height: auto; }
        .ay-ring { fill: none; stroke: rgba(255, 184, 0, 0.28); stroke-width: 1; }
        .ay-ring-faint { stroke: rgba(255, 184, 0, 0.12); stroke-dasharray: 3 6; }
        .ay-spoke { stroke: rgba(255, 184, 0, 0.22); stroke-width: 1; }
        .ay-node { fill: #0b0805; stroke: var(--accent); stroke-width: 1.5; }
        .ay-node-label {
          fill: rgba(248, 238, 220, 0.82);
          font-family: var(--font-mono);
          font-size: 12px;
          letter-spacing: 0.06em;
        }
        .ay-you-glow { filter: drop-shadow(0 0 26px rgba(255, 184, 0, 0.7)); }
        .ay-you-text {
          fill: #1a0f02;
          font-family: var(--font-display);
          font-size: 20px;
          font-weight: 700;
          letter-spacing: 0.08em;
        }

        /* ── Descent guide ── */
        .ay-descent { list-style: none; margin: 0; padding: 0; }
        .ay-layer {
          display: flex;
          gap: 24px;
          align-items: flex-start;
          padding: 24px 4px;
          border-bottom: 1px solid rgba(255, 184, 0, 0.1);
          transition: border-color 0.25s ease, transform 0.25s ease;
        }
        .ay-layer:last-child { border-bottom: none; }
        .ay-layer:hover { border-color: rgba(255, 184, 0, 0.3); transform: translateX(4px); }
        .ay-layer-k {
          font-family: var(--font-mono);
          font-size: 14px;
          letter-spacing: 0.1em;
          color: var(--accent);
          padding-top: 4px;
          min-width: 32px;
          text-shadow: 0 0 18px rgba(255, 184, 0, 0.5);
        }
        .ay-layer-name {
          font-family: var(--font-display);
          font-size: 24px;
          color: #fff;
          margin: 0 0 6px;
        }
        .ay-layer-text {
          font-size: 15px;
          line-height: 1.65;
          color: rgba(248, 238, 220, 0.7);
          margin: 0;
          max-width: 70ch;
        }

        /* ── Roles (glass cards) ── */
        .ay-roles {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 20px;
        }
        .ay-role-card {
          background: rgba(16, 11, 4, 0.55);
          border: 1px solid rgba(255, 184, 0, 0.16);
          border-radius: 14px;
          padding: 28px 26px;
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.4);
          transition: border-color 0.25s ease, transform 0.25s ease, box-shadow 0.25s ease;
        }
        .ay-role-card:hover {
          border-color: var(--accent);
          transform: translateY(-4px);
          box-shadow: 0 26px 60px rgba(0, 0, 0, 0.5), 0 0 36px rgba(255, 184, 0, 0.1);
        }
        .ay-role-title {
          font-family: var(--font-display);
          font-size: 22px;
          color: var(--accent);
          margin: 0 0 18px;
        }
        .ay-perks { list-style: none; margin: 0; padding: 0; display: grid; gap: 12px; }
        .ay-perk {
          position: relative;
          padding-left: 22px;
          font-size: 14px;
          line-height: 1.55;
          color: rgba(248, 238, 220, 0.72);
        }
        .ay-perk::before { content: "→"; position: absolute; left: 0; color: var(--accent); }

        /* ── CTA band ── */
        .ay-cta-band {
          text-align: center;
          padding: clamp(72px, 10vw, 130px) clamp(24px, 6vw, 48px);
          background: radial-gradient(ellipse 70% 100% at 50% 100%, rgba(255, 184, 0, 0.12), transparent 70%);
        }
        .ay-cta-title {
          font-family: var(--font-display);
          font-size: clamp(28px, 4.2vw, 52px);
          color: #f8f1e6;
          margin: 0 0 32px;
          text-shadow: 0 3px 40px rgba(0, 0, 0, 0.85);
        }
        .ay-cta-actions { display: flex; gap: 16px; justify-content: center; flex-wrap: wrap; }
        .ay-cta-primary {
          font-family: var(--font-body);
          font-size: 13px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.2em;
          color: #0e0e0e;
          background: var(--accent);
          border: 1px solid var(--accent);
          padding: 17px 38px;
          border-radius: 4px;
          text-decoration: none;
          transition: all 0.22s ease;
        }
        .ay-cta-primary:hover {
          background: var(--accent-bright);
          border-color: var(--accent-bright);
          box-shadow: 0 0 34px rgba(255, 184, 0, 0.45);
          transform: translateY(-2px);
        }
        .ay-cta-secondary {
          font-family: var(--font-mono);
          font-size: 12px;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: rgba(248, 238, 220, 0.75);
          padding: 17px 28px;
          border: 1px solid rgba(255, 184, 0, 0.25);
          border-radius: 4px;
          text-decoration: none;
          transition: all 0.2s ease;
        }
        .ay-cta-secondary:hover { color: var(--accent); border-color: var(--accent); }

        @media (max-width: 720px) {
          .ay-roles { grid-template-columns: 1fr; }
        }
      ` }} />
    </main>
  );
}
