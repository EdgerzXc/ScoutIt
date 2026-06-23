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
import Toasts from "../../components/ui/Toasts";
import ConciergeAI from "../../components/dashboard/ConciergeAI";
import { Camera, Search, Bookmark } from "lucide-react";

const TAG_LABELS = {
  buyer: "Buyer / Scout",
  owner: "Owner",
  broker: "Broker",
  provider: "Service Provider",
  exploring: "Exploring"
};

// Roles a user can activate from the Mode menu without re-onboarding
const ACTIVATABLE_MODES = [
  { id: "buyer", icon: "🏠", cta: "Scout Properties", desc: "Browse, save listings, and get market intel." },
  { id: "owner", icon: "📋", cta: "List as an Owner", desc: "List your property and receive broker pitches." },
  { id: "broker", icon: "🤝", cta: "Become a Broker", desc: "Pitch owners and manage your pipeline. PRC license required." },
  { id: "provider", icon: <Camera strokeWidth={1.5} size="1em" />, cta: "Join as a Service Provider", desc: "Photographer, researcher, or event designer." },
];

const PROVIDER_TYPES = [
  { id: "photographer", label: "Photographer" },
  { id: "researcher", label: "Site Researcher" },
  { id: "designer", label: "Event Designer" },
];

function DashboardInner() {
  const router = useRouter();
  const { connects, currentUser, notifications, markNotificationsRead, clearAllNotifications } = useDashboard();
  const [user, setUser] = useState(null);
  const [mode, setMode] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  const [showDesktopSwitcher, setShowDesktopSwitcher] = useState(false);
  const [showMobileProfileMenu, setShowMobileProfileMenu] = useState(false);
  const [activating, setActivating] = useState(null); // mode id being activated (broker/provider need extra info)
  const [activationLicense, setActivationLicense] = useState("");
  const [activationProviderType, setActivationProviderType] = useState("");

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
    
    // Optimistically update the primaryMode setting in localStorage
    const updatedUser = { ...user, primaryMode: newMode };
    localStorage.setItem("scoutit_user", JSON.stringify(updatedUser));
    setUser(updatedUser);
  };

  // Roles the user doesn't have yet ("exploring" isn't an activatable role)
  const addableModes = ACTIVATABLE_MODES.filter(m => !user.tags.includes(m.id));

  const startActivation = (modeId) => {
    setShowDesktopSwitcher(false);
    setShowMobileProfileMenu(false);
    if (modeId === "broker" || modeId === "provider") {
      setActivationLicense("");
      setActivationProviderType("");
      setActivating(modeId); // needs extra info first
    } else {
      finishActivation(modeId);
    }
  };

  const finishActivation = (modeId, extra = {}) => {
    const updatedUser = {
      ...user,
      ...extra,
      tags: [...user.tags.filter(t => t !== "exploring" || modeId === "exploring"), modeId],
      primaryMode: modeId,
    };
    localStorage.setItem("scoutit_user", JSON.stringify(updatedUser));
    setUser(updatedUser);
    setMode(modeId);
    setActivating(null);
  };

  const prcFormatOk = /(\d{5,})/.test(activationLicense);

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
    <div className="min-h-screen bg-background text-text-primary flex flex-col pb-[100px] md:pb-24">
      
      {/* Top Nav (Persistent) */}
      <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-md border-b border-surface-variant px-4 py-3 md:px-6 md:py-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="font-display-md text-xl md:text-2xl text-gold-accent tracking-tighter">Scout<span className="text-on-surface">IT</span></Link>
          
          {/* Custom Desktop Mode Switcher */}
          <div className="hidden md:block relative" ref={switcherRef}>
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

                {addableModes.length > 0 && (
                  <>
                    <div className="px-4 py-2 border-t border-surface-variant bg-surface-alt">
                      <span className="font-label-caps text-[10px] tracking-widest uppercase text-text-secondary">Unlock More</span>
                    </div>
                    <div className="flex flex-col py-2">
                      {addableModes.map(m => (
                        <button
                          key={m.id}
                          className="text-left px-4 py-3 transition-colors hover:bg-surface-container group"
                          onClick={() => startActivation(m.id)}
                        >
                          <span className="font-working-title text-sm text-gold-accent flex items-center gap-2">{m.icon} {m.cta}</span>
                          <span className="block text-xs text-text-secondary mt-0.5">{m.desc}</span>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4 md:gap-6">
          <div className="hidden md:flex items-center gap-2 text-gold-accent font-label-caps text-[11px] tracking-widest bg-gold-accent/10 px-3 py-1.5 rounded-full transition-all" title="Platform Currency">
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
            <Link href="/settings" title="Account Settings" className="text-lg text-text-secondary hover:text-on-surface transition-colors">⚙️</Link>
            <Link href={`/profile/${encodeURIComponent(user.name)}`} title="View Public Profile" className="w-8 h-8 rounded-full bg-surface-variant border border-surface-variant flex items-center justify-center font-working-title text-sm font-bold text-on-surface hover:border-gold-accent transition-colors">
              {user.name ? user.name.substring(0,2).toUpperCase() : 'U'}
            </Link>
            <button 
              className="text-lg text-text-secondary hover:text-error transition-colors ml-2"
              onClick={() => { localStorage.removeItem("scoutit_user"); router.push("/onboarding"); }}
              title="Sign Out"
            >
              🚪
            </button>
          </div>
          
          {/* Mobile Connects & Profile (Menu Trigger) */}
          <div className="md:hidden flex items-center gap-3">
            <div className="flex items-center gap-1 text-gold-accent font-label-caps text-[10px] tracking-widest">
              <span>◈</span>
              <span>{connects !== undefined ? connects : user.connects_balance}</span>
            </div>
            <button
              className="w-8 h-8 rounded-full bg-surface-alt border border-surface-variant flex items-center justify-center font-working-title text-sm font-bold text-on-surface hover:border-gold-accent transition-colors"
              onClick={() => setShowMobileProfileMenu(true)}
              title="Open Mobile Menu"
            >
              {user.name ? user.name.substring(0,2).toUpperCase() : 'U'}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area (Mode determined) */}
      <main className="flex-1 w-full max-w-7xl mx-auto md:p-6 p-0 relative">
        <Nudge mode={mode} />
        {renderActiveMode()}
      </main>

      <Toasts />
      <ConciergeAI />

      {/* Primary Action FAB (Floating above global BottomNav) */}
      <button
        className="md:hidden fixed bottom-24 right-4 z-40 bg-gold-accent text-background w-14 h-14 rounded-full flex flex-col items-center justify-center shadow-[0_8px_24px_rgba(255,184,0,0.4)] hover:opacity-90 transition-all border-2 border-surface-alt"
        onClick={firePrimaryAction}
        aria-label={primaryAction.label}
      >
        <span className="text-xl leading-none font-bold">{primaryAction.icon}</span>
        {primaryAction.label && <span className="text-[9px] font-working-title font-bold mt-0.5 tracking-tighter uppercase leading-none">{primaryAction.label}</span>}
      </button>

      {/* Role Activation Modal (broker license / provider type) */}
      {activating && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-background/90 backdrop-blur-md px-4">
          <div className="w-full max-w-md bg-surface border border-surface-variant rounded-lg shadow-2xl p-6 animate-[slideUp_0.3s_ease-out]">
            {activating === "broker" ? (
              <>
                <h3 className="font-headline-editorial text-2xl text-on-surface mb-2">Become a Broker</h3>
                <p className="text-sm text-text-secondary mb-6">Enter your PRC Real Estate Broker license number to activate Broker Mode. We check the format only — verification happens later.</p>
                <input
                  className="w-full bg-surface-alt border border-surface-variant rounded px-4 py-3 text-on-surface focus:outline-none focus:border-gold-accent transition-colors uppercase mb-2"
                  type="text"
                  placeholder="PRC-REB-XXXXXXX"
                  value={activationLicense}
                  onChange={e => setActivationLicense(e.target.value)}
                  autoFocus
                />
                {!prcFormatOk && activationLicense.length > 0 && (
                  <p className="text-error text-xs mb-2">Should contain at least 5 digits.</p>
                )}
                <div className="flex gap-3 mt-4">
                  <button className="flex-1 px-4 py-3 border border-surface-variant text-text-secondary rounded hover:text-on-surface hover:bg-surface-container transition-colors" onClick={() => setActivating(null)}>Cancel</button>
                  <button
                    className="flex-1 bg-gold-accent text-background font-working-title font-bold px-4 py-3 rounded hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={!prcFormatOk}
                    onClick={() => finishActivation("broker", { prcLicense: activationLicense })}
                  >
                    Activate Broker Mode
                  </button>
                </div>
              </>
            ) : (
              <>
                <h3 className="font-headline-editorial text-2xl text-on-surface mb-2">Join as a Service Provider</h3>
                <p className="text-sm text-text-secondary mb-6">What kind of work do you do?</p>
                <div className="flex flex-col gap-2 mb-4">
                  {PROVIDER_TYPES.map(pt => (
                    <button
                      key={pt.id}
                      className={`text-left p-4 rounded border font-working-title text-sm transition-colors ${activationProviderType === pt.id ? 'bg-surface-container-low border-gold-accent text-gold-accent' : 'bg-surface-alt border-surface-variant text-on-surface hover:border-text-secondary'}`}
                      onClick={() => setActivationProviderType(pt.id)}
                    >
                      {pt.label} {activationProviderType === pt.id && "✓"}
                    </button>
                  ))}
                </div>
                <div className="flex gap-3 mt-4">
                  <button className="flex-1 px-4 py-3 border border-surface-variant text-text-secondary rounded hover:text-on-surface hover:bg-surface-container transition-colors" onClick={() => setActivating(null)}>Cancel</button>
                  <button
                    className="flex-1 bg-gold-accent text-background font-working-title font-bold px-4 py-3 rounded hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={!activationProviderType}
                    onClick={() => finishActivation("provider", { providerType: activationProviderType })}
                  >
                    Activate Provider Mode
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

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
            <div className="flex flex-col gap-2 mb-4">
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

            {addableModes.length > 0 && (
              <>
                <div className="mb-2">
                  <span className="font-label-caps text-[10px] tracking-widest uppercase text-text-secondary">Unlock More</span>
                </div>
                <div className="flex flex-col gap-2 mb-6">
                  {addableModes.map(m => (
                    <button
                      key={m.id}
                      className="text-left p-4 rounded-lg border border-dashed border-gold-accent/40 bg-surface hover:border-gold-accent transition-colors"
                      onClick={() => startActivation(m.id)}
                    >
                      <span className="font-working-title text-sm text-gold-accent flex items-center gap-2">{m.icon} {m.cta}</span>
                      <span className="block text-xs text-text-secondary mt-0.5">{m.desc}</span>
                    </button>
                  ))}
                </div>
              </>
            )}

            <div className="border-t border-surface-variant pt-4">
              <Link href="/settings" className="flex items-center gap-3 text-text-secondary hover:text-on-surface font-working-title text-sm py-2">
                <span>⚙️</span> Account Settings
              </Link>
              <button
                className="flex items-center gap-3 text-text-secondary hover:text-error font-working-title text-sm py-2 w-full text-left"
                onClick={() => { localStorage.removeItem("scoutit_user"); router.push("/onboarding"); }}
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
