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
import Toasts from "../../components/ui/Toasts";
import DeckPanel from "../../components/dashboard/DeckPanel";
import WorkspaceCommandBar from "../../components/dashboard/WorkspaceCommandBar";
import WorkspaceDeckDrawer from "../../components/dashboard/WorkspaceDeckDrawer";
import { deckNeighbors } from "../../lib/workspaceDeck";
import ConciergeAI from "../../components/dashboard/ConciergeAI";
import AttentionRail from "../../components/dashboard/AttentionRail";
import { loadDeals } from "../../lib/deals/dealsClient";
import ConnectsBreakdown from "../../components/dashboard/ConnectsBreakdown";
import DashboardAmbientStrip from "../../components/dashboard/DashboardAmbientStrip";
import AtmosphereBackground from "../../components/ui/AtmosphereBackground";
import { getSession, getUser, signOut } from "../../lib/authClient";
import {
  canAccessDashboardWorkspace,
  inferProviderType,
  normalizeDashboardMode,
  normalizeDashboardModes,
  pickPrimaryRole,
} from "../../lib/dashboardModes";
import { missingLenses } from "../../lib/workspaceUnlock";
import { readDevelopmentMockUser } from "../../lib/developmentMock";
import { registerMobileBackAction } from "@/lib/mobileBackStack";
import {
  Search,
  Briefcase,
  Bell,
  Settings,
  LogOut,
  ChevronRight,
  Building2,
  ShieldCheck,
  Cog,
  Camera,
  Palette,
  Plus,
  Zap,
} from "lucide-react";
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

