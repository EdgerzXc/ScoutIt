"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { getStoredLiteMode, setLiteMode } from "@/lib/liteMode";
import { getStoredSimpleMode, setSimpleMode } from "@/lib/simpleMode";
import { notifyLightModeChanged } from "@/lib/lightMode";
import { trackEvent, GA_EVENTS } from "@/lib/analytics";
import { readDevelopmentMockUser } from "@/lib/developmentMock";

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
      <rect x="3" y="3" width="18" height="18" rx="2"/>
      <line x1="3" y1="9" x2="21" y2="9"/>
      <line x1="9" y1="21" x2="9" y2="9"/>
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

const ROLE_ICONS = {
  buyer: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/>
      <line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  ),
  owner: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
    </svg>
  ),
  broker: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
    </svg>
  ),
  provider: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 2 7 12 12 22 7 12 2"/>
      <polyline points="2 17 12 22 22 17"/>
      <polyline points="2 12 12 17 22 12"/>
    </svg>
  ),
  operator: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  ),
  photographer: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
      <circle cx="12" cy="13" r="4"/>
    </svg>
  ),
  designer: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>
    </svg>
  ),
  mc_enterprise: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4.93 19.07A10 10 0 0 1 2 12C2 6.48 6.48 2 12 2s10 4.48 10 10c0 2.76-1.12 5.26-2.93 7.07"/>
      <circle cx="12" cy="12" r="4"/>
      <line x1="12" y1="16" x2="12" y2="22"/>
    </svg>
  )
};

// The 6 platform roles enumerated by ScoutIt:
// 1. Buyer / Seeker
// 2. Property Owner & Developer
// 3. Accredited Broker
// 4. Co-Operator & Facilities
// 5. Spatial Photographer
// 6. Event & Concept Designer
const CORE_ROLES = [
  {
    id: "buyer",
    aliases: ["buyer", "seeker", "exploring"],
    label: "Buyer / Seeker",
    desc: "Search spaces, viewings & private board",
    targetRole: "buyer",
  },
  {
    id: "owner",
    aliases: ["owner"],
    label: "Property Owner & Developer",
    desc: "List properties, review leads & inventory",
    targetRole: "owner",
  },
  {
    id: "broker",
    aliases: ["broker"],
    label: "Accredited Broker",
    desc: "Client representation & deal pipeline (PRC)",
    targetRole: "broker",
  },
  {
    id: "operator",
    aliases: ["operator", "co-operator", "operations"],
    label: "Co-Operator & Facilities",
    desc: "Space management & operations log",
    targetRole: "operator",
  },
  {
    id: "photographer",
    aliases: ["photographer"],
    label: "Spatial Photographer",
    desc: "Space photography, staging & QuestIT bounties",
    targetRole: "photographer",
  },
  {
    id: "designer",
    aliases: ["designer", "event-planner", "event designer", "concept_designer"],
    label: "Event & Concept Designer",
    desc: "Bespoke spatial concepts & event staging",
    targetRole: "designer",
  },
];

// Reusable Action / Link Item Definitions
const ITEMS = {
  home:      { id: "home",      href: "/",          label: "Home",      icon: ICONS.home },
  spaces:    { id: "spaces",    href: "/property",  label: "Spaces",    icon: ICONS.spaces },
  discover:  { id: "discover",  href: "/property",  label: "Discover",  icon: ICONS.discover },
  // "Board" here = YOUR SAVES (/wishlist), matching the "Your Board" header on
  // that page. It kept this label in the 2026-08-08 A7 rename; what moved was
  // the RANKINGS surface, which had also been calling itself "The Board".
  // ⚠️ Do not reintroduce "Board" as a name for rankings — that collision is
  // what the rename removed.
  board:     { id: "board",     href: "/wishlist",  label: "Board",     icon: ICONS.board },
  intel:     { id: "intel",     href: "/intel",     label: "Intel",     icon: ICONS.intel },
  dashboard: { id: "dashboard", href: "/dashboard", label: "Dash",      icon: ICONS.dashboard },
  role:      { id: "role",      action: "open-role-sheet", label: "Roles", icon: ICONS.role },
  theme:     { id: "theme",     action: "open-theme-sheet", label: "Theme", icon: ICONS.theme }
};

