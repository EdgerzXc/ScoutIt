"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
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
import ConciergeAI from "../../components/dashboard/ConciergeAI";
import ConnectsBreakdown from "../../components/dashboard/ConnectsBreakdown";
import AtmosphereBackground from "../../components/ui/AtmosphereBackground";
import { getSession, getUser, signOut } from "../../lib/authClient";
import { normalizeDashboardMode, normalizeDashboardModes } from "../../lib/dashboardModes";
import { readDevelopmentMockUser } from "../../lib/developmentMock";
import { Search, Bookmark, MessageCircle, Briefcase } from "lucide-react";

const TAG_LABELS = {
  buyer: "Buyer Workspace",
  owner: "Owner Workspace",
  broker: "Broker Workspace",
  provider: "Provider Workspace",
  operator: "Operator Workspace",
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
      parsed.primaryMode = normalizeDashboardMode(parsed.primaryMode) || parsed.tags[0];
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
    const primaryMode = normalizeDashboardMode(currentUser.primary_mode) || tags[0];
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
        const qs = mockOwnerId ? `?mockOwnerId=${mockOwnerId}` : "";
        const res = await fetch(`/api/deals${qs}`, {
          headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {},
        });
        if (!res.ok || cancelled) return;
        const data = await res.json();
        const total = (data.deals || []).reduce((sum, d) => sum + (d.unreadCount || 0), 0);
        if (!cancelled) setUnreadInboxCount(total);
      } catch {
        // Inbox badge is a nice-to-have -- fail quietly, the bell still covers signaling.
      }
    })();
    return () => { cancelled = true; };
  }, [user]);

  useEffect(() => {
    const handleOpenMobileMenu = () => {
      setShowMobileProfileMenu(true);
    };
    window.addEventListener("scoutit:open-mobile-menu", handleOpenMobileMenu);
    return () => window.removeEventListener("scoutit:open-mobile-menu", handleOpenMobileMenu);
  }, []);

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

  if (!user) return <div className="min-h-screen bg-background flex justify-center items-center font-working-title text-text-secondary">Loading your dashboard…</div>;

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
      default: return <div>Unknown Mode</div>;
    }
  };

  const PRIMARY_ACTIONS = {
    owner: { icon: "+", label: "List" },
    broker: { icon: "⚡", label: "Pitch" },
    buyer: { icon: <Search strokeWidth={1.5} size="1em" />, label: "Scout" },
    exploring: { icon: <Search strokeWidth={1.5} size="1em" />, label: "Scout" },
    provider: { icon: "🖼️", label: "Portfolio" },
  };
  const primaryAction = PRIMARY_ACTIONS[mode] || { icon: "●", label: "" };

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
      {/* Broker gets the "Tactical Velocity" ambient layer (signal pulses +
          light streaks); every other role keeps the base dashboard glow. */}
      <AtmosphereBackground variant={mode === "broker" ? "broker" : "dashboard"} />

      {/* Top Nav (Persistent) */}
      <header className="relative z-40 sticky top-0 bg-background/90 backdrop-blur-md border-b border-surface-variant px-4 py-3 md:px-6 md:py-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
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
              <div className="absolute top-full left-0 mt-2 w-64 bg-surface border border-surface-variant rounded-lg shadow-2xl overflow-hidden z-50 animate-[fadeIn_0.2s_ease-out]">
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

              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4 md:gap-6">
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
            <Link href={`/profile/${encodeURIComponent(user.name)}`} title="View Public Profile" className="w-8 h-8 rounded-full bg-surface-variant border border-surface-variant flex items-center justify-center font-working-title text-sm font-bold text-on-surface hover:border-gold-accent transition">
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
      </header>

      {/* Main Content Area (Mode determined) */}
      <main className="relative z-10 flex-1 w-full max-w-7xl mx-auto px-4 py-6 md:p-6">
        <Nudge mode={mode} />
        {renderActiveMode()}
      </main>

      <Toasts />
      <ConciergeAI />

      {/* Primary Action FAB (Floating above global BottomNav) */}
      <button
        className="md:hidden fixed bottom-24 right-4 z-40 bg-gold-accent text-background w-14 h-14 rounded-full flex flex-col items-center justify-center shadow-[0_8px_24px_rgba(232,174,60,0.4)] hover:opacity-90 transition border-2 border-surface-alt"
        onClick={firePrimaryAction}
        aria-label={primaryAction.label}
      >
        <span className="text-xl leading-none font-bold">{primaryAction.icon}</span>
        {primaryAction.label && <span className="text-[12px] font-working-title font-bold mt-0.5 tracking-tighter uppercase leading-none">{primaryAction.label}</span>}
      </button>

      {/* Mobile Profile Menu Slide-out */}
      {showMobileProfileMenu && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end animate-[fadeIn_0.3s_ease-out]">
          <button type="button" aria-label="Close Mobile Profile Menu" className="absolute inset-0 w-full h-full block bg-background/60 backdrop-blur-sm" onClick={() => setShowMobileProfileMenu(false)}></button>
          <div className="bg-surface border-t border-surface-variant rounded-t-2xl w-full p-6 animate-[slideUp_0.3s_ease-out] relative z-10">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-surface-alt border border-surface-variant flex items-center justify-center font-bold text-on-surface">
                  {user.name ? user.name.substring(0,2).toUpperCase() : 'U'}
                </div>
                <div>
                  <h3 className="font-working-title text-on-surface">{user.name}</h3>
                  <Link href={`/profile/${encodeURIComponent(user.name)}`} className="text-xs text-gold-accent hover:underline">View Public Profile</Link>
                </div>
              </div>
              <button className="text-text-secondary" aria-label="Close" onClick={() => setShowMobileProfileMenu(false)}>✕</button>
            </div>
            
            {user.tags.length > 1 && (
            <div className="mb-2">
              <span className="font-label-caps text-[12px] tracking-widest uppercase text-text-secondary">Switch Workspace</span>
            </div>
            )}
            <div className="flex flex-col gap-2 mb-4">
              {user.tags.length > 1 && user.tags.map(tagId => (
                <button
                  key={tagId}
                  className={`flex items-center justify-between p-4 rounded-lg font-working-title text-sm border transition ${mode === tagId ? 'bg-surface-container-low border-gold-accent text-gold-accent' : 'bg-surface border-surface-variant text-on-surface hover:border-text-secondary'}`}
                  onClick={() => handleSwitchMode(tagId)}
                >
                  <span className="uppercase tracking-wider">{TAG_LABELS[tagId]}</span>
                  {mode === tagId && <span>✓</span>}
                </button>
              ))}
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
      <DashboardInner />
    </DashboardProvider>
  );
}
