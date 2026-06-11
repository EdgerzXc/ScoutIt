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
      
      <Link href="/" className="header-brand" aria-label="ScoutIT — home">
        <span className="brand-scout">Scout</span><span className="brand-it">IT</span>
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
          <Link href="/intel">Intel</Link>
          <Link href="/brokers">Brokers</Link>
          <Link href="/photographers">Photographers</Link>
          <Link href="/researchers">Researchers</Link>
          <Link href="/event-planners">Event Planners</Link>
          <Link href="/wishlist">Your Board</Link>
          <Link href="/dashboard">Dashboard</Link>
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
          -webkit-backdrop-filter: blur(12px);
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
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 44px; /* Mobile touch target compliance */
        }

        .header-back-btn:hover {
          border-color: var(--accent);
          color: var(--accent);
          background: rgba(200, 169, 110, 0.1);
        }

        .header-brand {
          font-family: Georgia, 'Times New Roman', serif;
          font-weight: 400;
          font-size: 30px;
          letter-spacing: 3px;
          position: absolute;
          left: 50%;
          transform: translateX(-50%);
          text-decoration: none;
          white-space: nowrap;
          line-height: 1;
        }
        .header-brand .brand-scout { color: #f5f3ee; }
        .header-brand .brand-it { color: var(--accent); transition: text-shadow 0.3s ease; }
        .header-brand:hover .brand-it { text-shadow: 0 0 14px rgba(200, 169, 110, 0.55); }

        .header-nav {
          position: relative;
        }

        .header-menu-btn {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          border: 1px solid var(--border-mid);
          background: var(--brand-overlay);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.25s ease;
          touch-action: manipulation;
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
          -webkit-backdrop-filter: blur(16px);
          box-shadow: 0 12px 40px rgba(0,0,0,0.5);
          opacity: 0;
          visibility: hidden;
          transform: translateY(-6px);
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          z-index: 1001;
        }

        .header-dropdown.open {
          opacity: 1;
          visibility: visible;
          transform: translateY(0);
        }

        .header-dropdown a {
          display: block;
          padding: 12px 14px;
          font-size: 13px;
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

        /* ── MOBILE OPTIMIZATIONS ── */
        @media (max-width: 768px) {
          .global-header {
            padding: 10px 16px;
          }
          
          .header-brand {
            font-size: 24px;
            letter-spacing: 2px;
          }

          .header-back-btn {
            font-size: 10px;
            padding: 0 12px;
            min-height: 38px;
          }
          
          .header-menu-btn {
            width: 38px;
            height: 38px;
          }
          
          .header-dropdown {
            min-width: 160px;
            padding: 6px;
          }
          
          .header-dropdown a {
            padding: 10px 12px;
            font-size: 12px;
          }
        }
        
        @media (max-width: 640px) {
          .global-header {
            padding: 8px 14px;
            gap: 8px;
          }
          
          .header-brand {
            font-size: 22px;
            letter-spacing: 2px;
          }

          .header-back-btn {
            font-size: 9px;
            padding: 0 10px;
            min-height: 36px;
            white-space: nowrap;
          }
          
          .header-menu-btn {
            width: 36px;
            height: 36px;
          }
          
          .header-dropdown {
            position: fixed;
            top: auto;
            bottom: 0;
            right: 0;
            left: 0;
            min-width: 100%;
            border-radius: 12px 12px 0 0;
            border-left: none;
            border-right: none;
            border-bottom: none;
            max-height: 60vh;
            overflow-y: auto;
            padding: 12px;
            box-shadow: 0 -4px 20px rgba(0,0,0,0.6);
          }
          
          .header-dropdown.open {
            animation: slideUpMobile 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          }
          
          .header-dropdown a {
            padding: 14px 12px;
            font-size: 13px;
            min-height: 44px;
            display: flex;
            align-items: center;
            border-radius: 6px;
          }
          
          .header-dropdown a:active {
            background: rgba(200, 169, 110, 0.15);
          }
          
          .header-dropdown .dropdown-brand {
            font-size: 8px;
            padding: 8px 12px 4px;
            margin-bottom: 8px;
          }
        }
        
        @media (max-width: 480px) {
          .header-back-btn {
            font-size: 8px;
            padding: 0 8px;
            min-height: 36px;
          }
          
          .header-brand {
            font-size: 20px;
            margin: 0 4px;
          }
          
          .header-menu-btn {
            width: 36px;
            height: 36px;
          }
          
          .header-menu-btn svg {
            width: 14px;
            height: 14px;
          }
        }
        
        /* Animation for mobile dropdown */
        @keyframes slideUpMobile {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        
        /* Touch-friendly active state */
        @media (hover: none) and (pointer: coarse) {
          .header-dropdown a {
            min-height: 48px;
          }
          
          .header-menu-btn,
          .header-back-btn {
            -webkit-tap-highlight-color: rgba(200, 169, 110, 0.15);
          }
        }
      `}</style>
    </header>
  );
}