// Contextual Layout Configurations.
// 6-item quick access mobile bottom nav:
//   • Stable, predictable thumb muscle memory across all primary views.
//   • Home (Ground floor), Spaces (Directory), Intel (Briefings), Board (Saved), Dash (Workspace), Roles (Role & Workspace Switcher).
const CONTEXTS = {
  default:   [ITEMS.home, ITEMS.spaces, ITEMS.intel, ITEMS.board, ITEMS.dashboard, ITEMS.role],
  dashboard: [ITEMS.home, ITEMS.spaces, ITEMS.intel, ITEMS.board, ITEMS.dashboard, ITEMS.role],
  board:     [ITEMS.home, ITEMS.spaces, ITEMS.intel, ITEMS.board, ITEMS.dashboard, ITEMS.role],
  discover:  [ITEMS.home, ITEMS.spaces, ITEMS.intel, ITEMS.board, ITEMS.dashboard, ITEMS.role],
  spaces:    [ITEMS.home, ITEMS.spaces, ITEMS.intel, ITEMS.board, ITEMS.dashboard, ITEMS.role],
  intel:     [ITEMS.home, ITEMS.spaces, ITEMS.intel, ITEMS.board, ITEMS.dashboard, ITEMS.role]
};


export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [themeSheetOpen, setThemeSheetOpen] = useState(false);
  const [roleSheetOpen, setRoleSheetOpen] = useState(false);
  const [currentMode, setCurrentMode] = useState("dark");
  const [lite, setLite] = useState(false);
  const [simple, setSimple] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [shareToast, setShareToast] = useState("");
  const [activeUserRoles, setActiveUserRoles] = useState(["buyer"]);

  useEffect(() => {
    function resolveUserRoles() {
      try {
        const raw = localStorage.getItem("scoutit_user");
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed?.tags) && parsed.tags.length > 0) {
            setActiveUserRoles(parsed.tags);
            return;
          }
          if (Array.isArray(parsed?.active_roles) && parsed.active_roles.length > 0) {
            setActiveUserRoles(parsed.active_roles);
            return;
          }
          if (parsed?.role) {
            setActiveUserRoles([parsed.role]);
            return;
          }
        }
        const devUser = readDevelopmentMockUser(localStorage, {
          nodeEnv: process.env.NODE_ENV,
          hostname: typeof window !== "undefined" ? window.location.hostname : "",
        });
        if (devUser?.tags && Array.isArray(devUser.tags)) {
          setActiveUserRoles(devUser.tags);
          return;
        }
      } catch {}
      setActiveUserRoles(["buyer"]);
    }
    resolveUserRoles();
    window.addEventListener("scoutit:profile-updated", resolveUserRoles);
    return () => window.removeEventListener("scoutit:profile-updated", resolveUserRoles);
  }, []);

  const isRoleActive = (roleDef) => {
    return activeUserRoles.some((r) => {
      const lower = String(r).toLowerCase().trim();
      return roleDef.aliases.includes(lower) || roleDef.id === lower;
    });
  };

  const activeRoles = CORE_ROLES.filter((r) => isRoleActive(r));
  const availableRoles = CORE_ROLES.filter((r) => !isRoleActive(r));

  const handleRoleSelect = (roleKey) => {
    setRoleSheetOpen(false);
    if (pathname.startsWith("/dashboard")) {
      window.dispatchEvent(new CustomEvent("scoutit:switch-workspace", { detail: { role: roleKey } }));
      try {
        const url = new URL(window.location.href);
        url.searchParams.set("role", roleKey);
        window.history.replaceState(null, "", url.toString());
      } catch {}
    } else {
      router.push(`/dashboard?role=${roleKey}`);
    }
  };

  useEffect(() => {
    const handleOpenTheme = () => setThemeSheetOpen(true);
    window.addEventListener("scoutit:open-theme-sheet", handleOpenTheme);
    return () => window.removeEventListener("scoutit:open-theme-sheet", handleOpenTheme);
  }, []);

  // On a single property page (/property/<slug>) the bar becomes an ACTION bar
  // — the page's real jobs (save, inquire, share) under the thumb, not nav links.
  const propertyMatch = pathname.match(/^\/property\/([^/]+)\/?$/);
  const propSlug = propertyMatch ? propertyMatch[1] : null;

  useEffect(() => {
    const legacy = localStorage.getItem("scoutit_accessibility_mode") === "high-contrast" ? "high-contrast" : null;
    const requestedMode = localStorage.getItem("scoutit_display_mode") || legacy || "dark";
    // White-lens preview (owner-approved 2026-09-23): keep the saved
    // selection as-is on read, same as FloatingToolbox. Light is opt-in.
    setCurrentMode(requestedMode);
    setLite(getStoredLiteMode());
    setSimple(getStoredSimpleMode());
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
        // A-146: same tap funnel as ReactionButtons — local save confirmed.
        trackEvent(GA_EVENTS.REACTION_TAPPED, { property_id: propSlug });
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

  // ── Share (fixed 2026-08-13) ──────────────────────────────────────────────
  // This button used to be the ONLY Share reachable on a phone — the curated
  // one in "Your Move" is `hidden md:block`, measured invisible at 375×812 —
  // and it bypassed the entire curated engine: it never imported
  // shareBriefing.js, and it scraped `document.querySelector("h1")` for a title
  // instead of using the property data it was sharing. Most Philippine traffic
  // is mobile, so in practice almost nobody ever saw the briefing copy.
  //
  // BottomNav is a global layout component and holds no property data, so it
  // asks rather than guesses. It dispatches the same kind of global event
  // already used for Inquire; the property flow (CommercialFlow /
  // ResidentialFlow / UnitMasterPage) owns the property object, runs the
  // curated path, and flips `detail.handled`.
  //
  // Two properties of that handshake matter:
  //   • CustomEvent listeners run synchronously, so `handled` is readable on
  //     the next line.
  //   • The flows register the listener ONLY for non-sample listings, which is
  //     how the `{!d.is_sample && ...}` rule survives the move. A sample
  //     listing leaves `handled` false and falls through to the bare link
  //     below — exactly the old behaviour, which is what samples should get.
  const handleShare = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";

    const detail = { handled: false };
    window.dispatchEvent(new CustomEvent("scoutit:property-share", { detail }));
    if (detail.handled) return;

    // No curated handler (sample listing, or a property page shape that does
    // not own share copy): degrade to the link, and say what happened.
    const ok = await copyLink(url);
    setShareToast(ok ? "Link copied" : "Couldn't copy: long-press the address bar");
    setTimeout(() => setShareToast(""), 2400);
  };

  const openInquiry = () => {
    window.dispatchEvent(new CustomEvent("scoutit:property-inquire"));
  };

  const toggleLite = () => {
    const next = !lite;
    setLite(next);
    setLiteMode(next);
    // A-146: mode-switch measurement (Simple vs Pro experiment needs it).
    trackEvent(GA_EVENTS.DISPLAY_MODE_SWITCHED, { axis: "performance", mode: next ? "lite-on" : "lite-off" });
  };

  // A-146: the sheet promised Guide / Dark / High Contrast / Lite / Simple
  // (Header's accessible name) but offered no Simple toggle. Same reading
  // level as the desktop panel — fewer words, nothing removed.
  const toggleSimple = () => {
    const next = !simple;
    setSimple(next);
    setSimpleMode(next);
    trackEvent(GA_EVENTS.DISPLAY_MODE_SWITCHED, { axis: "density", mode: next ? "simple-on" : "simple-off" });
  };

  const changeMode = (m) => {
    setCurrentMode(m);
    document.body.classList.remove("high-contrast", "light-mode");
    if (m === "high-contrast") document.body.classList.add("high-contrast");
    if (m === "light") document.body.classList.add("light-mode");
    // Tell canvas-based visuals to tear down / rebuild immediately.
    // A WebGL shader cannot read a CSS variable, so the hero has to be
    // told in JS rather than restyled (§62).
    notifyLightModeChanged();
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
                if (item.action === "open-role-sheet") {
                  setRoleSheetOpen(true);
                } else if (item.action === "scoutit:open-mobile-menu") {
                  const detail = { handled: false };
                  window.dispatchEvent(new CustomEvent("scoutit:open-mobile-menu", { detail }));
                  if (!detail.handled) {
                    setRoleSheetOpen(true);
                  }
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
              <span className="theme-sheet-title">Help & Display</span>
              <button className="theme-sheet-close" onClick={() => setThemeSheetOpen(false)} aria-label="Close">✕</button>
            </div>

            <div className="theme-sheet-options">
              {[
                { key: "dark", label: "Dark Mode", desc: "Cosmic default", dotClass: "bg-surface border-on-surface/20" },
                { key: "light", label: "Light / White Lens", desc: "Clean corporate preview", dotClass: "bg-surface-bright border-on-surface/20" },
                { key: "high-contrast", label: "High Contrast", desc: "Maximum readability", dotClass: "bg-gold-accent border-gold-accent/40" },
              ].map(({ key, label, desc, dotClass }) => (
                <button
                  key={key}
                  className={`theme-option ${currentMode === key ? "active" : ""}`}
                  onClick={() => changeMode(key)}
                >
                  <div className={`w-5 h-5 rounded-full border-[1.5px] ${dotClass}`} />
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
              className={`w-full flex items-center gap-3 text-left mt-2 p-3 rounded-lg border cursor-pointer transition-colors ${lite ? "bg-gold-accent/10 border-gold-accent/30" : "bg-on-surface/[0.025] border-on-surface/10"}`}
              onClick={toggleLite}
              aria-pressed={lite}
            >
              <div className="flex-1">
                <div className="theme-label">Lite Mode {lite ? "· On" : "· Off"}</div>
                <div className="theme-desc">Turn off animations for a faster, smoother experience on older phones.</div>
              </div>
              <span className={`shrink-0 w-10 h-[22px] rounded-full border relative transition-colors ${lite ? "bg-gold-accent border-gold-accent" : "bg-on-surface/10 border-on-surface/20"}`} aria-hidden="true">
                <span className={`absolute top-[2px] left-[2px] w-4 h-4 rounded-full bg-background transition-transform duration-200 ease-out ${lite ? "translate-x-[18px]" : ""}`} />
              </span>
            </button>

            {/* Simple Mode — fewer words, nothing removed (A-083) */}
            <button
              className={`w-full flex items-center gap-3 text-left mt-2 p-3 rounded-lg border cursor-pointer transition-colors ${simple ? "bg-gold-accent/10 border-gold-accent/30" : "bg-on-surface/[0.025] border-on-surface/10"}`}
              onClick={toggleSimple}
              aria-pressed={simple}
            >
              <div className="flex-1">
                <div className="theme-label">Simple Mode {simple ? "· On" : "· Off"}</div>
                <div className="theme-desc">Fewer words. Nothing is removed.</div>
              </div>
              <span className={`shrink-0 w-10 h-[22px] rounded-full border relative transition-colors ${simple ? "bg-gold-accent border-gold-accent" : "bg-on-surface/10 border-on-surface/20"}`} aria-hidden="true">
                <span className={`absolute top-[2px] left-[2px] w-4 h-4 rounded-full bg-background transition-transform duration-200 ease-out ${simple ? "translate-x-[18px]" : ""}`} />
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Role / Workspace Action Sheet */}
      {roleSheetOpen && (
        <div className="theme-sheet-overlay" onClick={() => setRoleSheetOpen(false)}>
          <div className="theme-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="theme-sheet-header">
              <div>
                <span className="theme-sheet-title">Workspaces &amp; Roles</span>
                <span className="block font-mono text-[10px] uppercase tracking-widest text-text-muted mt-0.5">
                  Space Intelligence Platform
                </span>
              </div>
              <button className="theme-sheet-close" onClick={() => setRoleSheetOpen(false)} aria-label="Close">✕</button>
            </div>

            {/* Section 1: Active Roles (User already has) */}
            <div className="px-3 pb-2 pt-1 flex items-center justify-between">
              <span className="font-mono text-[11px] uppercase tracking-widest text-gold-accent font-semibold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-gold-accent inline-block animate-pulse" />
                Your Active Roles ({activeRoles.length})
              </span>
              <span className="font-mono text-[10px] uppercase tracking-wider text-text-muted">
                Tap to switch
              </span>
            </div>

            <div className="theme-sheet-options">
              {activeRoles.map((role) => (
                <button
                  key={role.id}
                  type="button"
                  className="theme-option is-active-role"
                  onClick={() => handleRoleSelect(role.targetRole)}
                  style={{
                    textAlign: "left",
                    cursor: "pointer",
                    width: "100%",
                    gap: "14px",
                    borderColor: "rgba(var(--accent-rgb), 0.4)",
                    background: "rgba(var(--accent-rgb), 0.05)",
                  }}
                >
                  <div className="w-10 h-10 rounded-full bg-gold-accent/15 border border-gold-accent/40 flex items-center justify-center text-gold-accent shrink-0">
                    {ROLE_ICONS[role.id]}
                  </div>
                  <div className="theme-text" style={{ flex: 1 }}>
                    <div className="flex items-center justify-between gap-2">
                      <div className="theme-label text-gold-accent font-semibold">{role.label}</div>
                      <span className="font-mono text-[10px] uppercase tracking-widest text-gold-accent px-1.5 py-0.5 rounded border border-gold-accent/40 bg-gold-accent/15">
                        Active ✓
                      </span>
                    </div>
                    <div className="theme-desc">{role.desc}</div>
                  </div>
                </button>
              ))}
            </div>

            {/* Section 2: Available Roles (To Add or Increase) */}
            {availableRoles.length > 0 && (
              <div className="mt-4 pt-3 border-t border-surface-variant">
                <div className="px-3 pb-2 flex items-center justify-between">
                  <span className="font-mono text-[11px] uppercase tracking-widest text-text-secondary font-semibold">
                    Available Roles to Add ({availableRoles.length})
                  </span>
                  <Link
                    href="/settings#account"
                    onClick={() => setRoleSheetOpen(false)}
                    className="font-mono text-[10px] uppercase tracking-wider text-gold-accent hover:underline"
                  >
                    Manage in Settings →
                  </Link>
                </div>
                <div className="theme-sheet-options">
                  {availableRoles.map((role) => (
                    <Link
                      key={role.id}
                      href="/settings#account"
                      onClick={() => setRoleSheetOpen(false)}
                      className="theme-option is-available-role"
                      style={{
                        textAlign: "left",
                        width: "100%",
                        gap: "14px",
                        background: "rgba(255, 255, 255, 0.02)",
                        borderColor: "var(--border-solid)",
                        textDecoration: "none",
                      }}
                    >
                      <div className="w-10 h-10 rounded-full bg-surface-alt border border-surface-variant flex items-center justify-center text-text-secondary shrink-0">
                        {ROLE_ICONS[role.id]}
                      </div>
                      <div className="theme-text" style={{ flex: 1 }}>
                        <div className="flex items-center justify-between gap-2">
                          <div className="theme-label text-text-primary">{role.label}</div>
                          <span className="font-mono text-[10px] uppercase tracking-wider text-gold-accent px-2 py-0.5 rounded bg-gold-accent/10 border border-gold-accent/30 shrink-0 hover:bg-gold-accent hover:text-black transition">
                            + Add Role
                          </span>
                        </div>
                        <div className="theme-desc">{role.desc}</div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Actions & Settings Bridge */}
            <div className="flex flex-col gap-2 pt-4 mt-4 border-t border-surface-variant">
              <Link
                href="/settings#account"
                className="flex items-center justify-center min-h-[44px] px-3 py-2 rounded bg-gold-accent/10 border border-gold-accent/40 text-xs font-mono uppercase tracking-widest text-gold-accent hover:bg-gold-accent hover:text-black transition font-semibold"
                onClick={() => setRoleSheetOpen(false)}
              >
                + Add or Increase Roles in Settings →
              </Link>
              <div className="px-3 pt-2 pb-0.5">
                <span className="font-mono text-[11px] uppercase tracking-widest text-text-muted">Quick Workspace Tools</span>
              </div>
              <div className="grid grid-cols-2 gap-2 px-1">
                <Link
                  href="/dashboard/crm"
                  className="flex items-center min-h-[44px] px-3 py-2 rounded bg-surface-alt/50 border border-surface-variant text-xs font-mono uppercase tracking-wider text-text-secondary hover:text-gold-accent hover:border-gold-accent transition"
                  onClick={() => setRoleSheetOpen(false)}
                >
                  Pipeline (CRM) →
                </Link>
                <Link
                  href="/dashboard/inbox"
                  className="flex items-center min-h-[44px] px-3 py-2 rounded bg-surface-alt/50 border border-surface-variant text-xs font-mono uppercase tracking-wider text-text-secondary hover:text-gold-accent hover:border-gold-accent transition"
                  onClick={() => setRoleSheetOpen(false)}
                >
                  Deal Rooms →
                </Link>
              </div>
              <Link
                href="/dashboard?role=mc_enterprise"
                className="flex items-center min-h-[44px] px-3 py-2 rounded bg-surface-alt/30 border border-surface-variant/80 text-xs font-mono uppercase tracking-wider text-text-muted hover:text-gold-accent transition"
                onClick={() => {
                  setRoleSheetOpen(false);
                  handleRoleSelect("mc_enterprise");
                }}
              >
                Enterprise Mission Control (Preview) →
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
