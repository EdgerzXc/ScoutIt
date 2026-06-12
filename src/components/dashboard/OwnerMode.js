"use client";

import { useState } from "react";
import styles from "./OwnerMode.module.css";
import GuidedWizard from "./GuidedWizard";

export default function OwnerMode() {
  const [hasListing, setHasListing] = useState(false);
  const [showWizard, setShowWizard] = useState(false);
  const [listingCompleteness, setListingCompleteness] = useState(0);

  // Mock data for pitches
  const [pitches, setPitches] = useState([
    { id: 1, name: "Julian de Ayala", verified: true, timeRemaining: "23h 12m" },
    { id: 2, name: "Maria Clara", verified: false, timeRemaining: "4h 05m" }
  ]);

  const handlePublish = (completenessScore) => {
    setListingCompleteness(completenessScore);
    setHasListing(true);
    setShowWizard(false);
  };

  if (showWizard) {
    return <GuidedWizard onPublish={handlePublish} onClose={() => setShowWizard(false)} />;
  }

  // Calculate SVG stroke offset for the completeness ring
  const ringRadius = 36;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const strokeDashoffset = ringCircumference - (listingCompleteness / 100) * ringCircumference;

  return (
    <div className={styles.dashboardContainer}>
      
      {/* 1. STATUS CARD */}
      {!hasListing ? (
        <div className={`${styles.statusCard} ${styles.statusCardEmpty}`}>
          <h3>List your property</h3>
          <p>Takes 10 minutes. Zero friction.</p>
          <button className={styles.buttonPrimary} onClick={() => setShowWizard(true)}>
            Start Listing Wizard
          </button>
        </div>
      ) : (
        <div className={styles.statusCard}>
          <div className={styles.statusInfo}>
            <h3>Your Asset Profile</h3>
            <p>Listings above 80% rank higher in broker feeds.</p>
          </div>
          
          <div style={{display: 'flex', gap: '32px', alignItems: 'center'}}>
            <div className={styles.progressRingContainer}>
              <svg className={styles.progressRing} width="80" height="80">
                <circle className={styles.progressRingCircleBg} cx="40" cy="40" r={ringRadius} />
                <circle 
                  className={styles.progressRingCircle} 
                  cx="40" 
                  cy="40" 
                  r={ringRadius} 
                  style={{ strokeDasharray: ringCircumference, strokeDashoffset: strokeDashoffset }}
                />
              </svg>
              <div className={styles.progressText}>{listingCompleteness}%</div>
            </div>
            
            <button className={styles.buttonSecondary} onClick={() => setShowWizard(true)}>
              Edit Profile
            </button>
          </div>
        </div>
      )}

      {/* 2 & 3. INBOX AND PERFORMANCE GRID */}
      <div className={styles.gridRow}>
        <div className={styles.inboxSection}>
          <span className={styles.sectionHeader}>Pitch Inbox</span>
          
          {!hasListing ? (
            <div className={styles.emptyState}>
              <p>No pitches yet.<br/>Listings with media folders get pitched 4x more.</p>
            </div>
          ) : pitches.length === 0 ? (
            <div className={styles.emptyState}>
              <p>Inbox zero. You are all caught up.</p>
            </div>
          ) : (
            pitches.map(pitch => (
              <div key={pitch.id} className={styles.pitchCard}>
                <div className={styles.pitchHeader}>
                  <div className={styles.brokerInfo}>
                    <div className={styles.brokerAvatar}>{pitch.name.charAt(0)}</div>
                    <div>
                      <div className={styles.brokerName}>
                        {pitch.name}
                        {pitch.verified && <span className={styles.brokerBadge}>Verified</span>}
                      </div>
                    </div>
                  </div>
                  <div className={styles.timer}>{pitch.timeRemaining}</div>
                </div>
                <div className={styles.pitchActions}>
                  <button className={styles.btnAccept} onClick={() => setPitches(p => p.filter(x => x.id !== pitch.id))}>Accept</button>
                  <button className={styles.btnDecline} onClick={() => setPitches(p => p.filter(x => x.id !== pitch.id))}>Decline</button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className={styles.perfSection}>
          <span className={styles.sectionHeader}>Performance (7D)</span>
          
          {!hasListing ? (
            <div className={styles.emptyState}>
              <p>Metrics unlock once you publish.</p>
            </div>
          ) : (
            <div className={styles.perfGrid}>
              <div className={styles.perfCard}>
                <span className={styles.perfVal}>142</span>
                <span className={styles.perfLabel}>Views this week</span>
              </div>
              <div className={styles.perfCard}>
                <span className={styles.perfVal}>18</span>
                <span className={styles.perfLabel}>Saves</span>
              </div>
              <div className={styles.perfCard}>
                <span className={styles.perfVal}>12</span>
                <span className={styles.perfLabel}>Broker Interest</span>
              </div>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
