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
import Nudge from "../../components/ui/Nudge";

const TAG_LABELS = {
  buyer: "Buyer / Scout",
  owner: "Owner",
  broker: "Broker",
  provider: "Service Provider",
  exploring: "Exploring"
};

function DashboardInner() {
  const router = useRouter();
  const { connects, currentUser, notifications, markNotificationsRead, clearAllNotifications } = useDashboard();
  const [user, setUser] = useState(null);
  const [mode, setMode] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  const [showDesktopSwitcher, setShowDesktopSwitcher] = useState(false);
  const [showMobileProfileMenu, setShowMobileProfileMenu] = useState(false);

  const switcherRef = useRef(null);

  useEffect(() => {
    // Read mock auth from LocalStorage
    const saved = localStorage.getItem("scoutit_user");
    if (!saved) {
      router.push("/onboarding");
      return;
    }
    try {
      const parsed = JSON.parse(saved);
      if (!parsed.tags || parsed.tags.length === 0) {
        parsed.tags = ["exploring"];
      }
      setUser(parsed);
      setMode(parsed.primaryMode || parsed.tags[0]);
    } catch (e) {
      router.push("/onboarding");
    }
  }, [router]);

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
    
    // Optimistically update the primaryMode setting in localStorage
    const updatedUser = { ...user, primaryMode: newMode };
    localStorage.setItem("scoutit_user", JSON.stringify(updatedUser));
    setUser(updatedUser);
  };

  const renderActiveMode = () => {
    switch (mode) {
      case "owner": return <OwnerMode />;
      case "broker": return <BrokerMode />;
      case "buyer":
      case "exploring": return <BuyerMode />;
      case "provider": return <ProviderMode type={user.providerType} />;
      default: return <div>Unknown Mode</div>;
    }
  };

  const PRIMARY_ACTIONS = {
    owner: { icon: "+", label: "List" },
    broker: { icon: "⚡", label: "Pitch" },
    buyer: { icon: "🔍", label: "Scout" },
    exploring: { icon: "🔍", label: "Scout" },
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
    <div className="min-h-screen bg-background text-text-primary flex flex-col pb-[80px] md:pb-0">
      
      {/* Top Nav (Persistent) */}
      <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-md border-b border-surface-variant px-4 py-3 md:px-6 md:py-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="font-display-md text-xl md:text-2xl text-gold-accent tracking-tighter">Scout<span className="text-on-surface">IT</span></Link>
          
          {/* Custom Desktop Mode Switcher (only when the user has more than one capability) */}
          <div className={`${user.tags.length > 1 ? 'hidden md:block' : 'hidden'} relative`} ref={switcherRef}>
            <button 
              className="flex items-center gap-2 bg-surface hover:bg-surface-alt border border-surface-variant text-on-surface text-sm font-working-title px-4 py-2 rounded-full uppercase tracking-wider transition-colors"
              onClick={() => setShowDesktopSwitcher(!showDesktopSwitcher)}
            >
              <span className="text-gold-accent">Mode:</span> {TAG_LABELS[mode]}
              <span className="text-[10px] ml-1">▼</span>
            </button>
            
            {showDesktopSwitcher && (
              <div className="absolute top-full left-0 mt-2 w-56 bg-surface border border-surface-variant rounded-lg shadow-2xl overflow-hidden z-50 animate-[fadeIn_0.2s_ease-out]">
                <div className="px-4 py-3 border-b border-surface-variant bg-surface-alt">
                  <span className="font-label-caps text-[10px] tracking-widest uppercase text-text-secondary">Switch Capability</span>
                </div>
                <div className="flex flex-col py-2">
                  {user.tags.map(tagId => (
                    <button 
                      key={tagId} 
                      className={`text-left px-4 py-3 font-working-title text-sm transition-colors hover:bg-surface-container ${mode === tagId ? 'text-gold-accent bg-surface-container-low border-l-2 border-gold-accent' : 'text-on-surface border-l-2 border-transparent'}`}
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
          <div className="hidden md:flex items-center gap-2 text-gold-accent font-label-caps text-[11px] tracking-widest bg-gold-accent/10 px-3 py-1.5 rounded-full transition-all">
            <span className="icon">◈</span>
            <span>{connects !== undefined ? connects : user.connects_balance} CONNECTS</span>
          </div>
          
          <div className="relative">
            <button 
              className="text-xl hover:opacity-80 transition-opacity relative mt-1"
              onClick={toggleNotifications}
            >
              🔔
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-error rounded-full border-2 border-background flex items-center justify-center text-[8px] font-bold text-white">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] bg-surface border border-surface-variant rounded-lg shadow-2xl overflow-hidden z-50">
                <div className="p-3 border-b border-surface-variant bg-surface-alt flex justify-between items-center">
                  <span className="font-label-caps text-[10px] tracking-widest uppercase text-text-secondary">Notifications</span>
                  {notifications.length > 0 && (
                    <span className="text-xs text-gold-accent cursor-pointer hover:underline" onClick={clearAllNotifications}>Clear All</span>
                  )}
                </div>
                <div className="max-h-[300px] overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-sm text-text-secondary italic">All caught up.</div>
                  ) : (
                    notifications.map(notif => (
                      <div key={notif.id} className={`p-4 border-b border-surface-variant/50 flex gap-3 ${!notif.read ? 'bg-surface-container-low' : ''}`}>
                        <div className="text-2xl shrink-0">{notif.icon}</div>
                        <div>
                          <div className="font-working-title text-sm text-on-surface mb-1">{notif.title}</div>
                          <div className="text-xs text-text-secondary">{notif.desc}</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Desktop User Menu (Hidden on mobile) */}
          <div className="hidden md:flex items-center gap-3">
            <Link href={`/profile/${encodeURIComponent(user.name)}`} className="w-8 h-8 rounded-full bg-surface-variant border border-surface-variant flex items-center justify-center font-working-title text-sm font-bold text-on-surface hover:border-gold-accent transition-colors">
              {user.name ? user.name.substring(0,2).toUpperCase() : 'U'}
            </Link>
          </div>
          
          {/* Mobile Connects / Secondary Top indicator */}
          <div className="md:hidden flex items-center gap-1 text-gold-accent font-label-caps text-[10px] tracking-widest">
            <span>◈</span>
            <span>{connects !== undefined ? connects : user.connects_balance}</span>
          </div>
        </div>
      </header>

      {/* Main Content Area (Mode determined) */}
      <main className="flex-1 w-full max-w-7xl mx-auto md:p-6 p-0 relative">
        <Nudge mode={mode} />
        {renderActiveMode()}
      </main>

      {/* Mobile Bottom Tab Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-surface/95 backdrop-blur-md border-t border-surface-variant px-6 py-2 flex justify-between items-center z-40">
        <button className="flex flex-col items-center gap-1 text-gold-accent" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
          <span className="text-xl">🏠</span>
          <span className="text-[10px] font-working-title font-bold">Home</span>
        </button>
        <Link href="/discover" className="flex flex-col items-center gap-1 text-text-secondary hover:text-on-surface transition-colors">
          <span className="text-xl">🔍</span>
          <span className="text-[10px] font-working-title">Search</span>
        </Link>
        <button
          className="relative -top-4 flex flex-col items-center"
          onClick={firePrimaryAction}
          aria-label={primaryAction.label}
        >
          <span className="bg-gold-accent text-background w-14 h-14 rounded-full flex items-center justify-center text-2xl shadow-lg hover:opacity-90 transition-opacity border-4 border-background">
            {primaryAction.icon}
          </span>
          <span className="text-[10px] font-working-title text-gold-accent font-bold mt-0.5">{primaryAction.label}</span>
        </button>
        <Link href="/wishlist" className="flex flex-col items-center gap-1 text-text-secondary hover:text-on-surface transition-colors">
          <span className="text-xl">🔖</span>
          <span className="text-[10px] font-working-title">Saved</span>
        </Link>
        <button 
          className="flex flex-col items-center gap-1 text-text-secondary hover:text-on-surface transition-colors relative"
          onClick={() => setShowMobileProfileMenu(true)}
        >
          <span className="text-xl">👤</span>
          <span className="text-[10px] font-working-title">Profile</span>
        </button>
      </nav>

      {/* Mobile Profile Menu Slide-out */}
      {showMobileProfileMenu && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end animate-[fadeIn_0.3s_ease-out]">
          <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" onClick={() => setShowMobileProfileMenu(false)}></div>
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
              <button className="text-text-secondary" onClick={() => setShowMobileProfileMenu(false)}>✕</button>
            </div>
            
            {user.tags.length > 1 && (
            <div className="mb-2">
              <span className="font-label-caps text-[10px] tracking-widest uppercase text-text-secondary">Switch Capability</span>
            </div>
            )}
            <div className="flex flex-col gap-2 mb-6">
              {user.tags.length > 1 && user.tags.map(tagId => (
                <button 
                  key={tagId} 
                  className={`flex items-center justify-between p-4 rounded-lg font-working-title text-sm border transition-colors ${mode === tagId ? 'bg-surface-container-low border-gold-accent text-gold-accent' : 'bg-surface border-surface-variant text-on-surface hover:border-text-secondary'}`}
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
