"use client";

import Link from "next/link";
import ScoutItWordmark from "@/components/brand/ScoutItWordmark";
import ScoutItMark from "@/components/brand/ScoutItMark";

// ═══════════════════════════════════════════════════════════════
// SOCIAL LINKS — icons kept, URLs deliberately empty.
//
// Removed 2026-08-08. The footer previously linked to
// linkedin.com/company/scoutit, twitter.com/scoutit_ph and
// instagram.com/scoutit_ph — none of which are confirmed to be ours.
// ═══════════════════════════════════════════════════════════════
const SOCIAL_LINKS = [
  {
    name: "LinkedIn",
    url: null,
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
    url: null,
    icon: (
      <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z" />
    ),
  },
  {
    name: "Instagram",
    url: null,
    icon: (
      <>
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
      </>
    ),
  },
];

const FOOTER_SECTIONS = [
  {
    title: "Catalog & Spaces",
    links: [
      { label: "Space Catalog", href: "/property" },
      { label: "Commercial & Offices", href: "/property?type=Commercial" },
      { label: "Luxury Residences", href: "/property?type=Residential" },
      { label: "Restaurants & F&B", href: "/property?type=Restaurants" },
      { label: "Event Venues", href: "/property?type=Venues" },
      { label: "STR & Stays", href: "/property?type=STR" },
      { label: "Hospitality", href: "/property?type=Hospitality" },
    ],
  },
  {
    title: "Community & Signals",
    links: [
      { label: "Stratosphere Radar", href: "/stratosphere" },
      { label: "Community Signals", href: "/stratosphere?view=radar" },
      { label: "Post a Demand Signal", href: "/stratosphere?action=post" },
      { label: "Market Intel Briefings", href: "/intel" },
      { label: "6-Layer Descent", href: "/descent" },
      { label: "Your Board", href: "/wishlist" },
    ],
  },
  {
    title: "Professional Roster",
    links: [
      { label: "Licensed Brokers", href: "/brokers" },
      { label: "Spatial Photographers", href: "/photographers" },
      { label: "Area Researchers", href: "/researchers" },
      { label: "Event Planners", href: "/event-planners" },
      { label: "Pioneer Badges", href: "/badges" },
      { label: "Connects & Pricing", href: "/pricing" },
    ],
  },
  {
    title: "Ecosystem & Company",
    links: [
      { label: "About ScoutIt", href: "/about" },
      { label: "Platform Tour & Guide", href: "/platform-tour" },
      { label: "Owner Publishing Guide", href: "/tutorials/owner-publish" },
      { label: "Enterprise Solutions", href: "/enterprise" },
      { label: "Workspace Dashboard", href: "/dashboard" },
      { label: "Direct Support", href: "mailto:hello@scoutit.space", isExternal: true },
    ],
  },
];

const QUICK_LANES = [
  { label: "CATALOG", href: "/property" },
  { label: "SIGNALS", href: "/stratosphere?view=radar" },
  { label: "INTEL", href: "/intel" },
  { label: "ROSTER", href: "/brokers" },
  { label: "BOARD", href: "/wishlist" },
  { label: "DASH", href: "/dashboard" },
];

