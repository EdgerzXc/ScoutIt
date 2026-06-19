"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  {
    href: "/",
    label: "Home",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    ),
  },
  {
    href: "/property",
    label: "Spaces",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7"/>
        <rect x="14" y="3" width="7" height="7"/>
        <rect x="3" y="14" width="7" height="7"/>
        <rect x="14" y="14" width="7" height="7"/>
      </svg>
    ),
  },
  {
    href: "/discover",
    label: "Discover",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8"/>
        <line x1="21" y1="21" x2="16.65" y2="16.65"/>
      </svg>
    ),
  },
  {
    href: "/wishlist",
    label: "Board",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
      </svg>
    ),
  },
  {
    href: "/intel",
    label: "Intel",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
      </svg>
    ),
  },
];

export default function BottomNav() {
  const pathname = usePathname();

  // Determine active item — exact match for home, prefix match for others
  const isActive = (href) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <nav className="bottom-nav" aria-label="Main navigation">
      {NAV_ITEMS.map((item) => {
        const active = isActive(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`bottom-nav-item${active ? " active" : ""}`}
            aria-current={active ? "page" : undefined}
          >
            <span className="bottom-nav-icon">{item.icon}</span>
            <span className="bottom-nav-label">{item.label}</span>
            {active && <span className="bottom-nav-dot" aria-hidden="true" />}
          </Link>
        );
      })}

      <style>{`
        .bottom-nav {
          display: none;
        }

        @media (max-width: 768px) {
          .bottom-nav {
            display: flex;
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            z-index: 900;
            background: rgba(12, 11, 9, 0.96);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border-top: 1px solid rgba(255, 255, 255, 0.07);
            padding: 8px 0 max(12px, env(safe-area-inset-bottom));
            justify-content: space-around;
            align-items: flex-start;
          }

          .bottom-nav-item {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 4px;
            padding: 6px 12px;
            min-width: 56px;
            text-decoration: none;
            color: rgba(200, 200, 200, 0.5);
            transition: color 0.2s ease;
            position: relative;
            -webkit-tap-highlight-color: transparent;
            touch-action: manipulation;
          }

          .bottom-nav-item.active {
            color: var(--accent);
          }

          .bottom-nav-item:active {
            transform: scale(0.93);
            transition: transform 0.1s ease;
          }

          .bottom-nav-icon {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 26px;
            height: 26px;
          }

          .bottom-nav-icon svg {
            width: 22px;
            height: 22px;
            transition: stroke 0.2s ease;
          }

          .bottom-nav-item.active .bottom-nav-icon svg {
            stroke: var(--accent);
            filter: drop-shadow(0 0 6px rgba(255, 184, 0, 0.4));
          }

          .bottom-nav-label {
            font-family: var(--font-mono);
            font-size: 9px;
            font-weight: 600;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            line-height: 1;
          }

          .bottom-nav-dot {
            position: absolute;
            top: 2px;
            left: 50%;
            transform: translateX(-50%);
            width: 3px;
            height: 3px;
            border-radius: 50%;
            background: var(--accent);
            box-shadow: 0 0 6px rgba(255, 184, 0, 0.6);
          }
        }
      `}</style>
    </nav>
  );
}
