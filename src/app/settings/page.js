"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "./page.module.css";

const INTENT_TAGS = [
  { id: 'buyer', label: 'Looking to Buy/Rent', icon: '🔍' },
  { id: 'owner', label: 'I Own Property', icon: '📋' },
  { id: 'broker', label: 'Licensed Broker', icon: '🤝' },
  { id: 'provider', label: 'Service Provider', icon: '📸' }
];

export default function SettingsPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [tags, setTags] = useState([]);

  useEffect(() => {
    const userStr = localStorage.getItem("scoutit_user");
    if (userStr) {
      const user = JSON.parse(userStr);
      setName(user.name || "");
      setTags(user.tags || []);
    }
  }, []);

  const toggleTag = (id) => {
    setTags(prev => 
      prev.includes(id) 
        ? prev.filter(t => t !== id)
        : [...prev, id]
    );
  };

  const handleSave = () => {
    const userStr = localStorage.getItem("scoutit_user");
    let user = userStr ? JSON.parse(userStr) : {};
    
    user.name = name;
    user.tags = tags;
    
    // If they removed their primary mode tag, fallback to the first available tag
    if (!tags.includes(user.primaryMode) && tags.length > 0) {
      user.primaryMode = tags[0];
    }
    
    localStorage.setItem("scoutit_user", JSON.stringify(user));
    router.push("/dashboard");
  };

  return (
    <div className={styles.settingsContainer}>
      <header className={styles.topNav}>
        <Link href="/dashboard" className={styles.backBtn}>← Back to Dashboard</Link>
      </header>

      <main className={styles.content}>
        <h1 className={styles.title}>Edit Profile Settings</h1>
        
        <div className={styles.formGroup}>
          <label className={styles.label}>Display Name</label>
          <input 
            type="text" 
            className={styles.input} 
            value={name} 
            onChange={(e) => setName(e.target.value)} 
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label} style={{marginTop: 16}}>Your Intent Tags (Dashboards)</label>
          <p style={{color: 'var(--text-secondary)', fontSize: 13, marginBottom: 16}}>
            Select all the roles you play on ScoutIt. Each tag unlocks a dedicated workspace in your Mode Switcher.
          </p>
          
          <div className={styles.tagGrid}>
            {INTENT_TAGS.map(tag => (
              <div 
                key={tag.id}
                className={`${styles.tagCard} ${tags.includes(tag.id) ? styles.selected : ''}`}
                onClick={() => toggleTag(tag.id)}
              >
                <span className={styles.tagIcon}>{tag.icon}</span>
                <span style={{fontSize: 14}}>{tag.label}</span>
              </div>
            ))}
          </div>
        </div>

        <button 
          className={styles.buttonPrimary} 
          onClick={handleSave}
          disabled={tags.length === 0}
        >
          Save Changes
        </button>
      </main>
    </div>
  );
}
