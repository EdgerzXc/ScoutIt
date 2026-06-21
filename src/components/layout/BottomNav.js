"use client";

import { useState, useEffect } from "react";
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

const DASHBOARD_ITEMS = [
  {
    id: "dashboard-home",
    href: "/dashboard",
    label: "Dashboard",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7"/>
        <rect x="14" y="3" width="7" height="7"/>
        <rect x="14" y="14" width="7" height="7"/>
        <rect x="3" y="14" width="7" height="7"/>
      </svg>
    ),
  },
  {
    id: "dashboard-mode",
    action: "scoutit:open-mobile-menu",
    label: "Role",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
        <circle cx="12" cy="7" r="4"/>
      </svg>
    ),
  },
  {
    id: "dashboard-theme",
    action: "open-theme-sheet",
    label: "Theme",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    ),
  },
  {
    id: "dashboard-discover",
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
    id: "dashboard-board",
    href: "/wishlist",
    label: "Board",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
      </svg>
    ),
  },
];

export default function BottomNav() {
  const pathname = usePathname();
  const [themeSheetOpen, setThemeSheetOpen] = useState(false);
  const [currentMode, setCurrentMode] = useState("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const legacy = localStorage.getItem("scoutit_accessibility_mode") === "high-contrast" ? "high-contrast" : null;
    const savedMode = localStorage.getItem("scoutit_display_mode") || legacy || "dark";
    setCurrentMode(savedMode);
    setMounted(true);
  }, []);

  const changeMode = (m) => {
    setCurrentMode(m);
    document.body.classList.remove("high-contrast", "light-mode");
    if (m === "high-contrast") document.body.classList.add("high-contrast");
    if (m === "light") document.body.classList.add("light-mode");
    localStorage.setItem("scoutit_display_mode", m);
    setTimeout(() => setThemeSheetOpen(false), 300);
  };

  // Determine active item — exact match for home, prefix match for others
  const isActive = (href) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  const isDashboard = pathname.startsWith("/dashboard");
  const itemsToRender = isDashboard ? DASHBOARD_ITEMS : NAV_ITEMS;

  if (!mounted) return null;

  return (
    <>
      <nav className="bottom-nav" aria-label="Main navigation">
        {itemsToRender.map((item) => {
          const active = item.href ? isActive(item.href) : false;

          const content = (
            <>
              <span className="bottom-nav-icon">{item.icon}</span>
              <span className="bottom-nav-label">{item.label}</span>
              {active && <span className="bottom-nav-dot" aria-hidden="true" />}
            </>
          );

          if (item.href) {
            return (
              <Link
                key={item.id || item.href}
                href={item.href}
                className={`bottom-nav-item${active ? " active" : ""}`}
                aria-current={active ? "page" : undefined}
              >
                {content}
              </Link>
            );
          }

          return (
            <button
              key={item.id}
              className="bottom-nav-item"
              onClick={() => {
                if (item.action === "scoutit:open-mobile-menu") {
                  window.dispatchEvent(new CustomEvent("scoutit:open-mobile-menu"));
                } else if (item.action === "open-theme-sheet") {
                  setThemeSheetOpen(true);
                }
              }}
            >
              {content}
            </button>
          );
        })}
      </nav>

      {/* Theme Action Sheet */}
      {themeSheetOpen && (
        <div className="theme-sheet-overlay" onClick={() => setThemeSheetOpen(false)}>
          <div className="theme-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="theme-sheet-header">
              <span className="theme-sheet-title">Display Settings</span>
              <button className="theme-sheet-close" onClick={() => setThemeSheetOpen(false)}>✕</button>
            </div>
            <div className="theme-sheet-options">
              {[
                { key: "dark", label: "Dark Mode", desc: "Cosmic default", dot: "#1e1e1e", dotBorder: "rgba(255,255,255,0.18)" },
                { key: "light", label: "Light Mode", desc: "Bright, open reading", dot: "#f0ede8", dotBorder: "rgba(0,0,0,0.18)" },
                { key: "high-contrast", label: "High Contrast", desc: "Maximum readability", dot: "#ffb800", dotBorder: "rgba(255,184,0,0.4)" },
              ].map(({ key, label, desc, dot, dotBorder }) => (
                <button
                  key={key}
                  className={`theme-option ${currentMode === key ? "active" : ""}`}
                  onClick={() => changeMode(key)}
                >
                  <div className="theme-dot" style={{ background: dot, border: `1.5px solid ${dotBorder}` }} />
                  <div className="theme-text">
                    <div className="theme-label">{label}</div>
                    <div className="theme-desc">{desc}</div>
                  </div>
                  {currentMode === key && <span className="theme-check">✓</span>}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

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

          .theme-sheet-overlay {
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.6);
            backdrop-filter: blur(4px);
            -webkit-backdrop-filter: blur(4px);
            z-index: 1000;
            display: flex;
            align-items: flex-end;
            animation: fadeIn 0.3s ease;
          }

          .theme-sheet {
            width: 100%;
            background: var(--surface);
            border-top: 1px solid var(--border-mid);
            border-radius: 20px 20px 0 0;
            padding: 24px 20px calc(24px + env(safe-area-inset-bottom));
            animation: slideUpFromBottom 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          }

          .theme-sheet-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 24px;
          }

          .theme-sheet-title {
            font-family: var(--font-mono);
            font-size: 11px;
            color: var(--accent);
            letter-spacing: 0.2em;
            text-transform: uppercase;
          }

          .theme-sheet-close {
            background: none;
            border: none;
            color: var(--text-secondary);
            font-size: 18px;
            cursor: pointer;
          }

          .theme-sheet-options {
            display: flex;
            flex-direction: column;
            gap: 12px;
          }

          .theme-option {
            width: 100%;
            background: rgba(255, 255, 255, 0.025);
            border: 1px solid rgba(255, 255, 255, 0.06);
            border-radius: 12px;
            padding: 16px;
            display: flex;
            align-items: center;
            gap: 16px;
            text-align: left;
            transition: all 0.2s;
          }

          .theme-option.active {
            background: rgba(255, 184, 0, 0.09);
            border-color: rgba(255, 184, 0, 0.3);
          }

          .theme-dot {
            width: 16px;
            height: 16px;
            border-radius: 50%;
            flex-shrink: 0;
          }

          .theme-text {
            flex: 1;
          }

          .theme-label {
            font-family: var(--font-body);
            font-size: 15px;
            color: var(--text-primary);
            font-weight: 500;
          }

          .theme-option.active .theme-label {
            color: var(--accent);
            font-weight: 600;
          }

          .theme-desc {
            font-family: var(--font-body);
            font-size: 12px;
            color: var(--text-secondary);
            margin-top: 2px;
          }

          .theme-check {
            color: var(--accent);
            font-size: 16px;
          }

          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }

          @keyframes slideUpFromBottom {
            from { transform: translateY(100%); }
            to { transform: translateY(0); }
          }
        }
      `}</style>
    </>
  );
}
