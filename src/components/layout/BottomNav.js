"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { getStoredLiteMode, setLiteMode } from "@/lib/liteMode";

// Common Icons Collection to avoid repeating SVGs
const ICONS = {
  home: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  ),
  spaces: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7"/>
      <rect x="14" y="3" width="7" height="7"/>
      <rect x="3" y="14" width="7" height="7"/>
      <rect x="14" y="14" width="7" height="7"/>
    </svg>
  ),
  discover: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/>
      <line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  ),
  board: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
    </svg>
  ),
  intel: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
    </svg>
  ),
  dashboard: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7"/>
      <rect x="14" y="3" width="7" height="7"/>
      <rect x="14" y="14" width="7" height="7"/>
      <rect x="3" y="14" width="7" height="7"/>
    </svg>
  ),
  role: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  ),
  theme: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  back: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  ),
  save: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
  ),
  inquire: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8z" />
    </svg>
  ),
  share: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
  )
};

// Reusable Action / Link Item Definitions
const ITEMS = {
  home:      { id: "home",      href: "/",          label: "Home",      icon: ICONS.home },
  spaces:    { id: "spaces",    href: "/property",  label: "Spaces",    icon: ICONS.spaces },
  discover:  { id: "discover",  href: "/discover",  label: "Discover",  icon: ICONS.discover },
  board:     { id: "board",     href: "/wishlist",  label: "Board",     icon: ICONS.board },
  intel:     { id: "intel",     href: "/intel",     label: "Intel",     icon: ICONS.intel },
  dashboard: { id: "dashboard", href: "/dashboard", label: "Dash",      icon: ICONS.dashboard },
  role:      { id: "role",      action: "scoutit:open-mobile-menu", label: "Role",  icon: ICONS.role },
  theme:     { id: "theme",     action: "open-theme-sheet",         label: "Theme", icon: ICONS.theme }
};

// Contextual Layout Configurations.
// IA rules (mobile bottom nav, ≤5 items):
//   • Slot 1 (left) anchors the section you're in — "you are here".
//   • Home stays reachable from every context.
//   • Slots 2–4 are the most useful onward destinations for that page.
//   • Theme/display is a utility, so it always sits in the last slot —
//     never in the prime, thumb-reachable centre.
const CONTEXTS = {
  default:   [ITEMS.home,      ITEMS.spaces,    ITEMS.discover, ITEMS.intel,  ITEMS.theme],
  dashboard: [ITEMS.dashboard, ITEMS.home,      ITEMS.discover, ITEMS.role,   ITEMS.theme],
  board:     [ITEMS.board,     ITEMS.home,      ITEMS.spaces,   ITEMS.discover, ITEMS.theme],
  discover:  [ITEMS.discover,  ITEMS.home,      ITEMS.spaces,   ITEMS.board,  ITEMS.theme],
  spaces:    [ITEMS.spaces,    ITEMS.home,      ITEMS.discover, ITEMS.board,  ITEMS.theme],
  intel:     [ITEMS.intel,     ITEMS.home,      ITEMS.spaces,   ITEMS.board,  ITEMS.theme]
};