const WORKSPACE_ROLE_OPTIONS = [
  { id: "buyer", mode: "buyer", label: "Buyer / Seeker", desc: "Search spaces, viewings & private board", icon: Search },
  { id: "owner", mode: "owner", label: "Property Owner & Developer", desc: "List properties, review leads & inventory", icon: Building2 },
  { id: "broker", mode: "broker", label: "Accredited Broker", desc: "Client representation & deal pipeline (PRC)", icon: Briefcase },
  { id: "salesperson", mode: "broker", label: "Real Estate Salesperson", desc: "Property sales & viewings under broker supervision", icon: ShieldCheck },
  { id: "operator", mode: "operator", label: "Co-Operator & Facilities", desc: "Space management & operations log", icon: Cog },
  { id: "photographer", mode: "provider", providerType: "photographer", label: "Spatial Photographer", desc: "Space photography & QuestIT bounties", icon: Camera },
  { id: "designer", mode: "provider", providerType: "designer", label: "Event & Concept Designer", desc: "Bespoke spatial concepts & staging", icon: Palette },
];

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
  const { connects, currentUser, notifications, markNotificationsRead, clearAllNotifications, addToast } = useDashboard();
  const [user, setUser] = useState(null);
  const [mode, setMode] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  const [showConnectsBreakdown, setShowConnectsBreakdown] = useState(false);
  const [showDesktopSwitcher, setShowDesktopSwitcher] = useState(false);
  const [showMobileProfileMenu, setShowMobileProfileMenu] = useState(false);
  const [unreadInboxCount, setUnreadInboxCount] = useState(0);
  const [isWizardActive, setIsWizardActive] = useState(false);
  const [isBottomNavExpanded, setIsBottomNavExpanded] = useState(true);

  useEffect(() => {
    const handleNavState = (e) => {
      if (typeof e?.detail?.expanded === "boolean") {
        setIsBottomNavExpanded(e.detail.expanded);
      }
    };
    window.addEventListener("scoutit:bottom-nav-state", handleNavState);
    return () => window.removeEventListener("scoutit:bottom-nav-state", handleNavState);
  }, []);

  useEffect(() => {
    const handleWizardState = (e) => {
      setIsWizardActive(Boolean(e?.detail?.active));
    };
    window.addEventListener("scoutit:wizard-state", handleWizardState);
    return () => window.removeEventListener("scoutit:wizard-state", handleWizardState);
  }, []);

  const switcherRef = useRef(null);
  const notificationsRef = useRef(null);

  // Close notifications dropdown on outside click or Escape key
  useEffect(() => {
    if (!showNotifications) return;
    const handleClickOutside = (e) => {
      if (notificationsRef.current && !notificationsRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [showNotifications]);

  // Mobile Back button undo integration for dropdowns
  useEffect(() => {
    if (showNotifications) {
      return registerMobileBackAction(() => {
        setShowNotifications(false);
      }, { action: "notifications_dropdown" });
    }
  }, [showNotifications]);

  useEffect(() => {
    if (showDesktopSwitcher) {
      return registerMobileBackAction(() => {
        setShowDesktopSwitcher(false);
      }, { action: "desktop_role_switcher" });
    }
  }, [showDesktopSwitcher]);

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
    const rawHeldRoles = [
      ...(Array.isArray(currentUser.active_roles) ? currentUser.active_roles : []),
      currentUser.primary_mode,
      currentUser.role,
    ].filter(Boolean);
    const tags = normalizeDashboardModes(
      currentUser.active_roles,
      currentUser.primary_mode || currentUser.role,
    );
    const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
    const requestedRole = params?.get("role") || params?.get("mode");
    const isAuthorizedRequest = requestedRole && canAccessDashboardWorkspace(requestedRole, rawHeldRoles);
    const preferredMode = isAuthorizedRequest ? normalizeDashboardMode(requestedRole) : "buyer";
    const primaryMode = isAuthorizedRequest
      ? preferredMode
      : (pickPrimaryRole(tags, preferredMode) || "buyer");
    if (!primaryMode || (tags.length === 0 && !isAuthorizedRequest)) {
      router.push("/onboarding");
      return;
    }

    const serverUser = {
      ...currentUser,
      name: currentUser.display_name || currentUser.user_metadata?.full_name || "ScoutIt User",
      tags,
      primaryMode,
      providerType: isAuthorizedRequest
        ? inferProviderType(requestedRole, currentUser.provider_type)
        : (currentUser.provider_type || undefined),
      prcLicense: currentUser.prc_license || undefined,
    };
    // Keep verified profile data in React state; never persist it in the browser.
    setUser(serverUser);
    setMode(primaryMode);

    if (typeof window !== "undefined") {
      const activeRoleKey = requestedRole && isAuthorizedRequest
        ? requestedRole
        : (primaryMode === "provider" ? (serverUser.providerType || "photographer") : primaryMode);
      window.dispatchEvent(new CustomEvent("scoutit:workspace-changed", { detail: { role: activeRoleKey, mode: primaryMode } }));
    }
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
      if (!target || !user) return;
      const heldRoles = [
        ...(Array.isArray(user.active_roles) ? user.active_roles : []),
        ...(Array.isArray(user.tags) ? user.tags : []),
        user.role,
      ].filter(Boolean);
      if (!canAccessDashboardWorkspace(target, heldRoles)) {
        addToast?.("Activate that role in Settings first to unlock its workspace.", "⚠️");
        return;
      }
      const nextMode = normalizeDashboardMode(target);
      if (!nextMode) return;
      const nextProviderType = inferProviderType(target, user.providerType);
      setMode(nextMode);
      setUser((prev) =>
        prev
          ? {
              ...prev,
              primaryMode: nextMode,
              ...(nextProviderType ? { providerType: nextProviderType } : {}),
            }
          : prev
      );
      try {
        const url = new URL(window.location.href);
        url.searchParams.set("role", target);
        window.history.replaceState(null, "", url.toString());
      } catch {}
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("scoutit:workspace-changed", { detail: { role: target, mode: nextMode } }));
      }
    };
    window.addEventListener("scoutit:open-mobile-menu", handleOpenMobileMenu);
    window.addEventListener("scoutit:switch-workspace", handleSwitchWorkspace);
    return () => {
      window.removeEventListener("scoutit:open-mobile-menu", handleOpenMobileMenu);
      window.removeEventListener("scoutit:switch-workspace", handleSwitchWorkspace);
    };
  }, [user, addToast]);

  useEffect(() => {
    if (typeof window === "undefined" || !user) return;
    const syncFromUrl = () => {
      const params = new URLSearchParams(window.location.search);
      const requestedRole = params.get("role") || params.get("mode");
      if (!requestedRole) return;
      const heldRoles = [
        ...(Array.isArray(user.active_roles) ? user.active_roles : []),
        ...(Array.isArray(user.tags) ? user.tags : []),
        user.role,
      ].filter(Boolean);
      if (!canAccessDashboardWorkspace(requestedRole, heldRoles)) {
        return;
      }
      const nextMode = normalizeDashboardMode(requestedRole);
      if (!nextMode) return;
      const nextProviderType = inferProviderType(requestedRole, user.providerType);
      if (mode !== nextMode) {
        setMode(nextMode);
      }
      if (user.primaryMode !== nextMode || (nextProviderType && user.providerType !== nextProviderType)) {
        setUser((prev) =>
          prev
            ? {
                ...prev,
                primaryMode: nextMode,
                ...(nextProviderType ? { providerType: nextProviderType } : {}),
              }
            : prev
        );
      }
    };
    syncFromUrl();
    window.addEventListener("popstate", syncFromUrl);
    return () => window.removeEventListener("popstate", syncFromUrl);
  }, [user, mode]);

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

  const heldRoles = [
    ...(Array.isArray(user?.active_roles) ? user.active_roles : []),
    ...(Array.isArray(user?.tags) ? user.tags : []),
    user?.role,
  ].filter(Boolean);

  const isRoleUnlocked = (opt) => canAccessDashboardWorkspace(opt.id, heldRoles);

  const isRoleActive = (opt) => {
    if (opt.id === "photographer") {
      return mode === "provider" && (user?.providerType === "photographer" || !user?.providerType);
    }
    if (opt.id === "designer") {
      return mode === "provider" && user?.providerType === "designer";
    }
    if (opt.id === "salesperson") {
      return mode === "broker" && user?.role === "salesperson";
    }
    if (opt.id === "broker") {
      return mode === "broker" && user?.role !== "salesperson";
    }
    if (opt.mode === "buyer" && (mode === "buyer" || mode === "exploring")) return true;
    return mode === opt.mode;
  };

  const handleSwitchMode = (newMode) => {
    if (!canAccessDashboardWorkspace(newMode, heldRoles)) {
      addToast?.("Activate that role in Settings first to unlock its workspace.", "⚠️");
      return;
    }
    const resolvedMode = normalizeDashboardMode(newMode) || newMode;
    const resolvedProviderType = inferProviderType(newMode, user?.providerType);
    setMode(resolvedMode);
    setShowDesktopSwitcher(false);
    setShowMobileProfileMenu(false);
    
    // Optimistically update the in-memory display mode. Supabase remains the
    // identity authority; authenticated profile data is never browser-cached.
    const updatedUser = {
      ...user,
      primaryMode: resolvedMode,
      ...(resolvedProviderType ? { providerType: resolvedProviderType } : {}),
    };
    setUser(updatedUser);

    try {
      const url = new URL(window.location.href);
      url.searchParams.set("role", newMode);
      window.history.replaceState(null, "", url.toString());
    } catch {}

    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("scoutit:workspace-changed", { detail: { role: newMode, mode: resolvedMode } }));
    }
  };

  const renderActiveMode = () => {
    switch (mode) {
      case "owner": return <OwnerMode />;
      case "broker": return <BrokerMode />;
      case "buyer":
      case "exploring": return <BuyerMode />;
      case "provider": return <ProviderMode type={user?.providerType || "photographer"} />;
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
    owner: { icon: <Plus size={20} strokeWidth={2.5} />, label: "List" },
    broker: { icon: <Zap size={18} strokeWidth={2} />, label: "Pitch" },
    salesperson: { icon: <Zap size={18} strokeWidth={2} />, label: "Pitch" },
    buyer: { icon: <Search strokeWidth={1.8} size={18} />, label: "Scout" },
    exploring: { icon: <Search strokeWidth={1.8} size={18} />, label: "Scout" },
    provider: user?.providerType === "designer"
      ? { icon: <Palette size={18} strokeWidth={2} />, label: "Studio" }
      : { icon: <Camera size={18} strokeWidth={2} />, label: "Portfolio" },
    photographer: { icon: <Camera size={18} strokeWidth={2} />, label: "Portfolio" },
    designer: { icon: <Palette size={18} strokeWidth={2} />, label: "Studio" },
    operator: { icon: <Building2 size={18} strokeWidth={2} />, label: "Units" },
  };
  const primaryAction = PRIMARY_ACTIONS[mode] || null;

  // A-205 Workspace Deck: Workspace is the default panel; swipe-left reveals
  // the Inbox, swipe-right the CRM (pipeline roles) — see workspaceDeck.js.
  // An unresolved mode fails closed to the buyer-safe two-panel deck.
  const deckNav = deckNeighbors("workspace", mode || "buyer");

  // Mode components listen for this to run their own primary action
  // (owner → open wizard, buyer → focus search, broker → jump to feed, provider → jump to showcase)
  const firePrimaryAction = () => {
    window.dispatchEvent(new CustomEvent("scoutit:primary-action", {
      detail: { mode, providerType: user?.providerType, role: user?.role }
    }));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const currentWorkspaceLabel = mode === "provider"
    ? (user?.providerType === "designer" ? "Event & Concept Designer" : "Spatial Photographer")
    : (mode === "broker" && user?.role === "salesperson" ? "Real Estate Salesperson" : (TAG_LABELS[mode] || "Workspace"));

  const currentWorkspacePillText = mode === "provider"
    ? (user?.providerType === "designer" ? "Designer" : "Photographer")
    : (mode === "broker" && user?.role === "salesperson" ? "Salesperson" : (TAG_LABELS[mode] ? TAG_LABELS[mode].split(" ")[0] : "Workspace"));

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
      <header className="relative z-40 sticky top-0 bg-background/90 backdrop-blur-md border-b border-surface-variant flex flex-col">
        {/* Row 1: Brand + Workspace Switcher (Left) & Connects + Notifications + Profile (Right) */}
        <div className="w-full px-4 py-2.5 md:px-6 md:py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 sm:gap-3 md:gap-5 shrink-0 min-w-0">
            <Link href="/" className="font-display-md text-xl md:text-2xl text-gold-accent tracking-tighter text-glow shrink-0">
              S<span className="text-on-surface">cout</span>IT
            </Link>
            
            {/* Custom Desktop Workspace Switcher (Desktop only — mobile uses bottom bar ROLES tab) */}
            <div className="hidden md:block relative" ref={switcherRef}>
              <button 
                className="flex items-center gap-2 bg-surface hover:bg-surface-alt border border-surface-variant text-on-surface text-sm font-working-title px-4 py-2 rounded-full uppercase tracking-wider active:scale-[0.97] transition duration-160 ease-out"
                onClick={() => setShowDesktopSwitcher(!showDesktopSwitcher)}
                aria-expanded={showDesktopSwitcher}
                aria-label="Switch Workspace"
              >
                <span className="text-gold-accent font-semibold">Workspace:</span> {currentWorkspaceLabel}
                <span className="text-[12px] ml-1">▼</span>
              </button>
              
              {showDesktopSwitcher && (
                <div className="absolute top-full left-0 mt-2 w-72 bg-surface border border-surface-variant rounded-xl shadow-2xl overflow-hidden z-50 motion-safe:animate-[fadeIn_0.2s_ease-out]">
                  <div className="px-4 py-3 border-b border-surface-variant bg-surface-alt flex items-center justify-between">
                    <span className="font-label-caps text-[12px] tracking-widest uppercase text-text-secondary">Switch Workspace</span>
                    <span className="font-mono text-xs text-gold-accent">{user.tags?.length || 1} Active</span>
                  </div>
                  <div className="flex flex-col py-2 max-h-[380px] overflow-y-auto">
                    {WORKSPACE_ROLE_OPTIONS.filter((opt) => isRoleUnlocked(opt)).map((opt) => {
                      const active = isRoleActive(opt);
                      const Icon = opt.icon;
                      return (
                        <button
                          key={opt.id}
                          className={`text-left px-4 py-2.5 flex items-center justify-between gap-3 active:scale-[0.98] transition duration-150 ease-out hover:bg-surface-alt ${
                            active ? "text-gold-accent bg-gold-accent/10 border-l-2 border-gold-accent" : "text-on-surface border-l-2 border-transparent"
                          }`}
                          onClick={() => handleSwitchMode(opt.id)}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <Icon size={16} className={active ? "text-gold-accent shrink-0" : "text-text-muted shrink-0"} />
                            <span className="font-working-title text-sm truncate">{opt.label}</span>
                          </div>
                          {active ? (
                            <span className="shrink-0 whitespace-nowrap font-mono text-xs font-bold uppercase tracking-wider text-background bg-gold-accent px-2 py-0.5 rounded shadow-[0_0_8px_rgba(var(--accent-rgb),0.4)]">
                              CURRENT ●
                            </span>
                          ) : (
                            <span className="shrink-0 whitespace-nowrap font-mono text-xs font-semibold uppercase tracking-wider text-gold-accent px-1.5 py-0.5 rounded border border-gold-accent/30 bg-gold-accent/10 hover:bg-gold-accent hover:text-black transition">
                              SWITCH ↗
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  {/* Quick Role Utilities */}
                  <div className="border-t border-surface-variant px-4 py-2 bg-surface-alt/40 flex items-center justify-between gap-2">
                    <Link
                      href="/dashboard/open-gate"
                      onClick={() => setShowDesktopSwitcher(false)}
                      className="font-mono text-xs uppercase tracking-wider text-text-secondary hover:text-gold-accent transition"
                    >
                      Open Gate ↗
                    </Link>
                    <Link
                      href="/dashboard/crm"
                      onClick={() => setShowDesktopSwitcher(false)}
                      className="font-mono text-xs uppercase tracking-wider text-text-secondary hover:text-gold-accent transition"
                    >
                      Master CRM ↗
                    </Link>
                  </div>
                  {missingLenses(user.tags).length > 0 && (
                    <div className="border-t border-surface-variant px-4 py-2.5 bg-surface-alt/60">
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

          {/* Unified Right Cluster: Connects, Notifications, Profile (Stable on all roles!) */}
          <div className="flex items-center gap-2 sm:gap-3 md:gap-4 shrink-0">
          {/* Connects Wallet Pill */}
          <div className="relative">
            <button
              className="flex items-center gap-1.5 text-gold-accent font-label-caps text-[12px] tracking-widest bg-gold-accent/10 hover:bg-gold-accent/20 px-2.5 py-1.5 sm:px-3 rounded-full active:scale-[0.97] transition duration-150 ease-out border border-gold-accent/25"
              title="View your Connects breakdown"
              onClick={() => setShowConnectsBreakdown((v) => !v)}
              aria-label="View Connects Breakdown"
            >
              <span className="text-xs">◈</span>
              <span className="font-mono font-semibold">{connects !== undefined ? connects : user.connects_balance}</span>
              <span className="hidden sm:inline font-mono">CONNECTS</span>
            </button>
            <ConnectsBreakdown
              open={showConnectsBreakdown}
              onClose={() => setShowConnectsBreakdown(false)}
              mode={mode}
              providerType={user.providerType}
              tier={user.subscription_tier || user.tier}
            />
          </div>

          {/* Notifications Bell */}
          <div className="relative" ref={notificationsRef}>
            <button
              className="relative w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center rounded-full hover:bg-surface-variant/40 text-text-secondary hover:text-gold-accent transition-colors"
              onClick={toggleNotifications}
              aria-label="Notifications"
            >
              <Bell size={19} className={unreadCount > 0 ? "text-gold-bright animate-pulse" : "text-text-secondary hover:text-gold-accent"} />
              {unreadCount > 0 && (
                <span className="absolute top-1 sm:top-1.5 right-1 sm:right-1.5 min-w-[18px] h-[18px] px-0.5 bg-gold-accent text-background font-mono font-bold rounded-full border border-background flex items-center justify-center text-xs leading-none">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-[340px] max-w-[calc(100vw-1.5rem)] bg-surface border border-surface-variant rounded-xl shadow-2xl overflow-hidden z-50 motion-safe:animate-[fadeIn_0.15s_ease-out]">
                <div className="p-3.5 border-b border-surface-variant bg-surface-alt flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[12px] tracking-widest uppercase text-text-secondary font-semibold">Notifications</span>
                    {unreadCount > 0 && (
                      <span className="bg-gold-accent/15 text-gold-bright font-mono text-[12px] px-1.5 py-0.5 rounded border border-gold-accent/30 font-bold">
                        {unreadCount} NEW
                      </span>
                    )}
                  </div>
                  {notifications.length > 0 && (
                    <button
                      type="button"
                      className="min-h-[44px] px-2 font-mono text-[12px] uppercase tracking-wider text-gold-accent hover:text-gold-bright transition-colors"
                      onClick={clearAllNotifications}
                    >
                      Clear All
                    </button>
                  )}
                </div>
                <div className="max-h-[360px] overflow-y-auto divide-y divide-surface-variant/40">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center text-sm text-text-secondary italic">
                      All caught up. No pending notifications.
                    </div>
                  ) : (
                    notifications.map((notif) => {
                      const dest = notif.link || (notif.propertyId ? `/dashboard/inventory/${notif.propertyId}` : "/dashboard/inbox");
                      return (
                        <button
                          type="button"
                          key={notif.id}
                          onClick={() => {
                            router.push(dest);
                            setShowNotifications(false);
                          }}
                          className={`p-3.5 flex items-start gap-3 transition-colors text-left w-full group hover:bg-surface-variant/40 active:scale-[0.99] ${
                            !notif.read ? "bg-gold-accent/5 border-l-2 border-l-gold-accent" : "border-l-2 border-l-transparent"
                          }`}
                        >
                          <div className="text-xl shrink-0 mt-0.5 w-8 h-8 rounded-lg bg-surface-alt border border-surface-variant flex items-center justify-center">
                            {notif.icon || <Bell size={16} className="text-gold-accent" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1 mb-0.5">
                              <div className="font-working-title text-sm font-semibold text-on-surface truncate group-hover:text-gold-bright transition-colors">
                                {notif.title}
                              </div>
                              <span className="text-[12px] font-mono text-text-muted shrink-0">
                                {notif.createdAt ? new Date(notif.createdAt).toLocaleDateString([], { month: "short", day: "numeric" }) : ""}
                              </span>
                            </div>
                            <div className="text-xs text-text-secondary line-clamp-2 leading-relaxed">
                              {notif.desc}
                            </div>
                            <div className="mt-1 flex items-center gap-1 text-[12px] font-mono uppercase tracking-wider text-gold-accent group-hover:text-gold-bright transition-colors">
                              <span>Open</span>
                              <ChevronRight size={12} className="transition-transform group-hover:translate-x-0.5" />
                            </div>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Desktop User Menu (Hidden on mobile) */}
          <div className="hidden md:flex items-center gap-2">
            <Link
              href="/settings"
              title="Account Settings"
              className="w-10 h-10 flex items-center justify-center text-text-secondary hover:text-gold-accent transition-colors rounded-full hover:bg-surface-variant/40"
              aria-label="Account Settings"
            >
              <Settings size={18} />
            </Link>
            <Link
              href="/profile"
              title="Your Profile"
              className="w-8 h-8 rounded-full bg-surface-alt border border-gold-accent/30 flex items-center justify-center font-working-title text-xs font-bold text-on-surface hover:border-gold-accent transition"
            >
              {user.name ? user.name.substring(0, 2).toUpperCase() : "U"}
            </Link>
            <button
              className="w-10 h-10 flex items-center justify-center text-text-secondary hover:text-error transition-colors rounded-full hover:bg-error/10"
              onClick={handleSignOut}
              title="Sign Out"
              aria-label="Sign Out"
            >
              <LogOut size={18} />
            </button>
          </div>
          
          {/* Mobile Profile Trigger */}
          <button
            className="md:hidden w-8 h-8 rounded-full bg-surface-alt border border-gold-accent/30 flex items-center justify-center font-working-title text-xs font-bold text-on-surface hover:border-gold-accent transition shrink-0"
            onClick={() => setShowMobileProfileMenu(true)}
            title="Open Mobile Menu"
            aria-label="Open menu"
          >
            {user.name ? user.name.substring(0, 2).toUpperCase() : "U"}
          </button>
        </div>
      </div>

      {/* Row 2: Mobile Workspace Deck Command Bar (Android-style glowing capacitive pull-down drawer) */}
      <div className="md:hidden w-full px-3 pb-1 pt-0.5 border-t border-surface-variant/40">
        <WorkspaceDeckDrawer active="workspace" badges={{ inbox: unreadInboxCount }} isWizardActive={isWizardActive} />
      </div>
    </header>

      {/* Main Content Area (Mode determined) */}
      <DeckPanel leftHref={deckNav.leftHref} rightHref={deckNav.rightHref}>
      <main className="relative z-10 flex-1 w-full max-w-7xl mx-auto px-4 py-6 md:p-6">
        {/* Urgent Cross-Workspace Attention Signal: hidden when nominal to prevent duplicating top bar tabs */}
        <div className={unreadCount > 0 || unreadInboxCount > 0 ? "mb-5" : "hidden"} aria-hidden={!(unreadCount > 0 || unreadInboxCount > 0)}>
          <AttentionRail mockUserId={user.id} className="mb-4" />
        </div>

        {/* Workspace Identity Lens Indicator (Unambiguous context for multi-role users with zero interactive clutter) */}
        {!isWizardActive && (
          <div className="flex items-center justify-between gap-3 mb-5 pb-3 border-b border-surface-variant/40">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2 h-2 rounded-full bg-gold-accent shrink-0 animate-pulse" />
              <span className="font-mono text-[12px] uppercase tracking-widest text-text-secondary">
                Active Workspace:
              </span>
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-gold-bright truncate">
                {currentWorkspaceLabel}
              </span>
            </div>
            <div className="hidden sm:flex items-center gap-2 font-mono text-[12px] text-text-muted">
              <span className="uppercase">Role:</span>
              <span className="text-gold-accent font-semibold uppercase">{mode}</span>
            </div>
          </div>
        )}

        {/* Desktop Workspace Deck Command Bar (Exact operating parity with CRM, Inbox & Calendar desktop views, auto-tucked during property creation) */}
        {!isWizardActive && (
          <div className="hidden md:block mb-6 max-w-2xl">
            <WorkspaceCommandBar active="workspace" badges={{ inbox: unreadInboxCount }} />
          </div>
        )}

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
        className="md:hidden fixed right-4 z-40 bg-gold-accent text-background w-14 h-14 rounded-full flex flex-col items-center justify-center shadow-[0_8px_24px_rgba(var(--accent-rgb),0.4)] hover:opacity-90 transition-[transform,opacity,bottom] duration-300 ease-out active:scale-[0.94] touch-manipulation border-2 border-surface-alt"
        style={{
          bottom: isBottomNavExpanded
            ? "calc(var(--mobile-nav-height, 82px) + 56px)"
            : "max(32px, calc(24px + env(safe-area-inset-bottom)))",
        }}
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
            
            {/* Mobile Account Navigation */}
            <div className="space-y-2.5 mb-4">
              <Link
                href="/settings"
                onClick={() => setShowMobileProfileMenu(false)}
                className="flex items-center justify-between p-3.5 rounded-xl border border-surface-variant bg-surface hover:border-gold-accent/40 active:scale-[0.99] transition duration-150 min-h-[48px]"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-surface-alt border border-surface-variant flex items-center justify-center text-gold-accent">
                    <Settings size={16} />
                  </div>
                  <div className="text-left">
                    <div className="font-working-title text-sm text-text-primary font-semibold">Account Settings</div>
                    <div className="text-xs text-text-muted mt-0.5">Preferences, password and verification</div>
                  </div>
                </div>
                <ChevronRight size={16} className="text-text-muted" />
              </Link>

              <Link
                href="/settings#account"
                onClick={() => setShowMobileProfileMenu(false)}
                className="flex items-center justify-between p-3.5 rounded-xl border border-surface-variant bg-surface hover:border-gold-accent/40 active:scale-[0.99] transition duration-150 min-h-[48px]"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-surface-alt border border-surface-variant flex items-center justify-center text-gold-accent">
                    <ShieldCheck size={16} />
                  </div>
                  <div className="text-left">
                    <div className="font-working-title text-sm text-text-primary font-semibold">Manage Roles &amp; Entitlements</div>
                    <div className="text-xs text-text-muted mt-0.5">Unlock or upgrade role tiers in Settings</div>
                  </div>
                </div>
                <ChevronRight size={16} className="text-text-muted" />
              </Link>

              {/* Roles guidance note */}
              <div className="px-3 py-2.5 rounded-lg bg-surface-alt/40 border border-surface-variant/50 flex items-center justify-between">
                <span className="font-mono text-xs uppercase tracking-wider text-text-muted">Switch Workspace</span>
                <span className="font-mono text-xs uppercase tracking-wider text-gold-accent font-semibold">Tap &apos;ROLES&apos; in bottom bar ↓</span>
              </div>
            </div>

            <div className="border-t border-surface-variant pt-4 pb-3">
              <div className="mb-2">
                <span className="font-label-caps text-[12px] tracking-widest uppercase text-text-secondary">Forecast &amp; Ambient</span>
              </div>
              <DashboardAmbientStrip user={user} />
            </div>

            <div className="border-t border-surface-variant pt-4">
              <Link href="/settings" className="flex items-center gap-3 text-text-secondary hover:text-on-surface font-working-title text-sm py-2">
                <Settings size={16} className="text-gold-accent" /> Account Settings
              </Link>
              <button
                className="flex items-center gap-3 text-text-secondary hover:text-error font-working-title text-sm py-2 w-full text-left"
                onClick={handleSignOut}
              >
                <LogOut size={16} className="text-error" /> Sign Out
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
