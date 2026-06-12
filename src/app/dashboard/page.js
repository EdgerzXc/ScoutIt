"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "./page.module.css";
import dynamic from "next/dynamic";

// Lazy-loaded mode components (to be built in subsequent phases)
// Using dummy components inline for now so it compiles, we'll extract them later.
const OwnerMode = dynamic(() => import("../../components/dashboard/OwnerMode"), { ssr: false });
const BrokerMode = dynamic(() => Promise.resolve(() => <div className="placeholder-mode"><h2>Broker Workspace</h2><p>Pipeline, Feed, Action Bar coming in Phase 4.</p></div>), { ssr: false });
const BuyerMode = dynamic(() => Promise.resolve(() => <div className="placeholder-mode"><h2>Buyer / Scout Dashboard</h2><p>Search, Map, Saved listings coming in Phase 5.</p></div>), { ssr: false });
const ProviderMode = dynamic(() => Promise.resolve(({ type }) => <div className="placeholder-mode"><h2>{type || "Provider"} Dashboard</h2><p>Early Access state & Portfolio coming in Phase 6.</p></div>), { ssr: false });

const TAG_LABELS = {
  buyer: "Buyer / Scout",
  owner: "Owner",
  broker: "Broker",
  provider: "Service Provider",
  exploring: "Exploring"
};

export default function UnifiedDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [mode, setMode] = useState("");

  useEffect(() => {
    // Read mock auth from LocalStorage
    const saved = localStorage.getItem("scoutit_user");
    if (!saved) {
      router.push("/onboarding");
      return;
    }
    try {
      const parsed = JSON.parse(saved);
      setUser(parsed);
      setMode(parsed.primaryMode || parsed.tags[0]);
    } catch (e) {
      router.push("/onboarding");
    }
  }, [router]);

  if (!user) return <div className={styles.shell} style={{justifyContent: 'center', alignItems: 'center'}}>Loading memory...</div>;

  const switchMode = (e) => {
    const newMode = e.target.value;
    setMode(newMode);
    
    // Optimistically update the primaryMode setting in localStorage (so it sticks next login)
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

  const getPrimaryActionIcon = () => {
    switch (mode) {
      case "owner": return "+"; // List Property
      case "broker": return "⚡"; // Pitch
      case "buyer": 
      case "exploring": return "🔍"; // Search
      case "provider": return "🖼️"; // Portfolio
      default: return "●";
    }
  };

  return (
    <div className={styles.shell}>
      {/* Top Nav (Persistent) */}
      <header className={styles.topNav}>
        <div className={styles.navLeft}>
          <Link href="/" className={styles.logo}>Scout<span>IT</span></Link>
          
          <div className={styles.modeSwitcher}>
            <select className={styles.modeSelect} value={mode} onChange={switchMode}>
              {user.tags.map(tagId => (
                <option key={tagId} value={tagId}>
                  MODE: {TAG_LABELS[tagId]}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className={styles.navRight}>
          <div className={styles.connectsBalance}>
            <span className="icon">◈</span>
            <span>{user.connects_balance} CONNECTS</span>
          </div>
          <button className={styles.iconBtn}>🔔</button>
          <div className={styles.avatar}>
            {user.name.substring(0,2).toUpperCase()}
          </div>
        </div>
      </header>

      {/* Main Content Area (Mode determined) */}
      <main className={styles.mainContent}>
        {renderActiveMode()}
      </main>

      {/* Mobile Bottom Tab Bar */}
      <nav className={styles.bottomTabBar}>
        <button className={`${styles.tabBtn} ${styles.active}`}>
          <span className={styles.tabIcon}>🏠</span>
          <span className={styles.tabLabel}>Home</span>
        </button>
        <button className={styles.tabBtn}>
          <span className={styles.tabIcon}>🔍</span>
          <span className={styles.tabLabel}>Search</span>
        </button>
        <button className={styles.tabBtn} style={{ position: 'relative' }}>
          <div className={styles.primaryActionTab}>
            {getPrimaryActionIcon()}
          </div>
        </button>
        <button className={styles.tabBtn}>
          <span className={styles.tabIcon}>🔖</span>
          <span className={styles.tabLabel}>Saved</span>
        </button>
        <button className={styles.tabBtn}>
          <span className={styles.tabIcon}>👤</span>
          <span className={styles.tabLabel}>Profile</span>
        </button>
      </nav>

      <style jsx global>{`
        .placeholder-mode {
          background: var(--surface);
          border: 1px dashed var(--border-solid);
          border-radius: 8px;
          padding: 64px 32px;
          text-align: center;
          animation: fadeIn 0.4s ease;
        }
        .placeholder-mode h2 {
          font-family: var(--font-display);
          font-size: 28px;
          margin-bottom: 12px;
          font-weight: 400;
        }
        .placeholder-mode p {
          color: var(--text-secondary);
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
