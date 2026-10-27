"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import VerifiedWorkspaceBoundary from "@/components/auth/VerifiedWorkspaceBoundary";
import { DashboardProvider, useDashboard } from "../../context/DashboardContext";

// Lazy-loaded mode components
const OwnerMode = dynamic(() => import("../../components/dashboard/OwnerMode"), { ssr: false });
const BrokerMode = dynamic(() => import("../../components/dashboard/BrokerMode"), { ssr: false });
const BuyerMode = dynamic(() => import("../../components/dashboard/BuyerMode"), { ssr: false });
const ProviderMode = dynamic(() => import("../../components/dashboard/ProviderMode"), { ssr: false });
const OperatorMode = dynamic(() => import("../../components/dashboard/OperatorMode"), { ssr: false });
const MissionControlMode = dynamic(() => import("../../components/dashboard/MissionControlMode"), { ssr: false });
import Nudge from "../../components/ui/Nudge";
import Toasts from "../../components/ui/Toasts";
import DeckPanel from "../../components/dashboard/DeckPanel";
import WorkspaceCommandBar from "../../components/dashboard/WorkspaceCommandBar";
import { deckNeighbors } from "../../lib/workspaceDeck";
import ConciergeAI from "../../components/dashboard/ConciergeAI";
import AttentionRail from "../../components/dashboard/AttentionRail";
import { loadDeals } from "../../lib/deals/dealsClient";
import ConnectsBreakdown from "../../components/dashboard/ConnectsBreakdown";
import DashboardAmbientStrip from "../../components/dashboard/DashboardAmbientStrip";
import AtmosphereBackground from "../../components/ui/AtmosphereBackground";
import { getSession, getUser, signOut } from "../../lib/authClient";
import { normalizeDashboardModes, pickPrimaryRole } from "../../lib/dashboardModes";
import { missingLenses } from "../../lib/workspaceUnlock";
import { readDevelopmentMockUser } from "../../lib/developmentMock";
import { Search, Bookmark, MessageCircle, Briefcase } from "lucide-react";
import "./dashboard-motion.css";

const TAG_LABELS = {
  buyer: "Buyer / Seeker Workspace",
  seeker: "Buyer / Seeker Workspace",
  owner: "Owner & Developer Workspace",
  broker: "Broker Workspace",
  provider: "Provider Workspace",
  photographer: "Photographer Workspace",
  designer: "Event Designer Workspace",
  operator: "Co-Operator Workspace",
  exploring: "Buyer Workspace",
  mc_staff: "Staff Console · Simulated",
  mc_enterprise: "Enterprise Console · Preview",
};

