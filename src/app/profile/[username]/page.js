"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import styles from "./page.module.css";

const ALL_BADGES = [
  { id: 'pioneer', name: 'Pioneer', icon: '🏛️', desc: 'Joined during the Alpha phase.', locked: false },
  { id: 'verified', name: 'Verified', icon: '✅', desc: 'Identity successfully verified.', locked: false },
  { id: 'top_broker', name: 'Top 10', icon: '👑', desc: 'Top 10% response rate this month.', locked: true },
  { id: 'shark', name: 'Shark', icon: '🦈', desc: 'Closed 5 deals via ScoutIt.', locked: true },
  { id: 'curator', name: 'Curator', icon: '🖼️', desc: 'Saved 100+ listings.', locked: true }
];

export default function ProfilePage() {
  const params = useParams();
  const username = params.username;
  const [showCeremony, setShowCeremony] = useState(false);
  const [ceremonyBadge, setCeremonyBadge] = useState(null);

  // In a real app, we fetch the user's unlocked badges from DB.
  // We'll mock a "first-badge" unlock for demonstration.
  useEffect(() => {
    const hasSeenCeremony = localStorage.getItem('seen_ceremony');
    if (!hasSeenCeremony) {
      setTimeout(() => {
        setCeremonyBadge(ALL_BADGES[0]); // Pioneer
        setShowCeremony(true);
      }, 1000);
    }
  }, []);

  const closeCeremony = () => {
    setShowCeremony(false);
    localStorage.setItem('seen_ceremony', 'true');
  };

  const handleBadgeClick = (badge) => {
    // Only replay ceremony for unlocked badges for fun
    if (!badge.locked) {
      setCeremonyBadge(badge);
      setShowCeremony(true);
    }
  };

  return (
    <div className={styles.profileContainer}>
      
      {/* Ceremony Overlay */}
      {showCeremony && ceremonyBadge && (
        <div className={styles.ceremonyOverlay}>
          <div className={styles.ceremonyContent}>
            <div className={styles.ceremonyIcon}>{ceremonyBadge.icon}</div>
            <h2 className={styles.ceremonyTitle}>{ceremonyBadge.name} Badge Unlocked</h2>
            <p className={styles.ceremonyDesc}>{ceremonyBadge.desc}</p>
            <button className={styles.ceremonyBtn} onClick={closeCeremony}>
              Claim Badge
            </button>
          </div>
        </div>
      )}

      {/* Top Nav */}
      <header className={styles.topNav}>
        <Link href="/dashboard" className={styles.backBtn}>← Back to Dashboard</Link>
      </header>

      <main className={styles.content}>
        
        {/* Identity Section */}
        <section className={styles.identitySection}>
          <div className={styles.avatar}>{username.charAt(0).toUpperCase()}</div>
          <div className={styles.info}>
            <h1>{username}</h1>
            <div className={styles.tags}>
              <span className={styles.tag}>Broker</span>
              <span className={styles.tag}>Owner</span>
              <span className={styles.tag}>Metro Manila</span>
            </div>
          </div>
        </section>

        {/* Badge Wall */}
        <section>
          <h2 className={styles.sectionTitle}>Trophy Wall</h2>
          <div className={styles.badgeGrid}>
            {ALL_BADGES.map(badge => (
              <div 
                key={badge.id} 
                className={`${styles.badgeCard} ${badge.locked ? styles.locked : ''}`}
                onClick={() => handleBadgeClick(badge)}
              >
                <div className={styles.badgeIcon}>{badge.locked ? '🔒' : badge.icon}</div>
                <div className={styles.badgeName}>{badge.locked ? 'Locked' : badge.name}</div>
              </div>
            ))}
          </div>
        </section>

      </main>

    </div>
  );
}
