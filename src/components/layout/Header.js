"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import ScoutItWordmark from "@/components/brand/ScoutItWordmark";
import AmbientRail from "@/components/layout/ambient/AmbientRail";
import { menuGroups } from "@/lib/navigationManifest";

export default function Header({ ambientContext = null }) {
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [displaySettingsOpen, setDisplaySettingsOpen] = useState(false);

  const menuRef = useRef(null);
  const menuButtonRef = useRef(null);
  const menuPanelRef = useRef(null);
  const lastPathRef = useRef(pathname);

  // pointerdown rather than mousedown: a touch tap outside the sheet should
  // dismiss it on the same gesture, not on the synthesised mouse event after it.
  useEffect(() => {
    function onPointerOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("pointerdown", onPointerOutside);
    return () => document.removeEventListener("pointerdown", onPointerOutside);
  }, []);

  // Navigating is a dismissal. Without this the sheet stays open over the page
  // the user just asked for.
  //
  // Guarded on an actual change: this effect also runs on mount and on every
  // re-render that follows hydration, and an unguarded close there cancels a
  // menu the user has just opened — a race that only shows up on a slower
  // device, as an open that silently does not take.
  useEffect(() => {
    if (lastPathRef.current === pathname) return;
    lastPathRef.current = pathname;
    setMenuOpen(false);
  }, [pathname]);

  // Escape closes and hands focus back to the control that opened the menu,
  // and Tab stays inside the panel while it is open.
  useEffect(() => {
    if (!menuOpen) return undefined;

    const panel = menuPanelRef.current;
    const focusables = () =>
      Array.from(panel?.querySelectorAll("a[href], button:not([disabled])") || []);

    // The panel transitions from visibility:hidden, and focus() on a still
    // hidden element is a silent no-op. Wait for the browser to apply the open
    // state before moving focus, or the menu opens with focus left behind on
    // the page underneath.
    const focusFrame = requestAnimationFrame(() => {
      const first = focusables()[0];
      if (first && document.activeElement !== first) first.focus();
    });

    function onKeyDown(event) {
      if (event.key === "Escape") {
        event.preventDefault();
        setMenuOpen(false);
        menuButtonRef.current?.focus();
        return;
      }
      if (event.key !== "Tab") return;

      const items = focusables();
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && (active === first || active === menuButtonRef.current)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      cancelAnimationFrame(focusFrame);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  useEffect(() => {
    function readUser() {
      try {
        const raw = localStorage.getItem("scoutit_user");
        setUser(raw ? JSON.parse(raw) : null);
      } catch {
        setUser(null);
      }
    }
    readUser();
    // Pick up sign-in/sign-out from other tabs or after onboarding
    window.addEventListener("storage", readUser);
    window.addEventListener("focus", readUser);
    return () => {
      window.removeEventListener("storage", readUser);
      window.removeEventListener("focus", readUser);
    };
  }, []);

  useEffect(() => {
    const syncDisplaySettings = (event) => setDisplaySettingsOpen(Boolean(event.detail?.open));
    window.addEventListener("scoutit:display-settings-state", syncDisplaySettings);
    return () => window.removeEventListener("scoutit:display-settings-state", syncDisplaySettings);
  }, []);

  // One overlay at a time: the floating Help & Display panel is fixed above the
  // page, so leaving it open while the navigation menu expands puts it on top of
  // the menu's own controls on narrow viewports.
  useEffect(() => {
    if (!menuOpen) return;
    window.dispatchEvent(new CustomEvent("scoutit:close-display-settings"));
  }, [menuOpen]);

  function openDisplaySettings() {
    if (typeof window.__scoutitOpenDisplaySettings === "function") {
      window.__scoutitOpenDisplaySettings();
      return;
    }
    window.__scoutitDisplaySettingsRequested = true;
    window.dispatchEvent(new CustomEvent("scoutit:open-display-settings"));
  }


  return (
    <header className="global-header">
      <span className="header-gold-thread" aria-hidden="true"><span /></span>
      <div className="header-left">
        <button
          onClick={() => {
            if (window.history.length > 1) {
              router.back();
            } else {
              router.push("/");
            }
          }}
          className="header-back-btn"
          aria-label="Go back"
        >
          <span aria-hidden="true">←</span>
          <span className="header-back-label">Back</span>
        </button>

        <ScoutItWordmark href="/" className="header-brand" />
      </div>

      <div className="header-center">
        <AmbientRail user={user} context={ambientContext} />
      </div>

      <nav className="header-nav" ref={menuRef} aria-label="Primary navigation">
        <button
          className={`header-eye-btn ${displaySettingsOpen ? "is-open" : ""}`}
          type="button"
          onClick={openDisplaySettings}

          aria-label="Help & Display (Guide / Dark / High Contrast / Lite Mode)"
          aria-expanded={displaySettingsOpen}
          title="Help & Display (Guide / Dark / High Contrast / Lite Mode)"


        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        </button>
        <button
          className="header-menu-btn"
          type="button"
          ref={menuButtonRef}
          aria-expanded={menuOpen}
          aria-controls="header-menu-panel"
          onClick={() => setMenuOpen(v => !v)}
          aria-label="Menu"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M2 4h12M2 8h12M2 12h12"/>
          </svg>
        </button>
        <div
          className={`header-dropdown ${menuOpen ? "open" : ""}`}
          id="header-menu-panel"
          ref={menuPanelRef}
          aria-label="ScoutIt navigation"
        >
          <ScoutItWordmark className="dropdown-brand" />
          {menuGroups(Boolean(user)).map((group) => (
            <div className="dropdown-group" key={group.id}>
              <span className="dropdown-group-label">{group.label}</span>
              {group.entries.map((entry) => (
                <Link
                  key={entry.id}
                  href={entry.href}
                  aria-current={pathname === entry.href ? "page" : undefined}
                  onClick={() => setMenuOpen(false)}
                >
                  {entry.label}
                </Link>
              ))}
            </div>
          ))}
          <button
            type="button"
            className="dropdown-display-btn"
            onClick={() => {
              setMenuOpen(false);
              menuButtonRef.current?.focus();
              openDisplaySettings();
            }}

          >
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12Z" /><circle cx="12" cy="12" r="3" /></svg>
            <span>Help & Display</span>
          </button>
        </div>
      </nav>

      {/* 🔴 MUST stay '<style jsx>', not a raw '<style>'. React 19 hoists a raw
          <style> element into <head> and treats it as a stylesheet RESOURCE.
          An 11KB one without a 'precedence' prop leaves the enclosing
          <Suspense> boundary pending forever — so every page that rendered
          <Header /> alongside a <Suspense> never revealed its content.
          That is what kept /discover on "Loading Discovery Engine Matrix..."
          and /property on "LOADING DIRECTORY LEDGER...", permanently, with no
          error in the console. Bisected 2026-08-07 (§65): a one-rule raw
          <style> is fine, this block is not. */}
      <style precedence="high">{`.global-header { backdrop-filter: blur(18px); -webkit-backdrop-filter: blur(18px); }`}</style>
      <style jsx>{`

        .global-header {
          position: sticky;
          top: 0;
          z-index: 1000;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 18px;
          min-height: 72px;
          padding: 12px 24px;
          background: radial-gradient(circle at 50% -80%, rgba(var(--accent-rgb),.085), transparent 54%), linear-gradient(180deg, rgba(14,14,14,.94), rgba(7,7,7,.89));
          backdrop-filter: blur(18px) saturate(118%);
          -webkit-backdrop-filter: blur(18px) saturate(118%);
          border-bottom: 1px solid rgba(var(--accent-rgb),.13);
          box-shadow: inset 0 1px 0 rgba(255,255,255,.035), 0 14px 40px rgba(0,0,0,.2);
          font-family: var(--font-body);
          isolation: isolate;
        }

        .header-gold-thread { position: absolute; left: 0; right: 0; bottom: -1px; height: 2px; overflow: hidden; pointer-events: none; }
        .header-gold-thread::before { content: ""; position: absolute; inset: 0; height: 1px; background: linear-gradient(90deg, transparent 4%, rgba(var(--accent-rgb),.14) 24%, rgba(var(--accent-rgb),.32) 50%, rgba(var(--accent-rgb),.14) 76%, transparent 96%); }
        .header-gold-thread span { position: absolute; top: 0; left: 0; width: 220px; height: 1px; background: linear-gradient(90deg, transparent, rgba(var(--accent-rgb),.26), var(--accent-bright), rgba(var(--accent-rgb),.26), transparent); filter: drop-shadow(0 0 4px rgba(var(--accent-rgb),.42)); animation: headerThreadPass 1.4s var(--ease-out-custom) 180ms both; }

        .header-left {
          display: flex;
          align-items: center;
          gap: 20px;
          flex: 1;
          min-width: 0;
        }

        .header-center {
          position: relative;
          flex: 2;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 48px;
          min-width: 70px;
          max-width: 416px;
        }

        .header-back-btn {
          background: var(--brand-overlay);
          border: 1px solid var(--border-mid);
          color: var(--text-secondary);
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          padding: 8px 16px;
          border-radius: 20px;
          cursor: pointer;
          transition: transform 160ms var(--ease-out-custom), border-color 180ms ease, color 180ms ease, background-color 180ms ease;
          display: flex;
          align-items: center;
          justify-content: center;
          /* The arrow and the word are separate elements now, so the space
             that used to come from the text node has to be declared. */
          gap: 5px;
          min-height: 44px; /* Mobile touch target compliance */
        }

        .header-back-btn:hover {
          border-color: var(--accent);
          color: var(--accent);
          background: rgba(var(--accent-rgb), 0.1);
        }
        .header-back-btn:active {
          transform: scale(0.96);
        }

        .header-brand {
          font-family: var(--font-display);
          font-weight: 400;
          font-size: 30px;
          letter-spacing: 0.12em;
          text-decoration: none;
          white-space: nowrap;
          line-height: 1;
        }

        .header-brand .brand-scout { color: var(--text-primary); }
        .header-brand .brand-s,
        .header-brand .brand-it { color: var(--accent); transition: text-shadow 0.3s ease; }
        .header-brand:hover .brand-s,
        .header-brand:hover .brand-it { text-shadow: 0 0 14px rgba(var(--accent-rgb), 0.55); }

        .header-nav {
          position: relative;
          display: flex;
          align-items: center;
          gap: 10px;
          flex: 1;
          justify-content: flex-end;
          min-width: 0;
        }

        .header-eye-btn {
          position: relative;
          width: 44px;
          height: 44px;
          border-radius: 50%;
          border: 1px solid rgba(var(--accent-rgb),.28);
          background: linear-gradient(180deg, rgba(255,255,255,.045), rgba(var(--accent-rgb),.025));
          color: var(--accent);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: inset 0 1px 0 rgba(255,255,255,.06), inset 0 -1px 0 rgba(var(--accent-rgb),.05);
          transition: border-color 180ms cubic-bezier(.23,1,.32,1), background 180ms cubic-bezier(.23,1,.32,1), color 180ms cubic-bezier(.23,1,.32,1), box-shadow 180ms cubic-bezier(.23,1,.32,1), transform 140ms cubic-bezier(.23,1,.32,1);
        }
        .header-eye-btn::after { content: ""; position: absolute; right: 5px; top: 5px; width: 4px; height: 4px; border-radius: 50%; background: var(--accent-bright); box-shadow: 0 0 7px rgba(var(--accent-rgb),.8); opacity: 0; transform: scale(.7); transition: opacity 160ms cubic-bezier(.23,1,.32,1), transform 160ms cubic-bezier(.23,1,.32,1); }
        .header-eye-btn:hover,
        .header-eye-btn.is-open { border-color: rgba(var(--accent-rgb),.72); color: var(--accent-bright); background: rgba(var(--accent-rgb),.105); box-shadow: inset 0 1px 0 rgba(255,255,255,.08), 0 0 22px rgba(var(--accent-rgb),.11); }
        .header-eye-btn.is-open::after { opacity: 1; transform: scale(1); }
        .header-eye-btn:active { transform: scale(.96); }
        .header-eye-btn:focus-visible { outline: 1px solid var(--accent-bright); outline-offset: 3px; }

        .dropdown-display-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          width: 100%;
          text-align: left;
          background: none;
          border: none;
          color: var(--accent);
          font-family: var(--font-mono);
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          padding: 12px 14px;
          cursor: pointer;
          transition: background 0.2s ease;
          border-top: 1px solid var(--border-solid);
          margin-top: 4px;
        }
        .dropdown-display-btn svg { width: 16px; height: 16px; fill: none; stroke: currentColor; stroke-width: 1.35; stroke-linecap: round; stroke-linejoin: round; }
        .dropdown-display-btn:hover { background: var(--surface2); }
        .dropdown-display-btn:active { transform: scale(.985); }

        .header-profile-btn {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          border: 1px solid var(--accent-border);
          background: var(--brand-overlay);
          display: flex;
          align-items: center;
          justify-content: center;
          text-decoration: none;
          transition: transform 160ms var(--ease-out-custom), border-color 180ms ease, background-color 180ms ease;
        }
        .header-profile-btn:active {
          transform: scale(0.94);
        }

        .header-profile-btn svg {
          width: 17px;
          height: 17px;
          stroke: var(--accent);
        }

        .header-profile-btn .profile-initial {
          font-family: var(--font-display);
          font-size: 17px;
          line-height: 1;
          color: var(--accent);
        }

        .header-profile-btn.signed-in {
          background: var(--accent-dim);
        }

        .header-profile-btn:hover {
          border-color: var(--accent-bright);
          background: rgba(var(--accent-rgb), 0.16);
          box-shadow: var(--shadow-glow-soft);
          transform: translateY(-1px);
        }

        .header-profile-btn:hover svg {
          stroke: var(--accent-bright);
        }

        .header-profile-btn:hover .profile-initial {
          color: var(--accent-bright);
        }

        .header-profile-btn:focus-visible {
          outline: 1.5px solid var(--accent-bright);
          outline-offset: 2px;
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
          transition: transform 160ms var(--ease-out-custom), border-color 180ms ease, background-color 180ms ease;
          touch-action: manipulation;
        }
        .header-menu-btn:active {
          transform: scale(0.94);
        }

        .header-menu-btn:hover {
          background: rgba(var(--accent-rgb), 0.15);
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
          min-width: 190px;
          background: var(--surface);
          border: 1px solid var(--border-solid);
          border-radius: var(--radius-md);
          padding: 8px;
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          box-shadow: var(--shadow-lg);
          opacity: 0;
          visibility: hidden;
          transform: scale(0.96) translateY(-4px);
          transform-origin: top right;
          /* visibility is switched discretely, not eased: an eased visibility
             leaves the panel hidden for the first frame of the open, and
             focus() on a hidden element is a silent no-op — the menu would
             open with focus still on the page underneath. Delay it on close
             instead, so the fade-out stays visible for its full duration. */
          transition: opacity 180ms cubic-bezier(0.23, 1, 0.32, 1), transform 180ms cubic-bezier(0.23, 1, 0.32, 1), visibility 0s linear 180ms;
          max-height: calc(100dvh - 88px);
          overflow-y: auto;
          z-index: 1001;
        }

        .header-dropdown.open {
          opacity: 1;
          visibility: visible;
          transform: scale(1) translateY(0);
          transition: opacity 180ms cubic-bezier(0.23, 1, 0.32, 1), transform 180ms cubic-bezier(0.23, 1, 0.32, 1), visibility 0s linear;
        }

        .dropdown-group + .dropdown-group {
          margin-top: 6px;
          padding-top: 6px;
          border-top: 1px solid var(--border-subtle);
        }

        .dropdown-group-label {
          display: block;
          padding: 4px 14px 3px;
          color: var(--text-muted);
          font-family: var(--font-mono);
          font-size: 12px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }
        .header-dropdown :global(a) {
          display: block;
          padding: 10px 14px;
          font-size: 13px;
          font-weight: 500;
          color: var(--text-secondary);
          text-decoration: none;
          border-radius: var(--radius-sm);
          transition: background 150ms ease, color 150ms ease, padding-left 150ms ease;
        }

        .header-dropdown :global(a):hover {
          background: var(--surface2);
          color: var(--text-primary);
          padding-left: 18px;
        }

        .header-dropdown .dropdown-brand {
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--accent);
          padding: 8px 14px 4px;
          pointer-events: none;
          border-bottom: 1px solid var(--border-solid);
          margin-bottom: 6px;
        }

        /* ── MOBILE OPTIMIZATIONS ── */
        @keyframes headerThreadPass {
          0% { transform: translate3d(-240px,0,0); opacity: 0; }
          14% { opacity: .9; }
          86% { opacity: .9; }
          100% { transform: translate3d(calc(100vw + 240px),0,0); opacity: 0; }
        }

        @media (max-width: 768px) {
          .global-header {
            padding: 10px 16px;
          }

          .header-brand {
            font-size: 24px;
            letter-spacing: 0.12em;
          }

          .header-back-btn {
            font-size: 12px;
            padding: 0 14px;
            min-height: 44px;
          }

          .header-menu-btn {
            width: 44px;
            height: 44px;
          }

          .header-dropdown {
            min-width: 160px;
            padding: 6px;
          }

          .header-dropdown :global(a) {
            padding: 10px 12px;
            font-size: 12px;
          }
        }

        @media (max-width: 640px) {
          .global-header {
            padding: 6px 10px;
            gap: 8px;
            min-height: 52px;
          }

          .header-left {
            flex: 0 0 auto;
            gap: 6px;
          }

          .header-center {
            flex: 1 1 0%;
            max-width: none;
            min-width: 0;
            min-height: 0;
          }

          .header-nav {
            flex: 0 0 auto;
            gap: 4px;
          }

          .header-brand {
            font-size: 19px;
            letter-spacing: 0.12em;
          }

          /* 44px, not 36px. The reduction was an over-correction made while
             fighting the header onto one line: measured at 320, 360 and 390 the
             header is 57px tall either way, the brand does not move, the three
             child rows stay three, and nothing overflows. The height was being
             paid for a problem it did not solve, and a 36px control is under the
             touch floor on every phone in the test matrix. */
          .header-back-btn {
            font-size: 12px;
            padding: 0 8px;
            min-height: 44px;
            white-space: nowrap;
            border-radius: 14px;
          }

          .header-eye-btn {
            display: none;
          }

          .header-menu-btn {
            width: 44px;
            height: 44px;
          }
          .header-menu-btn svg { width: 13px; height: 13px; }

          .header-dropdown {
            width: min(calc(100vw - 24px), 260px);
            max-height: calc(100dvh - 72px);
          }


          .header-dropdown .dropdown-brand {
            font-size: 12px;
            padding: 8px 12px 4px;
            margin-bottom: 8px;
          }
        }

        @media (max-width: 480px) {
          .global-header { padding: 4px 8px; gap: 5px; min-height: 44px; }
          .header-left { gap: 4px; }
          .header-back-btn { font-size: 12px; padding: 0 6px; min-height: 44px; letter-spacing: 0.06em; border-radius: 14px; }
          .header-brand { font-size: 16px; margin: 0; letter-spacing: 1px; }
          .header-menu-btn { width: 44px; height: 44px; }
          .header-menu-btn svg { width: 12px; height: 12px; }
        }

        /* 320px is the narrowest supported width and the message was still
           6px over. Taken from padding and the gap rather than the type: 10px
           is the site-wide font floor set during the mobile pass and going
           under it to win six pixels is the wrong trade.

           Placed after the 480px block on purpose: that block sets padding and
           gap as shorthands, so an earlier rule here is silently overwritten.
           Third time this ordering has bitten in this file. */
        @media (max-width: 340px) {
          .global-header { padding: 4px 4px; gap: 2px; }
          .header-back-btn { padding: 0 4px; }
          .header-eye-btn, .header-menu-btn { width: 44px; height: 44px; }
        }

        /* ── The ambient rail stops competing for the same row ──────────────
           It used to sit between the back/brand cluster and the nav buttons,
           all three on one line, with min-width 0 on this one alone. The other
           two are touch targets and refuse to shrink, so the rail absorbed
           every shortfall. Measured: at 320px it was handed 28px to render text
           needing 93px, and at 390px it got 98px for 128px. The ellipsis
           everyone saw was the symptom, not the cause. No message could ever
           have fitted, however short it was written.

           §1.5 of the action plan already prescribes the answer: preserve
           brand, context and essential actions, and let secondary ambient
           content shorten, scroll or move rather than be squeezed. So below
           560px the header wraps and the rail takes its own full-width line.

           560px, not the 640px used above, because the single row still fits
           between roughly 560 and 640. Wrapping there only bought a taller
           header for no gain.

           AND THE RAIL SCROLLS AWAY, so the extra line is not paid for on every
           screen of every page. Once the reader has scrolled past the top, the
           rail is removed and the header returns to a single compact row. It is
           ambient information, not navigation, so losing it on scroll costs
           nothing — and it comes back at the top of the page.

           An earlier attempt made only the control row sticky and left the rail
           outside it. That does not work: a sticky element is bounded by its
           parent's box, so with a short static wrapper the "pinned" row simply
           left with the header. Measured at 390px it sat at -500px after a
           500px scroll while the 900px header held at 0. Hence this approach,
           which keeps the proven sticky element and changes what is inside it. */
        @media (max-width: 560px) {

          /* Back inline, as it was. The rail keeps its own line only in the
             sense of being the flexible middle column: it shrinks to whatever
             the controls leave, and the controls now leave enough. */
          .header-center {
            flex: 1 1 0%;
            max-width: none;
            min-width: 0;
            min-height: 0;
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

        @media (prefers-reduced-motion: reduce) {
          .header-gold-thread span { display: none; }
          /* The row still collapses, it just stops animating on the way. */
          .header-center { transition: none; }
        }

        /* Touch-friendly active state */
        @media (hover: none) and (pointer: coarse) {
          .header-dropdown :global(a) {
            min-height: 48px;
          }

          .header-menu-btn,
          .header-back-btn {
            -webkit-tap-highlight-color: rgba(var(--accent-rgb), 0.15);
          }
        }
      `}</style>
    </header>
  );
}
