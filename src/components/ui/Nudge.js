"use client";

import { useState, useEffect } from "react";
import styles from "./Nudge.module.css";

// Hardcoded logic rules per Section 8
const NUDGE_CONTENT = {
  owner: {
    icon: "📈",
    title: "Boost Your Listing",
    desc: "You have 50+ views but 0 pitches. Upgrade to featured placement to reach top-tier brokers.",
    action: "Upgrade Now"
  },
  broker: {
    icon: "⚡",
    title: "Get Featured Placement",
    desc: "Your response rate is top 10%, but your rank is low. Unlock the 'Top Broker' badge.",
    action: "Unlock Badge"
  },
  buyer: {
    icon: "🕵️",
    title: "Unlock Market Intel",
    desc: "You have 10 saved listings. Unlock the full Intel Dashboard to see historical yields.",
    action: "Get Intel"
  },
  provider: {
    icon: "📸",
    title: "Expand Your Portfolio",
    desc: "You've hit the free portfolio limit. Upgrade to add unlimited media.",
    action: "Upgrade Plan"
  }
};

export default function Nudge({ mode }) {
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    // 1. Check if this specific nudge was dismissed recently (max 1 per week rule)
    const dismissedAt = localStorage.getItem(`nudge_dismissed_${mode}`);
    if (dismissedAt) {
      const daysSinceDismissal = (Date.now() - parseInt(dismissedAt)) / (1000 * 60 * 60 * 24);
      if (daysSinceDismissal < 7) {
        return; // Don't show, dismissed within the last 7 days
      }
    }

    // 2. Check "7 days since signup" rule (Mocked to true for demonstration)
    const isAccountMature = true; 
    
    // 3. Mock logic triggers (Assume all thresholds are met for the sake of UI demo)
    if (isAccountMature && NUDGE_CONTENT[mode]) {
      // Small delay to let the dashboard render first, making the slide-down animation pop
      const timer = setTimeout(() => setIsVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [mode]);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem(`nudge_dismissed_${mode}`, Date.now().toString());
  };

  if (!isVisible || !NUDGE_CONTENT[mode]) return null;

  const content = NUDGE_CONTENT[mode];

  return (
    <div className={styles.nudgeContainer}>
      <div className={styles.glow}></div>
      <div className={styles.nudgeContent}>
        <div className={styles.nudgeIcon}>{content.icon}</div>
        <div className={styles.nudgeText}>
          <h4>{content.title}</h4>
          <p>{content.desc}</p>
        </div>
      </div>
      <div className={styles.nudgeActions}>
        <button className={styles.actionBtn}>{content.action}</button>
        <button className={styles.dismissBtn} onClick={handleDismiss} title="Dismiss for 7 days">×</button>
      </div>
    </div>
  );
}
