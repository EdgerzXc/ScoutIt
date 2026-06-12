"use client";

import { useState } from "react";
import styles from "./ProviderMode.module.css";

const MOCK_INQUIRIES = [
  { id: 1, client: "Julian de Ayala", loc: "Dasmariñas Village", budget: "₱15,000", type: "Shoot" },
  { id: 2, client: "Maria Clara", loc: "BGC High Street", budget: "₱8,000", type: "Floorplan" }
];

export default function ProviderMode({ type }) {
  // Toggle this to test both states. In reality, this comes from User.tags or a specific 'is_verified' flag.
  const [isUnlocked, setIsUnlocked] = useState(false);
  
  const providerLabel = type ? type.charAt(0).toUpperCase() + type.slice(1) : "Provider";

  if (!isUnlocked) {
    return (
      <div className={styles.dashboardContainer}>
        <div className={styles.lockedHero}>
          <div className={styles.glow}></div>
          <span className={styles.badge}>Pioneer Access</span>
          <h1 className={styles.heroTitle}>The gates are closed.</h1>
          <p className={styles.heroDesc}>
            We are currently onboarding top-tier {providerLabel}s before opening the marketplace. Build your portfolio now to get priority placement when we launch.
          </p>

          <div className={styles.counterBox}>
            <span className={styles.counterNum}>142</span>
            <span className={styles.counterLabel}>Live Opportunities Waiting</span>
          </div>

          <div className={styles.actionRow}>
            <button className={styles.buttonPrimary} onClick={() => setIsUnlocked(true)}>
              Build Portfolio
            </button>
            <button className={styles.buttonSecondary}>
              Notify Me
            </button>
          </div>
        </div>
        
        {/* Toggle just for testing the UI */}
        <button onClick={() => setIsUnlocked(true)} style={{opacity: 0.1, position: 'absolute', bottom: 0}}>Simulate Unlock</button>
      </div>
    );
  }

  return (
    <div className={styles.dashboardContainer}>
      <div className={styles.unlockedHeader}>
        <div>
          <h1 className={styles.headerTitle}>{providerLabel} Workspace</h1>
          <p className={styles.headerMeta}>Your portfolio is 100% complete and visible to Brokers & Owners.</p>
        </div>
        <button className={styles.buttonSecondary} onClick={() => setIsUnlocked(false)}>Lock View (Test)</button>
      </div>

      <div className={styles.grid}>
        
        {/* Inquiry Inbox */}
        <div className={styles.section}>
          <span className={styles.sectionTitle}>Inquiry Inbox</span>
          
          {MOCK_INQUIRIES.map(inq => (
            <div key={inq.id} className={styles.inquiryCard}>
              <div className={styles.inqHeader}>
                <div>
                  <div className={styles.inqClient}>{inq.client}</div>
                  <div className={styles.inqLoc}>{inq.loc} • {inq.type}</div>
                </div>
                <div className={styles.inqBudget}>{inq.budget}</div>
              </div>
              <div className={styles.inqActions}>
                <button className={styles.buttonPrimary} style={{flex: 1, padding: '10px'}}>Accept</button>
                <button className={styles.buttonSecondary} style={{flex: 1, padding: '10px'}}>Decline</button>
              </div>
            </div>
          ))}
        </div>

        {/* Portfolio Manager */}
        <div className={styles.section}>
          <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: 24}}>
            <span className={styles.sectionTitle} style={{marginBottom: 0}}>Portfolio</span>
            <span style={{fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)'}}>4 ITEMS</span>
          </div>
          
          <div className={styles.portGrid}>
            <div className={styles.portItem}>📸</div>
            <div className={styles.portItem}>📐</div>
            <div className={styles.portItem}>🏢</div>
            <div className={styles.portItem}>🌇</div>
            <div className={`${styles.portItem} ${styles.portAdd}`}>+</div>
          </div>
        </div>

      </div>
    </div>
  );
}
