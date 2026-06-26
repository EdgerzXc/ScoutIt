"use client";

import LayerNav from "@/components/descent/LayerNav";
import Link from "next/link";
import { useState, useEffect } from "react";
import BackgroundCore from "@/components/descent/BackgroundCore";

export default function CoreLayer() {
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("scoutit_user");
      if (raw) setCurrentUser(JSON.parse(raw));
    } catch {}
  }, []);

  // Signed in -> their profile portal; signed out -> sign-up flow.
  const portalHref = currentUser?.name
    ? `/profile/${encodeURIComponent(currentUser.name)}`
    : "/onboarding";

  const modeLabel = currentUser
    ? (currentUser.primaryMode
        ? currentUser.primaryMode.charAt(0).toUpperCase() + currentUser.primaryMode.slice(1)
        : "Member")
    : "New Scout";

  const initial = currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : "+";

  return (
    <main
      className="min-h-screen bg-[#0d0d0d] text-white selection:bg-[#E8AE3C] selection:text-black overflow-x-hidden font-sans"
      style={{ paddingTop: "52px" }}
    >
      <LayerNav prev={{ href: "/layer/mantle", label: "Mantle" }} next={null} />

      <div className="fixed inset-0 pointer-events-none z-0">
        <BackgroundCore isLoggedIn={!!currentUser} />
      </div>

      {/* ════ OUTER CORE — "About You" (the sign-up request) ════ */}
      <section id="outer-core" className="core-section core-outer">
        <div className="core-outer-inner">
          <span className="vector-label">Layer 06 // The Core</span>

          <h1 className="core-title">
            {currentUser ? `Welcome back, ${currentUser.name}.` : "About You."}
          </h1>

          <p className="core-lead">
            {currentUser
              ? "You've breached the center. Your private command layer is one crack below — your profile, your tools, your activity, all in one place."
              : "You've descended through every layer of ScoutIt. This is where it becomes yours. Here's how the platform works for you — and why people make it their command center for space."}
          </p>

          <div className="core-actions">
            <Link href="/about-you" className="core-cta">About You →</Link>
            <span className="core-hint">Scroll to breach the inner core ↓</span>
          </div>

          <div className="layer-mission">
            <h3>Mission</h3>
            <p>The Core serves as the Personal Layer. Every layer above led here. This is the molten center where the platform becomes yours alone — your profile, your board, your saved spaces. It was always about you.</p>
          </div>
        </div>
      </section>

      {/* ════ INNER CORE — the user's profile portal / workspace ════ */}
      <section id="inner-core" className="core-section core-inner">
        <div className="core-inner-inner">
          <span className="vector-label">Inner Core // Your Workspace</span>

          <h2 className="core-inner-title">
            {currentUser ? "Your Portal." : "Claim Your Portal."}
          </h2>

          <p className="core-inner-lead">
            {currentUser
              ? "Everything you manage on ScoutIt lives here. Step into your profile to work on your account, listings, and presence."
              : "Sign up to open your own portal — a private workspace where you list assets, track activity, and build your public profile. Click through to begin."}
          </p>

          {/* The profile portal — clicking it directs the user to their profile. */}
          <Link href={portalHref} className="portal-card" aria-label={currentUser ? "Open your profile" : "Create your account"}>
            <div className="portal-glow" aria-hidden="true" />

            <div className="portal-head">
              <div className="portal-avatar">{initial}</div>
              <div className="portal-id">
                <div className="portal-name">{currentUser?.name || "Your Profile"}</div>
                <div className="portal-mode">{modeLabel}{currentUser ? " · Verified" : " · Not yet claimed"}</div>
              </div>
            </div>

            <div className="portal-stats">
              <div className="portal-stat">
                <span className="portal-stat-k">
                  {currentUser?.primaryMode === "provider"
                    ? "Profile Views"
                    : currentUser?.primaryMode === "buyer"
                    ? "Saved Spaces"
                    : currentUser
                    ? "Active Listings"
                    : "Listings"}
                </span>
                <span className="portal-stat-v">
                  {currentUser?.primaryMode === "provider"
                    ? "142"
                    : currentUser?.primaryMode === "buyer"
                    ? "07"
                    : currentUser
                    ? "03"
                    : "—"}
                </span>
              </div>
              <div className="portal-stat accent">
                <span className="portal-stat-k">{currentUser?.primaryMode === "buyer" ? "Curated Intel" : "New Leads"}</span>
                <span className="portal-stat-v">{currentUser ? (currentUser.primaryMode === "buyer" ? "02" : "12") : "—"}</span>
              </div>
            </div>

            <span className="portal-enter">
              {currentUser ? "Enter your profile →" : "Create your account →"}
            </span>
          </Link>

          {currentUser && (
            <div className="portal-shortcuts">
              <Link href="/dashboard" className="portal-shortcut">Open Dashboard</Link>
              <Link href="/settings" className="portal-shortcut">Account Settings</Link>
            </div>
          )}
        </div>
      </section>

      <style dangerouslySetInnerHTML={{ __html: `
        .core-section {
          position: relative;
          z-index: 10;
          min-height: calc(100vh - 52px);
          display: flex;
          align-items: center;
          padding: 80px clamp(24px, 6vw, 96px);
        }

        /* ── Outer Core ───────────────────────────── */
        .core-outer-inner {
          max-width: 720px;
        }
        .core-title {
          font-family: var(--font-display);
          font-size: clamp(44px, 6vw, 76px);
          line-height: 1.04;
          margin: 18px 0 22px;
          color: #f6efe6;
          text-shadow: 0 4px 36px rgba(0, 0, 0, 0.85);
        }
        .core-lead {
          font-family: var(--font-body);
          font-size: clamp(16px, 1.7vw, 19px);
          line-height: 1.7;
          color: rgba(255, 236, 210, 0.78);
          margin-bottom: 40px;
          max-width: 60ch;
          text-shadow: 0 2px 16px rgba(0, 0, 0, 0.7);
        }

        .core-actions {
          display: flex;
          align-items: center;
          gap: 22px;
          flex-wrap: wrap;
        }
        .core-cta {
          display: inline-block;
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
          cursor: pointer;
          text-decoration: none;
          transition: all 0.22s ease;
        }
        .core-cta:hover {
          background: var(--accent-bright);
          border-color: var(--accent-bright);
          box-shadow: 0 0 34px rgba(232, 174, 60, 0.45);
          transform: translateY(-2px);
        }
        .core-cta:focus-visible {
          outline: 1.5px solid var(--accent-bright);
          outline-offset: 3px;
        }
        .core-hint {
          font-family: var(--font-mono);
          font-size: 11px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--text-muted);
          font-style: italic;
          animation: pulse 2.4s ease-in-out infinite;
        }

        /* ── Inner Core ───────────────────────────── */
        .core-inner {
          justify-content: flex-end;
        }
        .core-inner-inner {
          width: 100%;
          max-width: 440px;
        }
        .core-inner-title {
          font-family: var(--font-display);
          font-size: clamp(34px, 4.5vw, 56px);
          line-height: 1.05;
          margin: 16px 0 18px;
          color: var(--accent);
          text-shadow: 0 4px 36px rgba(0, 0, 0, 0.85);
        }
        .core-inner-lead {
          font-size: 15px;
          line-height: 1.7;
          color: rgba(255, 236, 210, 0.78);
          margin-bottom: 32px;
          text-shadow: 0 2px 16px rgba(0, 0, 0, 0.7);
        }

        .portal-card {
          position: relative;
          display: block;
          text-decoration: none;
          background: var(--surface);
          border: 1px solid var(--surface-variant);
          border-radius: 12px;
          padding: 26px;
          box-shadow: 0 24px 50px rgba(0, 0, 0, 0.55);
          overflow: hidden;
          transition: border-color 0.25s ease, transform 0.25s ease, box-shadow 0.25s ease;
        }
        .portal-card:hover {
          border-color: var(--accent);
          transform: translateY(-4px);
          box-shadow: 0 30px 60px rgba(0, 0, 0, 0.6), 0 0 40px rgba(232, 174, 60, 0.12);
        }
        .portal-glow {
          position: absolute;
          top: -40%;
          right: -30%;
          width: 70%;
          height: 160%;
          background: radial-gradient(circle, rgba(232, 174, 60, 0.16) 0%, rgba(232, 174, 60, 0) 65%);
          pointer-events: none;
        }
        .portal-head {
          position: relative;
          display: flex;
          align-items: center;
          gap: 14px;
          padding-bottom: 20px;
          margin-bottom: 20px;
          border-bottom: 1px solid var(--surface-variant);
        }
        .portal-avatar {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: var(--accent);
          color: #0e0e0e;
          font-family: var(--font-display);
          font-size: 20px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .portal-name {
          font-size: 15px;
          font-weight: 700;
          color: #fff;
        }
        .portal-mode {
          font-family: var(--font-mono);
          font-size: 10px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--accent);
          margin-top: 3px;
        }
        .portal-stats {
          position: relative;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-bottom: 22px;
        }
        .portal-stat {
          background: rgba(0, 0, 0, 0.32);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 6px;
          padding: 14px;
        }
        .portal-stat.accent {
          background: rgba(232, 174, 60, 0.06);
          border-color: rgba(232, 174, 60, 0.2);
        }
        .portal-stat-k {
          display: block;
          font-family: var(--font-mono);
          font-size: 9.5px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--text-muted);
        }
        .portal-stat.accent .portal-stat-k {
          color: var(--accent);
        }
        .portal-stat-v {
          display: block;
          font-family: var(--font-display);
          font-size: 24px;
          color: #fff;
          margin-top: 6px;
        }
        .portal-stat.accent .portal-stat-v {
          color: var(--accent);
        }
        .portal-enter {
          position: relative;
          display: inline-block;
          font-family: var(--font-mono);
          font-size: 12px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--accent);
          transition: letter-spacing 0.2s ease;
        }
        .portal-card:hover .portal-enter {
          letter-spacing: 0.2em;
        }

        .portal-shortcuts {
          display: flex;
          gap: 12px;
          margin-top: 18px;
        }
        .portal-shortcut {
          font-family: var(--font-mono);
          font-size: 11px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--text-secondary);
          text-decoration: none;
          padding: 9px 16px;
          border: 1px solid var(--border-solid);
          border-radius: 4px;
          transition: all 0.2s ease;
        }
        .portal-shortcut:hover {
          color: var(--accent);
          border-color: var(--accent);
        }

        /* ── Responsive ───────────────────────────── */
        @media (max-width: 768px) {
          .core-guides {
            grid-template-columns: 1fr;
            gap: 16px;
          }
          .core-inner {
            justify-content: center;
            padding: 24px 16px;
          }
          .core-inner-inner {
            max-width: 520px;
          }
        }

        @media (max-width: 640px) {
          .core-inner {
            padding: 20px 14px;
          }
          .portal-shortcut {
            min-height: 48px;
            padding: 12px 16px;
          }
        }

        @media (max-width: 480px) {
          .core-inner {
            padding: 16px 12px;
          }
        }
      ` }} />
    </main>
  );
}
