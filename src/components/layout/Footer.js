"use client";

import Link from "next/link";

// ═══════════════════════════════════════════════════════════════
// SOCIAL LINKS — icons kept, URLs deliberately empty.
//
// Removed 2026-08-08. The footer previously linked to
// linkedin.com/company/scoutit, twitter.com/scoutit_ph and
// instagram.com/scoutit_ph — none of which are confirmed to be ours. There is
// an established Scoutit in India with a LinkedIn company page, and linking to
// it from every page of this site tells Google the two are the same company.
// Same reason `sameAs` was removed from JsonLd.js on the same day.
//
// ── TO TURN ONE BACK ON ─────────────────────────────────────────
// 1. Create the account and confirm the handle is really yours.
// 2. Paste the URL into `url` below. That is the only change needed here —
//    an entry with `url: null` renders nothing, and the whole row disappears
//    if every url is null.
// 3. ⚠️ ALSO add it to `sameAs` in src/components/seo/JsonLd.js — one at a
//    time, only once verified. The footer link and the sameAs assertion must
//    agree; that mismatch is what caused this in the first place.
// ═══════════════════════════════════════════════════════════════
const SOCIAL_LINKS = [
  {
    name: "LinkedIn",
    url: null, // e.g. "https://linkedin.com/company/<your-handle>"
    icon: (
      <>
        <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
        <rect x="2" y="9" width="4" height="12" />
        <circle cx="4" cy="4" r="2" />
      </>
    ),
  },
  {
    name: "Twitter",
    url: null, // e.g. "https://twitter.com/<your-handle>"
    icon: (
      <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z" />
    ),
  },
  {
    name: "Instagram",
    url: null, // e.g. "https://instagram.com/<your-handle>"
    icon: (
      <>
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
      </>
    ),
  },
];