export default function Footer() {
  const activeSocials = SOCIAL_LINKS.filter((s) => s.url);
  return (
    <footer className="global-footer" role="contentinfo">
      <div className="footer-container">
        <div className="footer-branding">
          <ScoutItWordmark href="/" className="footer-brand" leading={<ScoutItMark />} />
          <p className="footer-tagline">
            Space intelligence for the Philippines. Clear, structured property briefings, spatial signals, and direct connections across homes, offices, venues, and hospitality spaces.
          </p>

          {/* Quick fast-track navigation for mobile and desktop */}
          <div className="footer-quick-bar" aria-label="Quick directory shortcuts">
            <span className="quick-bar-label">FAST LANES:</span>
            <div className="quick-bar-track">
              {QUICK_LANES.map((lane) => (
                <Link key={lane.label} href={lane.href} className="quick-bar-chip">
                  {lane.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Renders nothing while every SOCIAL_LINKS url is null */}
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

        <nav className="footer-nav-cols" aria-label="Footer navigation">
          {FOOTER_SECTIONS.map((section) => (
            <div key={section.title} className="nav-col">
              <h2>{section.title}</h2>
              {section.links.map((link) =>
                link.isExternal ? (
                  <a key={link.label} href={link.href}>
                    {link.label}
                  </a>
                ) : (
                  <Link key={link.label} href={link.href}>
                    {link.label}
                  </Link>
                )
              )}
            </div>
          ))}
        </nav>
      </div>

      <div className="footer-bottom">
        <div className="footer-bottom-container">
          <p className="footer-legal">
            © {new Date().getFullYear()} ScoutIt. Space Intelligence Platform. Real-estate services facilitated through ScoutIt are subject to applicable Philippine law, including RA 9646 where relevant. All rights reserved.
          </p>
          <div className="footer-meta-links">
            <Link href="/terms">Terms of Service</Link>
            <span className="meta-separator">•</span>
            <Link href="/privacy">Privacy Policy</Link>
            <span className="meta-separator">•</span>
            <a href="mailto:hello@scoutit.space">Contact</a>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .global-footer {
          background: var(--surface2);
          border-top: 1px solid var(--border);
          padding: 64px 24px calc(100px + env(safe-area-inset-bottom, 0px));
          font-family: var(--font-body, sans-serif);
          color: var(--text-secondary);
          position: relative;
          z-index: 10;
        }

        .footer-container {
          max-width: 1200px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 1.1fr 2.9fr;
          gap: 56px;
          margin-bottom: 40px;
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
          letter-spacing: 0.12em;
          text-decoration: none;
          line-height: 1;
        }

        .footer-brand .brand-scout { color: var(--text-primary); }
        .footer-brand .brand-s,
        .footer-brand .brand-it { color: var(--accent); }

        .footer-tagline {
          font-size: 14px;
          line-height: 1.6;
          color: var(--text-secondary);
          max-width: 320px;
          margin: 0;
        }

        /* Fast lanes quick bar */
        .footer-quick-bar {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-top: 8px;
          padding-top: 16px;
          border-top: 1px dashed var(--border);
        }

        .quick-bar-label {
          font-family: var(--font-mono), monospace;
          font-size: 12px;
          color: var(--accent);
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        .quick-bar-track {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-wrap: wrap;
        }

        .quick-bar-chip {
          font-family: var(--font-mono), monospace;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--text-secondary);
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid var(--border);
          border-radius: 4px;
          padding: 5px 9px;
          min-height: 32px;
          display: inline-flex;
          align-items: center;
          text-decoration: none;
          transition: border-color 0.2s, color 0.2s, background 0.2s;
        }

        .quick-bar-chip:hover {
          border-color: var(--accent);
          color: var(--accent-bright);
          background: rgba(var(--accent-rgb), 0.08);
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
          border: 1px solid rgba(var(--text-primary-rgb), 0.1);
          color: var(--text-secondary);
          transition: color 0.25s ease, background-color 0.25s ease, border-color 0.25s ease, transform 0.25s ease;
        }

        .social-link svg {
          width: 16px;
          height: 16px;
        }

        .social-link:hover {
          color: var(--accent);
          border-color: var(--accent);
          background: rgba(var(--accent-rgb), 0.08);
          transform: translateY(-2px);
        }

        .footer-nav-cols {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 28px;
        }

        .nav-col {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .nav-col h2 {
          font-family: var(--font-mono), monospace;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--accent);
          margin: 0 0 8px;
          padding-bottom: 6px;
          border-bottom: 1px solid rgba(var(--accent-rgb), 0.2);
        }

        .nav-col a {
          font-size: 13px;
          color: var(--text-secondary);
          text-decoration: none;
          line-height: 1.4;
          padding: 4px 0;
          min-height: 34px;
          display: inline-flex;
          align-items: center;
          transition: color 0.2s ease, transform 0.2s ease;
          width: fit-content;
        }

        .nav-col a:hover {
          color: var(--accent-bright);
          transform: translateX(2px);
        }

        .footer-bottom {
          border-top: 1px solid rgba(var(--text-primary-rgb), 0.08);
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
          font-family: var(--font-mono), monospace;
          font-size: 12px;
          color: var(--text-secondary);
          line-height: 1.5;
          margin: 0;
          max-width: 680px;
        }

        .footer-meta-links {
          display: flex;
          align-items: center;
          gap: 10px;
          font-family: var(--font-mono), monospace;
          font-size: 12px;
        }

        .footer-meta-links a {
          color: var(--text-secondary);
          text-decoration: none;
          transition: color 0.2s ease;
        }

        .footer-meta-links a:hover {
          color: var(--accent-bright);
        }

        .meta-separator {
          color: var(--text-muted);
          font-size: 12px;
        }

        /* Responsive Mobile Ergonomics (Antislop & Mobile Design) */
        @media (max-width: 900px) {
          .footer-container {
            grid-template-columns: 1fr;
            gap: 36px;
          }
          .footer-nav-cols {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 28px 20px;
          }
        }

        @media (max-width: 768px) {
          .global-footer {
            padding: 44px 16px calc(100px + env(safe-area-inset-bottom, 0px));
          }

          .footer-container {
            grid-template-columns: 1fr;
            gap: 32px;
            margin-bottom: 28px;
          }

          .footer-tagline {
            max-width: 100%;
          }

          /* 2-Column Balanced Grid on Mobile: eliminates endless single-column scroll */
          .footer-nav-cols {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 24px 14px;
          }

          .nav-col a {
            min-height: 38px;
            padding: 5px 0;
          }

          .footer-bottom-container {
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
          }
        }

        @media (max-width: 480px) {
          .global-footer {
            padding: 36px 12px calc(100px + env(safe-area-inset-bottom, 0px));
          }

          .footer-nav-cols {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 22px 10px;
          }

          .nav-col h2 {
            font-size: 12px;
          }

          .nav-col a {
            font-size: 12px;
            min-height: 36px;
          }
        }

        /* WHITE LENS support */
        :global(body.light-mode) .quick-bar-chip {
          background: var(--surface);
          border-color: var(--border-solid);
          color: var(--text-secondary);
        }
        :global(body.light-mode) .quick-bar-chip:hover {
          background: var(--accent-dim);
          border-color: var(--accent);
          color: var(--accent);
        }
        :global(body.light-mode) .nav-col h2 {
          color: var(--accent);
          border-bottom-color: var(--accent-muted);
        }
        :global(body.light-mode) .nav-col a {
          color: var(--text-secondary);
        }
        @media (hover: hover) and (pointer: fine) {
          :global(body.light-mode) .nav-col a:hover {
            color: var(--accent);
          }
        }
      `}</style>
    </footer>
  );
}
