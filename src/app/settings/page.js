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
  const [publicProfile, setPublicProfile] = useState({
    headline: "",
    bio: "",
    location: "",
    firm: "",
    service: "",
  });

  useEffect(() => {
    const userStr = localStorage.getItem("scoutit_user");
    if (userStr) {
      const user = JSON.parse(userStr);
      setName(user.name || "");
      setTags(user.tags || []);
      if (user.publicProfile) setPublicProfile(p => ({ ...p, ...user.publicProfile }));
    }
  }, []);

  const setField = (field, value) => setPublicProfile(p => ({ ...p, [field]: value }));

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
    user.publicProfile = publicProfile;


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

        {/* ── Public Card Editor ── */}
        <div className={styles.formGroup}>
          <label className={styles.label} style={{marginTop: 24}}>Your Public Card</label>
          <p style={{color: 'var(--text-secondary)', fontSize: 13, marginBottom: 16}}>
            This is how you appear in public directories and lists. A complete card gets noticed first.
          </p>

          <label className={styles.label} style={{fontSize: 13}}>Headline</label>
          <input
            type="text"
            className={styles.input}
            placeholder={tags.includes('broker') ? "e.g. Makati CBD specialist — 10 yrs in commercial leasing" : "One line that says what you're about"}
            maxLength={80}
            value={publicProfile.headline}
            onChange={(e) => setField('headline', e.target.value)}
          />

          <label className={styles.label} style={{fontSize: 13, marginTop: 12}}>About You</label>
          <textarea
            className={styles.input}
            style={{minHeight: 90, resize: 'vertical', fontFamily: 'inherit'}}
            placeholder="A short bio. What should owners, brokers, or clients know about you?"
            maxLength={300}
            value={publicProfile.bio}
            onChange={(e) => setField('bio', e.target.value)}
          />

          <label className={styles.label} style={{fontSize: 13, marginTop: 12}}>Location</label>
          <input
            type="text"
            className={styles.input}
            placeholder="e.g. Metro Manila"
            value={publicProfile.location}
            onChange={(e) => setField('location', e.target.value)}
          />

          {tags.includes('broker') && (
            <>
              <label className={styles.label} style={{fontSize: 13, marginTop: 12}}>Firm / Affiliation</label>
              <input
                type="text"
                className={styles.input}
                placeholder="e.g. Santos Realty Group — or Independent"
                value={publicProfile.firm}
                onChange={(e) => setField('firm', e.target.value)}
              />
            </>
          )}

          {tags.includes('provider') && (
            <>
              <label className={styles.label} style={{fontSize: 13, marginTop: 12}}>Services Offered</label>
              <input
                type="text"
                className={styles.input}
                placeholder="e.g. Architectural photography, drone shots, floorplans"
                value={publicProfile.service}
                onChange={(e) => setField('service', e.target.value)}
              />
            </>
          )}
        </div>

        {/* ── Live Preview ── */}
        <div className={styles.formGroup}>
          <label className={styles.label}>Preview — how others see you</label>
          <div className="bg-surface border border-surface-variant rounded-lg p-5 mt-2 flex gap-4 items-start">
            <div className="w-14 h-14 rounded-full bg-surface-variant border-2 border-gold-accent flex items-center justify-center font-bold text-xl text-on-surface shrink-0">
              {name ? name.substring(0,2).toUpperCase() : '?'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-working-title text-lg text-on-surface">{name || "Your Name"}</div>
              <div className="text-sm text-gold-accent">{publicProfile.headline || "Your headline appears here"}</div>
              <div className="flex flex-wrap gap-2 mt-2">
                {tags.map(t => {
                  const tag = INTENT_TAGS.find(x => x.id === t);
                  return tag ? (
                    <span key={t} className="font-label-caps text-[9px] tracking-widest uppercase text-gold-accent border border-gold-accent/30 px-2 py-0.5 rounded-full">{tag.label}</span>
                  ) : null;
                })}
                {publicProfile.location && (
                  <span className="font-label-caps text-[9px] tracking-widest uppercase text-text-secondary border border-surface-variant px-2 py-0.5 rounded-full">📍 {publicProfile.location}</span>
                )}
              </div>
              {publicProfile.bio && <p className="text-xs text-text-secondary mt-2 italic line-clamp-2">{publicProfile.bio}</p>}
              {tags.includes('broker') && publicProfile.firm && <p className="text-xs text-text-secondary mt-1">{publicProfile.firm}</p>}
              {tags.includes('provider') && publicProfile.service && <p className="text-xs text-text-secondary mt-1">{publicProfile.service}</p>}
            </div>
          </div>
        </div>

        <button
          className={styles.buttonPrimary}
          onClick={handleSave}
          disabled={tags.length === 0}
        >
          Save Changes
        </button>

        <button
          className="w-full mt-4 border border-surface-variant text-text-secondary hover:text-error hover:border-error/50 font-working-title text-sm py-3 rounded transition-colors"
          onClick={() => { localStorage.removeItem("scoutit_user"); router.push("/onboarding"); }}
        >
          🚪 Sign Out
        </button>
      </main>
    </div>
  );
}
