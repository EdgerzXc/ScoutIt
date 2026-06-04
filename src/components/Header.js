"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";

export default function Header() {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function onClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  return (
    <header className="global-header">
      <button 
        onClick={() => {
          if (window.history.length > 1) {
            router.back();
          } else {
            router.push("/");
          }
        }} 
        className="header-back-btn"
      >
        ← Back
      </button>
      
      <Link href="/" className="header-brand">
        SCOUTIT
      </Link>

      <nav className="header-nav" ref={menuRef}>
        <button
          className="header-menu-btn"
          type="button"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(v => !v)}
          aria-label="Menu"
        >
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M2 4h12M2 8h12M2 12h12"/>
          </svg>
        </button>
        <div className={`header-dropdown ${menuOpen ? "open" : ""}`}>
          <div className="dropdown-brand">ScoutIt</div>
          <Link href="/">Home</Link>
          <Link href="/discover">Discover</Link>
          <Link href="/discover">News</Link>
          <Link href="/brokers">Brokers</Link>
          <Link href="/photographers">Photographers</Link>
          <Link href="/researchers">Researchers</Link>
          <Link href="/event-planners">Event Planners</Link>
          <Link href="/wishlist">Your Board</Link>
          <Link href="/about">About</Link>
        </div>
      </nav>
      
      <style>{`
        .global-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 24px;
          background: rgba(14, 14, 14, 0.85);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid var(--border-solid);
          position: sticky;
          top: 0;
          z-index: 1000;
          font-family: var(--font-body);
        }

        .header-back-btn {
          background: var(--brand-overlay);
          border: 1px solid var(--border-mid);
          color: var(--text-secondary);
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          padding: 8px 16px;
          border-radius: 20px;
          cursor: pointer;
          transition: all 0.25s ease;
        }

        .header-back-btn:hover {
          border-color: var(--accent);
          color: var(--accent);
          background: rgba(200, 169, 110, 0.1);
        }

        .header-brand {
          font-family: var(--font-display);
          font-size: 18px;
          font-weight: bold;
          letter-spacing: 0.18em;
          color: var(--accent);
          position: absolute;
          left: 50%;
          transform: translateX(-50%);
          text-decoration: none;
          transition: text-shadow 0.3s ease;
        }

        .header-brand:hover {
          text-shadow: 0 0 10px rgba(200, 169, 110, 0.4);
          color: var(--accent);
        }

        .header-nav {
          position: relative;
        }

        .header-menu-btn {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          border: 1px solid var(--border-mid);
          background: var(--brand-overlay);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.25s ease;
        }

        .header-menu-btn:hover {
          background: rgba(200, 169, 110, 0.15);
          border-color: var(--accent-border);
        }

        .header-menu-btn svg {
          width: 16px;
          height: 16px;
          stroke: var(--text-primary);
        }

        .header-dropdown {
          position: absolute;
          top: calc(100% + 8px);
          right: 0;
          min-width: 180px;
          background: var(--brand-overlay);
          border: 1px solid var(--border-mid);
          border-radius: 6px;
          padding: 8px;
          backdrop-filter: blur(16px);
          box-shadow: 0 12px 40px rgba(0,0,0,0.5);
          opacity: 0;
          visibility: hidden;
          transform: translateY(-6px);
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .header-dropdown.open {
          opacity: 1;
          visibility: visible;
          transform: translateY(0);
        }

        .header-dropdown a {
          display: block;
          padding: 10px 14px;
          font-size: 12px;
          font-weight: 500;
          color: var(--text-secondary);
          text-decoration: none;
          border-radius: 4px;
          transition: all 0.2s ease;
        }

        .header-dropdown a:hover {
          background: rgba(255, 255, 255, 0.06);
          color: var(--text-primary);
          padding-left: 18px;
        }

        .header-dropdown .dropdown-brand {
          font-size: 9px;
          font-weight: 600;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: var(--accent);
          padding: 8px 14px 4px;
          pointer-events: none;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          margin-bottom: 6px;
        }
      `}</style>
    </header>
  );
}
