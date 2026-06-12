"use client";

import Link from "next/link";

export default function Footer() {
  return (
    <footer className="global-footer">
      <div className="footer-container">
        <div className="footer-branding">
          <Link href="/" className="footer-brand">
            <span className="brand-scout">Scout</span><span className="brand-it">IT</span>
          </Link>
          <p className="footer-tagline">
            Next-generation space intelligence and verification platform for high-value Philippine properties.
          </p>
          <div className="footer-socials">
            <a href="#" aria-label="LinkedIn" className="social-link">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
                <rect x="2" y="9" width="4" height="12"/>
                <circle cx="4" cy="4" r="2"/>
              </svg>
            </a>
            <a href="#" aria-label="Twitter" className="social-link">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"/>
              </svg>
            </a>
            <a href="#" aria-label="Instagram" className="social-link">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
              </svg>
            </a>
          </div>
        </div>

        <div className="footer-nav-cols">
          <div className="nav-col">
            <h3>Platform</h3>
            <Link href="/discover">Discover Spaces</Link>
            <Link href="/intel">Intel briefings</Link>
            <Link href="/wishlist">Your Board</Link>
          </div>
          
          <div className="nav-col">
            <h3>Services</h3>
            <Link href="/brokers">Brokers</Link>
            <Link href="/photographers">Photographers</Link>
            <Link href="/researchers">Researchers</Link>
            <Link href="/event-planners">Event Planners</Link>
          </div>

          <div className="nav-col">
            <h3>Company</h3>
            <Link href="/about">About Us</Link>
            <Link href="/dashboard">Dashboard</Link>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="footer-bottom-container">
          <p className="footer-legal">
            © {new Date().getFullYear()} ScoutIt. Space Intelligence Platform. Philippine operations governed by RA 9646. All rights reserved.
          </p>
          <div className="footer-meta-links">
            <a href="#">Terms of Service</a>
            <span className="meta-separator">•</span>
            <a href="#">Privacy Policy</a>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .global-footer {
          background: #090909;
          border-top: 1px solid var(--border-solid, rgba(255, 255, 255, 0.08));
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
          font-family: Georgia, 'Times New Roman', serif;
          font-weight: 400;
          font-size: 26px;
          letter-spacing: 2px;
          text-decoration: none;
          line-height: 1;
        }

        .footer-brand .brand-scout { color: #f5f3ee; }
        .footer-brand .brand-it { color: var(--accent, #ffb800); }

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
          color: var(--accent, #ffb800);
          border-color: var(--accent, #ffb800);
          background: rgba(255, 184, 0, 0.08);
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

        .nav-col h3 {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: #f5f3ee;
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
          color: var(--accent, #ffb800);
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
          color: var(--text-muted, #8f8c87);
          line-height: 1.5;
        }

        .footer-meta-links {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
        }

        .footer-meta-links a {
          color: var(--text-muted, #8f8c87);
          text-decoration: none;
          transition: color 0.2s ease;
        }

        .footer-meta-links a:hover {
          color: var(--accent, #ffb800);
        }

        .meta-separator {
          color: #444444;
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