export default function Footer() {
  const activeSocials = SOCIAL_LINKS.filter((s) => s.url);
  return (
    <footer className="global-footer">
      <div className="footer-container">
        <div className="footer-branding">
          <Link href="/" className="footer-brand">
            <span className="brand-s">S</span><span className="brand-scout">cout</span><span className="brand-it">IT</span>
          </Link>
          <p className="footer-tagline">
            The Philippines&apos; first spatial commerce platform. Every kind of space decoded into clear, verified intelligence. Homes, offices, venues, tables.
          </p>
          {/* Renders nothing while every SOCIAL_LINKS url is null. */}
          {activeSocials.length > 0 && (
            <div className="footer-socials">
              {activeSocials.map((s) => (
                <a
                  key={s.name}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.name}
                  className="social-link"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    {s.icon}
                  </svg>
                </a>
              ))}
            </div>
          )}
        </div>

        <div className="footer-nav-cols">
          <div className="nav-col">
            <h2>Platform</h2>
            <Link href="/discover">Discover</Link>
            <Link href="/property">Space Directory</Link>
            <Link href="/intel">Intel briefings</Link>
            <Link href="/wishlist">Your Board</Link>
            <Link href="/badges">Badges</Link>
          </div>

          <div className="nav-col">
            <h2>Services</h2>
            <Link href="/brokers">Brokers</Link>
            <Link href="/photographers">Photographers</Link>
            <Link href="/researchers">Researchers</Link>
            <Link href="/event-planners">Event Planners</Link>
            <Link href="/pricing">Pricing & Tiers</Link>
          </div>

          <div className="nav-col">
            <h2>Company</h2>
            <Link href="/about">About Us</Link>
            <Link href="/enterprise">Enterprise</Link>
            <Link href="/dashboard">Dashboard</Link>
            <Link href="/contact">Contact</Link>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="footer-bottom-container">
          {/* ⚠️ WAS "Philippine operations governed by RA 9646." Changed
              2026-08-08 — ⚖️ THIS WORDING STILL NEEDS A LAWYER'S REVIEW.

              RA 9646 (RESA) regulates real estate SERVICE PRACTITIONERS. The
              old line claimed the whole of ScoutIt is governed by it, which is
              (a) too broad — ScoutIt is intelligence, software, restaurants,
              venues, photographers and researchers — and (b) the direct
              opposite of what /terms says at length: that ScoutIt is
              "deliberately and strictly NOT a real estate broker, salesperson,
              appraiser, consultant, or real estate dealer under Republic Act
              No. 9646."

              So the footer contradicted the Terms on every page of the site.
              The Terms wording is the careful one. This narrows the claim to
              match it: the statute applies to the real-estate services
              facilitated through the platform, not to the platform itself. */}
          <p className="footer-legal">
            © {new Date().getFullYear()} ScoutIt. Space Intelligence Platform. Real-estate services facilitated through ScoutIt are subject to applicable Philippine law, including RA 9646 where relevant. All rights reserved.
          </p>
          <div className="footer-meta-links">
            <Link href="/terms">Terms of Service</Link>
            <span className="meta-separator">•</span>
            <Link href="/privacy">Privacy Policy</Link>
            <span className="meta-separator">•</span>
            <Link href="/contact">Contact</Link>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .global-footer {
          background: var(--surface2, #090909);
          border-top: 1px solid var(--border, rgba(255, 255, 255, 0.08));
          padding: 64px 24px 24px;
          font-family: var(--font-body, sans-serif);
          color: var(--text-secondary, #a0a0a0);
          position: relative;
          z-index: 10;
        }

        .footer-container {
          max-width: 1200px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 1.5fr 2fr;
          gap: 64px;
          margin-bottom: 48px;
        }

        .footer-branding {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .footer-brand {
          font-family: var(--font-display);
          font-weight: 400;
          font-size: 26px;
          letter-spacing: 2px;
          text-decoration: none;
          line-height: 1;
        }

        .footer-brand .brand-scout { color: var(--text-primary, #f5f3ee); }
        .footer-brand .brand-s,
        .footer-brand .brand-it { color: var(--accent, #E8AE3C); }

        .footer-tagline {
          font-size: 14px;
          line-height: 1.6;
          color: var(--text-secondary, #c8c8c8);
          max-width: 320px;
        }

        .footer-socials {
          display: flex;
          gap: 12px;
          margin-top: 8px;
        }

        .social-link {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: var(--text-secondary, #c8c8c8);
          transition: all 0.25s ease;
        }

        .social-link svg {
          width: 16px;
          height: 16px;
        }

        .social-link:hover {
          color: var(--accent, #E8AE3C);
          border-color: var(--accent, #E8AE3C);
          background: rgba(232, 174, 60, 0.08);
          transform: translateY(-2px);
        }

        .footer-nav-cols {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 32px;
        }

        .nav-col {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .nav-col h2 {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: var(--text-primary);
          margin-bottom: 8px;
        }

        .nav-col a {
          font-size: 13px;
          color: var(--text-secondary, #c8c8c8);
          text-decoration: none;
          transition: all 0.2s ease;
          width: fit-content;
        }

        .nav-col a:hover {
          color: var(--accent, #E8AE3C);
          padding-left: 4px;
        }

        .footer-bottom {
          border-top: 1px solid rgba(255, 255, 255, 0.05);
          padding-top: 24px;
        }

        .footer-bottom-container {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 16px;
        }

        .footer-legal {
          font-size: 12px;
          color: var(--text-secondary);
          line-height: 1.5;
        }

        .footer-meta-links {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
        }

        .footer-meta-links a {
          color: var(--text-secondary);
          text-decoration: none;
          transition: color 0.2s ease;
        }

        .footer-meta-links a:hover {
          color: var(--accent, #E8AE3C);
        }

        .meta-separator {
          color: var(--text-muted);
          font-size: 10px;
        }

        @media (max-width: 768px) {
          .global-footer {
            padding: 48px 16px 24px;
          }

          .footer-container {
            grid-template-columns: 1fr;
            gap: 40px;
            margin-bottom: 32px;
          }

          .footer-tagline {
            max-width: 100%;
          }

          .footer-nav-cols {
            grid-template-columns: 1fr;
            gap: 24px;
          }

          .footer-bottom-container {
            flex-direction: column;
            align-items: flex-start;
          }
        }
      `}</style>
    </footer>
  );
}
