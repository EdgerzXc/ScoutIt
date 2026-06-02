"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Header() {
  const router = useRouter();

  return (
    <header className="global-header">
      <button onClick={() => router.back()} className="header-back-btn">
        ← Back
      </button>
      
      <div className="header-brand">
        SCOUTIT
      </div>

      <Link href="/" className="header-home-link">
        ⌂ Home
      </Link>

      <style>{`
        .global-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 24px;
          background: var(--surface);
          border-bottom: 1px solid var(--border-solid);
          position: sticky;
          top: 0;
          z-index: 1000;
          font-family: var(--font-body);
        }

        .header-back-btn, .header-home-link {
          background: transparent;
          border: 1px solid var(--border-solid);
          color: var(--text-secondary);
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          text-decoration: none;
          padding: 8px 16px;
          border-radius: var(--radius-sm);
          cursor: pointer;
          transition: var(--transition-fast);
        }

        .header-back-btn:hover, .header-home-link:hover {
          border-color: var(--accent);
          color: var(--accent);
        }

        .header-brand {
          font-family: var(--font-display);
          font-size: 16px;
          font-weight: bold;
          letter-spacing: 0.15em;
          color: var(--accent);
          position: absolute;
          left: 50%;
          transform: translateX(-50%);
        }
      `}</style>
    </header>
  );
}