function DashboardInner() {
  const router = useRouter();

  // Real sign-out. Both Sign Out buttons on this page previously only did
  // localStorage.removeItem("scoutit_user") — which clears the app's profile
  // cache but leaves the Supabase session AND refresh token valid, so the
  // user only appeared signed out. See signOut() in lib/authClient.js.
  const handleSignOut = async () => {
    await signOut();
    router.push("/onboarding");
  };
  const { connects, currentUser, notifications, markNotificationsRead, clearAllNotifications } = useDashboard();
  const [user, setUser] = useState(null);
  const [mode, setMode] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  const [showConnectsBreakdown, setShowConnectsBreakdown] = useState(false);
  const [showDesktopSwitcher, setShowDesktopSwitcher] = useState(false);
  const [showMobileProfileMenu, setShowMobileProfileMenu] = useState(false);
  const [unreadInboxCount, setUnreadInboxCount] = useState(0);

  const switcherRef = useRef(null);

  useEffect(() => {
    // A cached profile can shape presentation only after Supabase validates the
    // user. The sole exception is the explicit localhost development toolbox.
    let cancelled = false;
    const hydrateDevelopmentUser = async () => {
      const { data: { user: verifiedUser } } = await getUser();
      if (cancelled || verifiedUser) return;

      const parsed = readDevelopmentMockUser(localStorage, {
        nodeEnv: process.env.NODE_ENV,
        hostname: window.location.hostname,
      });
      if (!parsed) {
        localStorage.removeItem("scoutit_user");
        router.replace("/onboarding");
        return;
      }

      parsed.tags = normalizeDashboardModes(parsed.tags, parsed.primaryMode);
      parsed.primaryMode = pickPrimaryRole(parsed.tags, parsed.primaryMode);
      if (!parsed.primaryMode || parsed.tags.length === 0) {
        router.replace("/onboarding");
        return;
      }
      setUser(parsed);
      setMode(parsed.primaryMode);
    };
    hydrateDevelopmentUser();
    return () => { cancelled = true; };
  }, [router]);

  useEffect(() => {
    if (!currentUser?.id) return;

    // DashboardContext also exposes the localhost E2E identity as currentUser.
    // Its fields already use the client preview shape (tags/primaryMode), not
    // the Supabase profile shape (active_roles/primary_mode). Let the dedicated
    // development hydration effect above own it instead of collapsing it back
    // to the fallback owner role.
    const developmentUser = readDevelopmentMockUser(localStorage, {
      nodeEnv: process.env.NODE_ENV,
      hostname: window.location.hostname,
    });
    if (developmentUser?.id === currentUser.id) return;
    const tags = normalizeDashboardModes(
      currentUser.active_roles,
      currentUser.primary_mode || currentUser.role,
    );
    const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
    const requestedRole = params?.get("role") || params?.get("mode");
    const preferredMode = requestedRole ? normalizeDashboardMode(requestedRole) : "buyer";
    const primaryMode = pickPrimaryRole(tags, preferredMode) || "buyer";
    if (!primaryMode || tags.length === 0) {
      router.push("/onboarding");
      return;
    }

    const serverUser = {
      ...currentUser,
      name: currentUser.display_name || currentUser.user_metadata?.full_name || "ScoutIt User",
      tags,
      primaryMode,
      providerType: currentUser.provider_type || undefined,
      prcLicense: currentUser.prc_license || undefined,
    };
    // Keep verified profile data in React state; never persist it in the browser.
    setUser(serverUser);
    setMode(primaryMode);
  }, [currentUser, router]);

  // Unread-message badge on the Inbox nav entry -- separate from the
  // notification bell (that's for the "new inquiry" ping; this is for
  // "you have an unread reply waiting").
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      try {
        const { data: { session } } = await getSession();
        const localFixture = !session?.access_token
          ? readDevelopmentMockUser(localStorage, {
              hostname: window.location.hostname,
            })
          : null;
        const mockOwnerId = localFixture?.id === user.id ? localFixture.id : null;
        if (!session?.access_token && !mockOwnerId) return;
        // Shared loader — this badge and DashboardContext's role panels both
        // want the same rows at the same moment, and used to fetch them twice.
        // (The old call here also built a ?mockOwnerId= query the route never
        // read, while omitting the header that actually carries it.)
        const deals = await loadDeals({ mockUserId: mockOwnerId });
        if (cancelled) return;
        const total = deals.reduce((sum, d) => sum + (d.unreadCount || 0), 0);
        if (!cancelled) setUnreadInboxCount(total);
      } catch {
        // Inbox badge is a nice-to-have -- fail quietly, the bell still covers signaling.
      }
    })();
    return () => { cancelled = true; };
  }, [user]);

  useEffect(() => {
    const handleOpenMobileMenu = (e) => {
      if (e?.detail) e.detail.handled = true;
      setShowMobileProfileMenu(true);
    };
    const handleSwitchWorkspace = (e) => {
      const target = e?.detail?.role;
      if (!target) return;
      if (target === "photographer") {
        setMode("provider");
        setUser((prev) => prev ? { ...prev, primaryMode: "provider", providerType: "photographer" } : prev);
        return;
      }
      if (target === "designer" || target === "event-planner") {
        setMode("provider");
        setUser((prev) => prev ? { ...prev, primaryMode: "provider", providerType: "designer" } : prev);
        return;
      }
      if (target === "seeker") {
        setMode("buyer");
        setUser((prev) => prev ? { ...prev, primaryMode: "buyer" } : prev);
        return;
      }
      if (target === "salesperson") {
        setMode("broker");
        setUser((prev) => prev ? { ...prev, primaryMode: "broker" } : prev);
        return;
      }
      const validModes = ["owner", "broker", "buyer", "provider", "operator", "mc_enterprise", "exploring"];
      if (validModes.includes(target)) {
        setMode(target);
        setUser((prev) => prev ? { ...prev, primaryMode: target } : prev);
      }
    };
    window.addEventListener("scoutit:open-mobile-menu", handleOpenMobileMenu);
    window.addEventListener("scoutit:switch-workspace", handleSwitchWorkspace);
    return () => {
      window.removeEventListener("scoutit:open-mobile-menu", handleOpenMobileMenu);
      window.removeEventListener("scoutit:switch-workspace", handleSwitchWorkspace);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const requestedRole = params.get("role") || params.get("mode");
    if (!requestedRole) return;
    if (requestedRole === "photographer") {
      setMode("provider");
      setUser((prev) => prev ? { ...prev, primaryMode: "provider", providerType: "photographer" } : prev);
      return;
    }
    if (requestedRole === "designer" || requestedRole === "event-planner") {
      setMode("provider");
      setUser((prev) => prev ? { ...prev, primaryMode: "provider", providerType: "designer" } : prev);
      return;
    }
    if (requestedRole === "seeker") {
      setMode("buyer");
      setUser((prev) => prev ? { ...prev, primaryMode: "buyer" } : prev);
      return;
    }
    if (requestedRole === "salesperson") {
      setMode("broker");
      setUser((prev) => prev ? { ...prev, primaryMode: "broker" } : prev);
      return;
    }
    const validModes = ["owner", "broker", "buyer", "provider", "operator", "mc_enterprise", "exploring"];
    if (validModes.includes(requestedRole)) {
      setMode(requestedRole);
      setUser((prev) => prev ? { ...prev, primaryMode: requestedRole } : prev);
    }
  }, [user]);

  // Click outside to close desktop switcher
  useEffect(() => {
    function handleClickOutside(event) {
      if (switcherRef.current && !switcherRef.current.contains(event.target)) {
        setShowDesktopSwitcher(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [switcherRef]);

  if (!user) {
    return (
      <div className="relative min-h-screen bg-background text-text-primary flex flex-col" aria-busy="true">
        <AtmosphereBackground variant="dashboard" />
        <header className="relative z-40 sticky top-0 bg-background/90 backdrop-blur-md border-b border-surface-variant px-4 py-3 md:px-6 flex items-center justify-between" aria-hidden="true">
          <div className="h-7 w-28 rounded bg-surface-variant/60 animate-pulse" />
          <div className="h-8 w-36 rounded-full bg-gold-accent/15 animate-pulse" />
        </header>
        <main className="relative z-10 w-full max-w-[1400px] mx-auto px-4 md:px-8 py-10 grid grid-cols-1 md:grid-cols-3 gap-6" aria-hidden="true">
          {[1, 2, 3].map((n) => (
            <div key={n} className="card-atmosphere p-6 rounded-2xl border border-surface-variant/60 animate-pulse min-h-[220px] flex flex-col justify-between">
              <div className="space-y-3">
                <div className="h-3 w-24 rounded bg-gold-accent/20" />
                <div className="h-6 w-3/4 rounded bg-surface-variant/60" />
                <div className="h-3.5 w-full rounded bg-surface-variant/40" />
              </div>
              <div className="h-9 w-32 rounded bg-surface-variant/50 mt-6" />
            </div>
          ))}
        </main>
      </div>
    );
  }

  const handleSwitchMode = (newMode) => {
    setMode(newMode);
    setShowDesktopSwitcher(false);
    setShowMobileProfileMenu(false);
    
    // Optimistically update the in-memory display mode. Supabase remains the
    // identity authority; authenticated profile data is never browser-cached.
    const updatedUser = { ...user, primaryMode: newMode };
    // The server-approved profile refresh is authoritative after navigation.
    setUser(updatedUser);
  };

  const renderActiveMode = () => {
    switch (mode) {
      case "owner": return <OwnerMode />;
      case "broker": return <BrokerMode />;
      case "buyer":
      case "exploring": return <BuyerMode />;
      case "provider": return <ProviderMode type={user.providerType} />;
      case "operator": return <OperatorMode />;
      case "mc_enterprise": return <MissionControlMode />;
      // A-096: an unrecognised mode used to render bare "Unknown Mode" text
      // with no heading, no branding, and no way back. Branded, headed, and
      // with a door (the doorway principle) — the mode is still unknown.
      default: return (
        <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
          <span className="font-label-caps text-gold-accent tracking-widest uppercase text-[12px] mb-2 block">Workspace</span>
          <h1 className="font-headline-editorial text-3xl text-on-surface mb-3">Workspace unavailable</h1>
          <p className="text-text-secondary text-sm max-w-md mb-6">Your account role did not match a known workspace. Nothing is lost: continue exploring, or contact support if this keeps happening.</p>
          <Link href="/property" className="font-mono text-[12px] uppercase tracking-widest text-gold-accent hover:underline">Continue exploring →</Link>
        </div>
      );
    }
  };

  const PRIMARY_ACTIONS = {
    owner: { icon: "+", label: "List" },
    broker: { icon: "⚡", label: "Pitch" },
    buyer: { icon: <Search strokeWidth={1.5} size="1em" />, label: "Scout" },
    exploring: { icon: <Search strokeWidth={1.5} size="1em" />, label: "Scout" },
    provider: { icon: "🖼️", label: "Portfolio" },
  };
  // A-096: operator and enterprise have no entry, and no mode component of
  // theirs hears the primary-action event — so the old `{icon:"●",label:""}`
  // fallback rendered a dead button whose aria-label="" actively REMOVED its
  // accessible name. No entry now means no button rather than a dead one.
  const primaryAction = PRIMARY_ACTIONS[mode] || null;

  // A-205 Workspace Deck: Workspace is the default panel; swipe-left reveals
  // the Inbox, swipe-right the CRM (pipeline roles) — see workspaceDeck.js.
  // An unresolved mode fails closed to the buyer-safe two-panel deck.
  const deckNav = deckNeighbors("workspace", mode || "buyer");

  // Mode components listen for this to run their own primary action
  // (owner → open wizard, buyer → focus search, broker → jump to feed)
  const firePrimaryAction = () => {
    window.dispatchEvent(new CustomEvent("scoutit:primary-action", { detail: { mode } }));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
    if (!showNotifications && unreadCount > 0) {
      markNotificationsRead();
    }
  };

  return (
    <div className="relative min-h-screen bg-background text-text-primary flex flex-col pb-[100px] md:pb-24">
      {/* Role-specific ambient atmosphere layer (Layer 5 Ambient Role Atmosphere
          per DASHBOARD_ATMOSPHERE_FRAMEWORK.md): spatial contours for Buyer,
          structural blueprint for Owner, tactical velocity streaks for Broker,
          telemetry grid for Operator/Provider. */}
      <AtmosphereBackground variant={mode || "dashboard"} />

      {/* Top Nav (Persistent) */}
      <header className="relative z-40 sticky top-0 bg-background/90 backdrop-blur-md border-b border-surface-variant px-4 py-2.5 md:px-6 md:py-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <div className="flex items-center gap-4 lg:gap-6 shrink-0">
          <Link href="/" className="font-display-md text-xl md:text-2xl text-gold-accent tracking-tighter text-glow">S<span className="text-on-surface">cout</span>IT</Link>
          
          {/* Custom Desktop Workspace Switcher */}
          <div className="hidden md:block relative" ref={switcherRef}>
            <button 
              className="flex items-center gap-2 bg-surface hover:bg-surface-alt border border-surface-variant text-on-surface text-sm font-working-title px-4 py-2 rounded-full uppercase tracking-wider active:scale-[0.97] transition duration-160 ease-out"
              onClick={() => setShowDesktopSwitcher(!showDesktopSwitcher)}
            >
              <span className="text-gold-accent font-semibold">Workspace:</span> {TAG_LABELS[mode]}
              <span className="text-[12px] ml-1">▼</span>
            </button>
            
            {showDesktopSwitcher && (
              <div className="absolute top-full left-0 mt-2 w-64 bg-surface border border-surface-variant rounded-lg shadow-2xl overflow-hidden z-50 motion-safe:animate-[fadeIn_0.2s_ease-out]">
                <div className="px-4 py-3 border-b border-surface-variant bg-surface-alt">
                  <span className="font-label-caps text-[12px] tracking-widest uppercase text-text-secondary">Switch Workspace</span>
                </div>
                <div className="flex flex-col py-2">
                  {user.tags.map(tagId => (
                    <button
                      key={tagId}
                      className={`text-left px-4 py-3 font-working-title text-sm active:scale-[0.97] transition duration-160 ease-out hover:bg-surface-container ${mode === tagId ? 'text-gold-accent bg-surface-container-low border-l-2 border-gold-accent' : 'text-on-surface border-l-2 border-transparent'}`}
                      onClick={() => handleSwitchMode(tagId)}
                    >
                      {TAG_LABELS[tagId]}
                    </button>
                  ))}
                </div>
                {/* A-137: the switcher lists earned lenses only. Locked lenses
                    are never named here — the footer is the one quiet door to
                    Settings, where broker / provider are earned by verification. */}
                {missingLenses(user.tags).length > 0 && (
                  <div className="border-t border-surface-variant px-4 py-2">
                    <Link
                      href="/settings#account"
                      onClick={() => setShowDesktopSwitcher(false)}
                      className="flex items-center min-h-[44px] font-mono text-[12px] uppercase tracking-widest text-text-secondary hover:text-gold-accent transition"
                    >
                      Unlock more workspaces →
                    </Link>
                  </div>
                )}

              </div>
            )}
          </div>
        </div>

        {/* Forecast & Ambient Conditions in Header */}
        <div className="hidden lg:flex flex-1 items-center justify-center min-w-0 max-w-xl mx-2">
          <DashboardAmbientStrip user={user} />
        </div>

        <div className="flex items-center gap-4 md:gap-6 shrink-0">
          <div className="hidden md:block relative">
            <button
              className="flex items-center gap-2 text-gold-accent font-label-caps text-[12px] tracking-widest bg-gold-accent/10 px-3 py-1.5 rounded-full hover:bg-gold-accent/20 active:scale-[0.97] transition duration-160 ease-out"
              title="View your Connects breakdown"
              onClick={() => setShowConnectsBreakdown((v) => !v)}
            >
              <span className="icon">◈</span>
              <span>{connects !== undefined ? connects : user.connects_balance} CONNECTS</span>
            </button>
            <ConnectsBreakdown
              open={showConnectsBreakdown}
              onClose={() => setShowConnectsBreakdown(false)}
              mode={mode}
              providerType={user.providerType}
              tier={user.subscription_tier || user.tier}
            />
          </div>

          {/* CRM Nav (Owner/Broker only) */}
          {(mode === "owner" || mode === "broker") && (
            <Link
              href="/dashboard/crm"
              className="relative w-11 h-11 flex items-center justify-center text-text-secondary hover:text-gold-accent transition"
              aria-label="Master CRM"
              title="Master CRM"
            >
              <Briefcase strokeWidth={1.5} size={20} />
            </Link>
          )}

          {(mode === "owner" || mode === "broker" || mode === "operator") && (
            <Link href="/dashboard/open-gate" className="font-mono text-[12px] uppercase tracking-wider text-gold-accent hover:underline" aria-label="Open Gate settings">Open Gate</Link>
          )}

          <Link
            href="/dashboard/inbox"
            className="relative w-11 h-11 flex items-center justify-center text-text-secondary hover:text-gold-accent transition"
            aria-label="Inbox"
            title="Inbox"
          >
            <MessageCircle strokeWidth={1.5} size={20} />
            {unreadInboxCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-3.5 h-3.5 bg-gold-accent rounded-full border-2 border-background flex items-center justify-center text-[12px] font-bold text-background">
                {unreadInboxCount}
              </span>
            )}
          </Link>

          <div className="relative">
            <button
              className="text-xl hover:opacity-80 transition-opacity relative w-11 h-11 flex items-center justify-center"
              onClick={toggleNotifications}
              aria-label="Notifications"
            >
              🔔
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-error rounded-full border-2 border-background flex items-center justify-center text-[12px] font-bold text-white">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] bg-surface border border-surface-variant rounded-lg shadow-2xl overflow-hidden z-50">
                <div className="p-3 border-b border-surface-variant bg-surface-alt flex justify-between items-center">
                  <span className="font-label-caps text-[12px] tracking-widest uppercase text-text-secondary">Notifications</span>
                  {notifications.length > 0 && (
                    <button type="button" className="text-xs text-gold-accent hover:underline" onClick={clearAllNotifications}>Clear All</button>
                  )}
                </div>
                  <div className="max-h-[300px] overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-sm text-text-secondary italic">All caught up.</div>
                    ) : (
                      notifications.map(notif => (
                        <button type="button" 
                          key={notif.id} 
                          onClick={() => {
                            if (notif.notificationType === 'inquiry') {
                              router.push('/dashboard/inbox');
                              setShowNotifications(false);
                            } else if (notif.propertyId) {
                              router.push(`/dashboard/inventory/${notif.propertyId}`);
                              setShowNotifications(false);
                            }
                          }}
                          className={`p-4 border-b border-surface-variant/50 flex gap-3 transition text-left block w-full ${!notif.read ? 'bg-surface-container-low' : ''} ${(notif.notificationType === 'inquiry' || notif.propertyId) ? 'cursor-pointer hover:bg-surface-variant' : ''}`}
                        >
                          <div className="text-2xl shrink-0">{notif.icon}</div>
                          <div>
                            <div className="font-working-title text-sm text-on-surface mb-1">{notif.title}</div>
                            <div className="text-xs text-text-secondary">{notif.desc}</div>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
              </div>
            )}
          </div>

          {/* Desktop User Menu (Hidden on mobile) */}
          <div className="hidden md:flex items-center gap-3">
            <Link href="/settings" title="Account Settings" className="text-lg text-text-secondary hover:text-on-surface transition">⚙️</Link>
            <Link href="/profile" title="Your Profile" className="w-8 h-8 rounded-full bg-surface-variant border border-surface-variant flex items-center justify-center font-working-title text-sm font-bold text-on-surface hover:border-gold-accent transition">
              {user.name ? user.name.substring(0,2).toUpperCase() : 'U'}
            </Link>
            <button 
              className="text-lg text-text-secondary hover:text-error transition ml-2"
              onClick={handleSignOut}
              title="Sign Out"
            >
              🚪
            </button>
          </div>
          
          {/* Mobile Connects & Profile (Menu Trigger) */}
          <div className="md:hidden flex items-center gap-3">
            <div className="relative">
              <button
                className="flex items-center gap-1 text-gold-accent font-label-caps text-[12px] tracking-widest"
                title="View your Connects breakdown"
                onClick={() => setShowConnectsBreakdown((v) => !v)}
              >
                <span>◈</span>
                <span>{connects !== undefined ? connects : user.connects_balance}</span>
              </button>
              <ConnectsBreakdown
                open={showConnectsBreakdown}
                onClose={() => setShowConnectsBreakdown(false)}
                mode={mode}
                providerType={user.providerType}
                tier={user.subscription_tier || user.tier}
              />
            </div>
            <button
              className="w-10 h-10 rounded-full bg-surface-alt border border-surface-variant flex items-center justify-center font-working-title text-sm font-bold text-on-surface hover:border-gold-accent transition"
              onClick={() => setShowMobileProfileMenu(true)}
              title="Open Mobile Menu"
              aria-label="Open menu"
            >
              {user.name ? user.name.substring(0,2).toUpperCase() : 'U'}
            </button>
          </div>
        </div>
        {/* A-205 Workspace Deck strip — the swipe deck's tab mirror, riding
            inside the sticky header so it survives the long workspace scroll.
            Mobile only; desktop keeps the switcher + header icons. */}
        <div className="md:hidden w-full">
          <WorkspaceCommandBar active="workspace" badges={{ inbox: unreadInboxCount }} />
        </div>
      </header>

      {/* Main Content Area (Mode determined) */}
      <DeckPanel leftHref={deckNav.leftHref} rightHref={deckNav.rightHref}>
      <main className="relative z-10 flex-1 w-full max-w-7xl mx-auto px-4 py-6 md:p-6">
        <Nudge mode={mode} />
        {/* The cross-workspace signal comes before the role surface: whether
            something is waiting in the Inbox, CRM or Calendar is the question
            people open the dashboard to answer, and it is the same question
            for every role. */}
        <AttentionRail mockUserId={user.id} className="mb-6" />
        {["buyer", "exploring", "owner", "broker"].includes(mode) ? (
          <div className="dashboard-lens-motion">
            <svg
              className="dashboard-signal-field"
              viewBox="0 0 440 170"
              preserveAspectRatio="xMaxYMin meet"
              fill="none"
              aria-hidden="true"
              focusable="false"
            >
              <path className="dashboard-signal-track" d="M0 134 H93 L135 92 H226 L268 50 H440" />
              <path className="dashboard-signal-trace" pathLength="200" d="M0 134 H93 L135 92 H226 L268 50 H440" />
              <path className="dashboard-signal-track dashboard-signal-track--second" d="M64 169 H158 L200 127 H310 L352 85 H440" />
              <path className="dashboard-signal-trace dashboard-signal-trace--second" pathLength="200" d="M64 169 H158 L200 127 H310 L352 85 H440" />
              <circle className="dashboard-signal-node" cx="268" cy="50" r="3" />
              <circle className="dashboard-signal-node dashboard-signal-node--second" cx="352" cy="85" r="2" />
            </svg>
            {renderActiveMode()}
          </div>
        ) : renderActiveMode()}
      </main>
      </DeckPanel>

      <Toasts />
      <ConciergeAI />

      {/* Primary Action FAB (Floating above global BottomNav). Rendered only
          for modes that define one — see PRIMARY_ACTIONS above. */}
      {primaryAction && (
      <button
        className="md:hidden fixed right-4 z-40 bg-gold-accent text-background w-14 h-14 rounded-full flex flex-col items-center justify-center shadow-[0_8px_24px_rgba(var(--accent-rgb),0.4)] hover:opacity-90 transition-[transform,opacity] duration-150 ease-out active:scale-[0.94] touch-manipulation border-2 border-surface-alt"
        style={{ bottom: "calc(var(--mobile-nav-height, 82px) + 16px)" }}
        onClick={firePrimaryAction}
        aria-label={primaryAction.label}
      >
        <span className="text-xl leading-none font-bold">{primaryAction.icon}</span>
        <span className="text-[12px] font-working-title font-bold mt-0.5 tracking-tighter uppercase leading-none">{primaryAction.label}</span>
      </button>
      )}

      {/* Mobile Profile Menu Slide-out */}
      {showMobileProfileMenu && (
        <div className="md:hidden fixed inset-0 z-[100001] flex flex-col justify-end motion-safe:animate-[fadeIn_0.3s_ease-out]">
          <button type="button" aria-label="Close Mobile Profile Menu" className="absolute inset-0 w-full h-full block bg-background/60 backdrop-blur-sm" onClick={() => setShowMobileProfileMenu(false)}></button>
          <div className="bg-surface border-t border-surface-variant rounded-t-2xl w-full p-6 pb-[max(24px,calc(16px+env(safe-area-inset-bottom)))] motion-safe:animate-[slideUp_0.3s_ease-out] relative z-10">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-surface-alt border border-surface-variant flex items-center justify-center font-bold text-on-surface">
                  {user.name ? user.name.substring(0,2).toUpperCase() : 'U'}
                </div>
                <div>
                  <h3 className="font-working-title text-on-surface">{user.name}</h3>
                  <Link href="/profile" className="text-xs text-gold-accent hover:underline">View Your Profile</Link>
                </div>
              </div>
              <button className="text-text-secondary w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full hover:bg-surface-variant active:scale-95 touch-manipulation transition-[transform,background-color] duration-150" aria-label="Close" onClick={() => setShowMobileProfileMenu(false)}>✕</button>
            </div>
            
            <div className="mb-2 flex items-center justify-between">
              <span className="font-label-caps text-[12px] tracking-widest uppercase text-gold-accent font-semibold">
                Your Active Workspaces
              </span>
              <span className="font-mono text-[10px] uppercase tracking-wider text-text-muted">
                Tap to switch
              </span>
            </div>
            <div className="flex flex-col gap-2 mb-3">
              {(user.tags.length > 0 ? user.tags : ["buyer"]).map(tagId => (
                <button
                  key={tagId}
                  className={`flex items-center justify-between p-3.5 rounded-lg font-working-title text-sm border transition-[transform,border-color,background-color] duration-150 ease-out active:scale-[0.98] touch-manipulation ${mode === tagId ? 'bg-surface-container-low border-gold-accent text-gold-accent font-semibold' : 'bg-surface border-surface-variant text-on-surface hover:border-text-secondary'}`}
                  onClick={() => handleSwitchMode(tagId)}
                >
                  <span className="uppercase tracking-wider">{TAG_LABELS[tagId] || tagId}</span>
                  {mode === tagId ? (
                    <span className="font-mono text-[10px] uppercase tracking-widest text-gold-accent px-1.5 py-0.5 rounded border border-gold-accent/40 bg-gold-accent/15">
                      Active ✓
                    </span>
                  ) : (
                    <span className="font-mono text-[10px] uppercase tracking-wider text-text-muted">Switch →</span>
                  )}
                </button>
              ))}
            </div>

            {/* Available Roles to Add / Unlock in Settings */}
            <div className="pt-3 pb-2 border-t border-surface-variant flex items-center justify-between">
              <span className="font-label-caps text-[12px] tracking-widest uppercase text-text-secondary font-semibold">
                Available Roles to Add
              </span>
              <Link
                href="/settings#account"
                onClick={() => setShowMobileProfileMenu(false)}
                className="font-mono text-[10px] uppercase tracking-wider text-gold-accent hover:underline"
              >
                Settings →
              </Link>
            </div>
            <div className="flex flex-col gap-2 mb-3">
              {[
                { id: "buyer", label: "Buyer / Seeker", desc: "Search spaces, viewings & private board" },
                { id: "owner", label: "Property Owner & Developer", desc: "List spaces, inventory & inquiries" },
                { id: "broker", label: "Accredited Broker", desc: "Client representation & deal pipeline (PRC)" },
                { id: "operator", label: "Co-Operator & Facilities", desc: "Space management & operations log" },
                { id: "photographer", label: "Spatial Photographer", desc: "Space photography & QuestIT bounties" },
                { id: "designer", label: "Event & Concept Designer", desc: "Bespoke spatial concepts & staging" },
              ].filter(item => !user.tags.includes(item.id) && !(item.id === "buyer" && user.tags.includes("seeker"))).map(item => (
                <Link
                  key={item.id}
                  href="/settings#account"
                  onClick={() => setShowMobileProfileMenu(false)}
                  className="flex items-center justify-between p-3 rounded-lg border border-surface-variant bg-surface-alt/30 hover:border-gold-accent/40 transition group"
                >
                  <div>
                    <div className="font-working-title text-sm text-text-primary group-hover:text-gold-accent transition">{item.label}</div>
                    <div className="text-xs text-text-muted mt-0.5">{item.desc}</div>
                  </div>
                  <span className="font-mono text-[10px] uppercase tracking-wider text-gold-accent px-2 py-0.5 rounded bg-gold-accent/10 border border-gold-accent/30 shrink-0 group-hover:bg-gold-accent group-hover:text-black transition">
                    + Add Role
                  </span>
                </Link>
              ))}
            </div>

            <Link
              href="/settings#account"
              onClick={() => setShowMobileProfileMenu(false)}
              className="flex items-center justify-center min-h-[44px] p-3 rounded-lg border border-gold-accent/40 bg-gold-accent/10 font-mono text-[11px] uppercase tracking-widest text-gold-accent hover:bg-gold-accent hover:text-black transition font-semibold mb-2"
            >
              + Add or Increase Roles in Settings →
            </Link>

            {missingLenses(user.tags).length > 0 && (
              <Link
                href="/settings#account"
                onClick={() => setShowMobileProfileMenu(false)}
                className="flex items-center min-h-[44px] font-mono text-[12px] uppercase tracking-widest text-text-secondary hover:text-gold-accent transition"
              >
                Need another workspace? Unlock in Settings →
              </Link>
            )}


            <div className="border-t border-surface-variant pt-4 pb-3">
              <div className="mb-2">
                <span className="font-label-caps text-[12px] tracking-widest uppercase text-text-secondary">Forecast &amp; Ambient</span>
              </div>
              <DashboardAmbientStrip user={user} />
            </div>

            <div className="border-t border-surface-variant pt-4">
              <Link href="/settings" className="flex items-center gap-3 text-text-secondary hover:text-on-surface font-working-title text-sm py-2">
                <span>⚙️</span> Account Settings
              </Link>
              <button
                className="flex items-center gap-3 text-text-secondary hover:text-error font-working-title text-sm py-2 w-full text-left"
                onClick={handleSignOut}
              >
                <span>🚪</span> Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function UnifiedDashboard() {
  return (
    <DashboardProvider>
      <VerifiedWorkspaceBoundary>
        <DashboardInner />
      </VerifiedWorkspaceBoundary>
    </DashboardProvider>
  );
}