export default function BottomNav() {
  const pathname = usePathname();
  const [themeSheetOpen, setThemeSheetOpen] = useState(false);
  const [currentMode, setCurrentMode] = useState("dark");
  const [lite, setLite] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [shareToast, setShareToast] = useState("");

  // On a single property page (/property/<slug>) the bar becomes an ACTION bar
  // — the page's real jobs (save, inquire, share) under the thumb, not nav links.
  const propertyMatch = pathname.match(/^\/property\/([^/]+)\/?$/);
  const propSlug = propertyMatch ? propertyMatch[1] : null;

  useEffect(() => {
    const legacy = localStorage.getItem("scoutit_accessibility_mode") === "high-contrast" ? "high-contrast" : null;
    const savedMode = localStorage.getItem("scoutit_display_mode") || legacy || "dark";
    setCurrentMode(savedMode);
    setLite(getStoredLiteMode());
    setMounted(true);
  }, []);

  // Reflect whether this property is already saved to the Ledger. Saves are stored
  // in `scoutit_reactions` as a reaction of type "Save" — same format ReactionButtons
  // uses, so the bar and the on-page save buttons stay in sync via shared storage.
  useEffect(() => {
    if (!propSlug) return;
    try {
      const arr = JSON.parse(localStorage.getItem("scoutit_reactions") || "[]");
      const match = Array.isArray(arr) ? arr.find((i) => i.property_id === propSlug) : null;
      setIsSaved(!!match && match.reaction_type === "Save");
    } catch {
      setIsSaved(false);
    }
  }, [propSlug]);

  const toggleSave = () => {
    if (!propSlug) return;
    try {
      let arr = JSON.parse(localStorage.getItem("scoutit_reactions") || "[]");
      if (!Array.isArray(arr)) arr = [];
      const idx = arr.findIndex((i) => i.property_id === propSlug);
      const alreadySaved = idx > -1 && arr[idx].reaction_type === "Save";
      if (alreadySaved) {
        arr.splice(idx, 1);
        setIsSaved(false);
      } else {
        const title = document.querySelector("h1")?.textContent?.trim() || propSlug;
        const item = { property_id: propSlug, property_title: title, category: "", city: "", reaction_type: "Save", is_broker: false, timestamp: Date.now() };
        if (idx > -1) arr[idx] = item; else arr.push(item);
        setIsSaved(true);
        fetch("/api/reactions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ property_id: propSlug, reaction_type: "Save" }) }).catch(() => {});
      }
      localStorage.setItem("scoutit_reactions", JSON.stringify(arr));
    } catch {
      /* localStorage unavailable — leave state unchanged */
    }
  };

  // Copy text with the modern API, falling back to a legacy textarea+execCommand
  // for browsers/contexts where the Clipboard API is blocked. Returns success.
  const copyLink = async (text) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch {
      /* fall through to legacy path */
    }
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      return ok;
    } catch {
      return false;
    }
  };

  const handleShare = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    const title = document.querySelector("h1")?.textContent?.trim() || "ScoutIT";
    // Native share sheet is the primary path on mobile; the rest is desktop fallback.
    if (navigator.share) {
      try {
        await navigator.share({ title, text: `${title} · ScoutIT`, url });
      } catch {
        /* user dismissed the share sheet — no-op */
      }
      return;
    }
    const ok = await copyLink(url);
    setShareToast(ok ? "Link copied" : "Couldn't copy — long-press the address bar");
    setTimeout(() => setShareToast(""), 2400);
  };

  const openInquiry = () => {
    window.dispatchEvent(new CustomEvent("scoutit:property-inquire"));
  };

  const toggleLite = () => {
    const next = !lite;
    setLite(next);
    setLiteMode(next);
  };

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

  // Determine which configuration to use based on the current path
  let itemsToRender = CONTEXTS.default;
  if (pathname.startsWith("/dashboard")) itemsToRender = CONTEXTS.dashboard;
  else if (pathname.startsWith("/wishlist")) itemsToRender = CONTEXTS.board;
  else if (pathname.startsWith("/discover")) itemsToRender = CONTEXTS.discover;
  else if (pathname.startsWith("/property")) itemsToRender = CONTEXTS.spaces;
  else if (pathname.startsWith("/intel")) itemsToRender = CONTEXTS.intel;

  if (!mounted) return null;

  // ── Property action bar (single property page) ──
  if (propSlug) {
    return (
      <>
        <nav className="bottom-nav property-actions" aria-label="Property actions">
          <Link href="/property" className="bottom-nav-item" aria-label="Back to all spaces">
            <span className="bottom-nav-icon">{ICONS.back}</span>
            <span className="bottom-nav-label">Spaces</span>
          </Link>
          <button
            className={`bottom-nav-item${isSaved ? " active" : ""}`}
            onClick={toggleSave}
            aria-pressed={isSaved}
            aria-label={isSaved ? "Saved to your board" : "Save to your board"}
          >
            <span className="bottom-nav-icon">{ICONS.save}</span>
            <span className="bottom-nav-label">{isSaved ? "Saved" : "Save"}</span>
          </button>
          <button className="bottom-nav-item primary" onClick={openInquiry} aria-label="Inquire about this space">
            <span className="bottom-nav-icon">{ICONS.inquire}</span>
            <span className="bottom-nav-label">Inquire</span>
          </button>
          <button className="bottom-nav-item" onClick={handleShare} aria-label="Share this space">
            <span className="bottom-nav-icon">{ICONS.share}</span>
            <span className="bottom-nav-label">Share</span>
          </button>
          <Link href="/" className="bottom-nav-item" aria-label="Home">
            <span className="bottom-nav-icon">{ICONS.home}</span>
            <span className="bottom-nav-label">Home</span>
          </Link>
        </nav>
        {shareToast && <div className="bottom-nav-toast" role="status" aria-live="polite">{shareToast}</div>}
      </>
    );
  }

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
                aria-label={`Bottom Nav: ${item.label}`}
              >
                {content}
              </Link>
            );
          }

          return (
            <button
              key={item.id}
              className="bottom-nav-item"
              aria-label={`Bottom Nav: ${item.label}`}
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
              <button className="theme-sheet-close" onClick={() => setThemeSheetOpen(false)} aria-label="Close">✕</button>
            </div>
            <div className="theme-sheet-options">
              {[
                { key: "dark", label: "Dark Mode", desc: "Cosmic default", dot: "#1e1e1e", dotBorder: "rgba(255,255,255,0.18)" },
                { key: "light", label: "Light Mode", desc: "Bright, open reading", dot: "#f0ede8", dotBorder: "rgba(0,0,0,0.18)" },
                { key: "high-contrast", label: "High Contrast", desc: "Maximum readability", dot: "#E8AE3C", dotBorder: "rgba(232, 174, 60,0.4)" },
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

            {/* Lite Mode — stops all animations so low-end phones don't lag */}
            <button
              className={`lite-toggle-row ${lite ? "active" : ""}`}
              onClick={toggleLite}
              aria-pressed={lite}
            >
              <div className="lite-toggle-text">
                <div className="theme-label">Lite Mode {lite ? "· On" : "· Off"}</div>
                <div className="theme-desc">Turn off animations for a faster, smoother experience on older phones.</div>
              </div>
              <span className={`lite-switch ${lite ? "on" : ""}`} aria-hidden="true">
                <span className="lite-knob" />
              </span>
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        .lite-toggle-row {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 12px;
          text-align: left;
          margin-top: 8px;
          padding: 12px 14px;
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.025);
          border: 1px solid rgba(255, 255, 255, 0.07);
          cursor: pointer;
        }
        .lite-toggle-row.active {
          background: rgba(232, 174, 60, 0.08);
          border-color: rgba(232, 174, 60, 0.3);
        }
        .lite-toggle-text { flex: 1; }
        .lite-switch {
          flex-shrink: 0;
          width: 40px;
          height: 22px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.14);
          border: 1px solid rgba(255, 255, 255, 0.18);
          position: relative;
          transition: background 0.2s ease, border-color 0.2s ease;
        }
        .lite-switch.on {
          background: var(--accent-bright, #F7C64E);
          border-color: var(--accent-bright, #F7C64E);
        }
        .lite-knob {
          position: absolute;
          top: 2px;
          left: 2px;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #0e0e0e;
          transition: transform 0.2s ease;
        }
        .lite-switch.on .lite-knob { transform: translateX(18px); }
      `}</style>
    </>
  );
}
