"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "./page.module.css";
import AtmosphereBackground from "@/components/ui/AtmosphereBackground";
import { Camera, Search, ShieldCheck, Lock } from "lucide-react";
import { BADGE_DEFINITIONS } from "@/lib/BadgeEngine";
import { supabase } from "@/lib/supabaseClient";

const INTENT_TAGS = [
  { id: 'buyer', label: 'Looking to Buy/Rent', icon: <Search strokeWidth={1.5} size="1em" /> },
  { id: 'owner', label: 'I Own Property', icon: '📋' },
  { id: 'broker', label: 'Licensed Broker', icon: '🤝' },
  { id: 'provider', label: 'Service Provider', icon: <Camera strokeWidth={1.5} size="1em" /> }
];

export default function SettingsPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [tags, setTags] = useState([]);
  const [badges, setBadges] = useState([]);
  const [publicProfile, setPublicProfile] = useState({
    headline: "",
    bio: "",
    location: "",
    firm: "",
    service: "",
  });

  // Security State
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [securityMessage, setSecurityMessage] = useState({ type: '', text: '' });

  // 2FA State
  const [factors, setFactors] = useState([]);
  const [qrCode, setQrCode] = useState("");
  const [factorId, setFactorId] = useState("");
  const [verifyCode, setVerifyCode] = useState("");
  const [isEnrolling2FA, setIsEnrolling2FA] = useState(false);
  const [mfaMessage, setMfaMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    async function loadFactors() {
      const { data, error } = await supabase.auth.mfa.listFactors();
      if (data && data.totp) {
        setFactors(data.totp);
      }
    }
    loadFactors();

    const userStr = localStorage.getItem("scoutit_user");
    if (userStr) {
      const user = JSON.parse(userStr);
      setName(user.name || "");
      setTags(user.tags || []);
      if (user.publicProfile) setPublicProfile(p => ({ ...p, ...user.publicProfile }));
      // Temporary mock badges for the user, normally fetched from Supabase
      if (!user.badges) {
        user.badges = [{ id: "FOUNDING_SEEKER" }];
      }
      setBadges(user.badges);
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

  const handlePasswordUpdate = async () => {
    setSecurityMessage({ type: '', text: '' });
    
    if (newPassword.length < 6) {
      setSecurityMessage({ type: 'error', text: 'Password must be at least 6 characters.' });
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setSecurityMessage({ type: 'error', text: 'Passwords do not match.' });
      return;
    }
    
    setIsUpdatingPassword(true);
    
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });
    
    setIsUpdatingPassword(false);
    
    if (error) {
      setSecurityMessage({ type: 'error', text: 'Failed to update password. Please try again or log out and back in.' });
      console.error("Auth update error:", error); // In production this hits Sentry
    } else {
      setSecurityMessage({ type: 'success', text: 'Password successfully updated.' });
      setNewPassword("");
      setConfirmPassword("");
    }
  };

  const start2FAEnrollment = async () => {
    setMfaMessage({ type: '', text: '' });
    setIsEnrolling2FA(true);
    
    const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp' });
    
    if (error) {
      setMfaMessage({ type: 'error', text: 'Failed to start 2FA enrollment.' });
      setIsEnrolling2FA(false);
      return;
    }
    
    setFactorId(data.id);
    setQrCode(data.totp.qr_code); // SVG string
  };

  const verify2FA = async () => {
    setMfaMessage({ type: '', text: '' });
    
    const challenge = await supabase.auth.mfa.challenge({ factorId });
    if (challenge.error) {
      setMfaMessage({ type: 'error', text: 'Failed to initiate verification.' });
      return;
    }
    
    const challengeId = challenge.data.id;
    
    const verify = await supabase.auth.mfa.verify({
      factorId,
      challengeId,
      code: verifyCode
    });
    
    if (verify.error) {
      setMfaMessage({ type: 'error', text: 'Invalid verification code.' });
    } else {
      setMfaMessage({ type: 'success', text: '2FA successfully enabled!' });
      setIsEnrolling2FA(false);
      setQrCode("");
      setVerifyCode("");
      
      const { data } = await supabase.auth.mfa.listFactors();
      if (data && data.totp) setFactors(data.totp);
    }
  };

  const disable2FA = async (id) => {
    const { error } = await supabase.auth.mfa.unenroll({ factorId: id });
    if (error) {
      setMfaMessage({ type: 'error', text: 'Failed to disable 2FA.' });
    } else {
      setMfaMessage({ type: 'success', text: '2FA has been disabled.' });
      const { data } = await supabase.auth.mfa.listFactors();
      if (data) {
        setFactors(data.totp || []);
      }
    }
  };

  return (
    <div className={styles.settingsContainer}>
      <AtmosphereBackground variant="default" />
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

        {/* ── Honors & Badges ── */}
        <div className={styles.formGroup} style={{ marginTop: 24, padding: 24, border: '1px solid rgba(232, 174, 60,0.2)', borderRadius: 12, background: 'rgba(232, 174, 60,0.02)' }}>
          <div className="flex items-center gap-3 mb-2">
            <ShieldCheck className="text-gold-accent" size={20} />
            <h3 className="font-display text-lg text-on-surface">Honors & Badges</h3>
          </div>
          <p style={{color: 'var(--text-secondary)', fontSize: 13, marginBottom: 16}}>
            Your exclusive ScoutIt honors. Badges grant lifetime privileges and discounts.
          </p>
          
          <div className="flex gap-3 flex-wrap mb-6">
            {badges.map(b => {
              const def = BADGE_DEFINITIONS[b.id];
              if (!def) return null;
              return (
                <div key={b.id} className="flex items-center gap-2 px-3 py-2 rounded border" style={{ borderColor: `${def.color}30`, background: `${def.color}10` }}>
                  <ShieldCheck size={14} color={def.color} />
                  <span className="font-mono text-[10px] tracking-widest uppercase" style={{ color: def.color }}>{def.name}</span>
                </div>
              );
            })}
            {badges.length === 0 && (
              <span className="text-text-muted text-sm italic">No honors yet.</span>
            )}
          </div>

          <Link href="/badges" className="inline-block border border-gold-accent text-gold-accent font-working-title text-sm px-4 py-2 rounded hover:bg-gold-accent hover:text-background transition-colors">
            View Milestones & Achievements →
          </Link>
        </div>

        {/* ── Security & Login ── */}
        <div className={styles.formGroup} style={{ marginTop: 24, padding: 24, border: '1px solid var(--surface-variant)', borderRadius: 12, background: 'var(--surface)' }}>
          <div className="flex items-center gap-3 mb-2">
            <Lock className="text-on-surface" size={20} />
            <h3 className="font-display text-lg text-on-surface">Security & Login</h3>
          </div>
          <p style={{color: 'var(--text-secondary)', fontSize: 13, marginBottom: 16}}>
            Update your password or enable Two-Factor Authentication (2FA) to secure your properties.
          </p>

          <label className={styles.label} style={{fontSize: 13}}>New Password</label>
          <input
            type="password"
            className={styles.input}
            placeholder="At least 6 characters"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />

          <label className={styles.label} style={{fontSize: 13, marginTop: 12}}>Confirm New Password</label>
          <input
            type="password"
            className={styles.input}
            placeholder="Re-type new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />

          {securityMessage.text && (
            <div className={`mt-3 p-3 rounded text-sm ${securityMessage.type === 'error' ? 'bg-error/10 border border-error/50 text-error' : 'bg-[#121212] border border-[#E8AE3C] text-[#E8AE3C]'}`}>
              {securityMessage.text}
            </div>
          )}

          <div className="mt-4 flex gap-4">
            <button
              className="bg-on-surface text-background font-working-title text-sm px-4 py-2 rounded disabled:opacity-50"
              onClick={handlePasswordUpdate}
              disabled={isUpdatingPassword || !newPassword || !confirmPassword}
            >
              {isUpdatingPassword ? "Updating..." : "Update Password"}
            </button>
          </div>

          {/* 2FA Section */}
          <div className="mt-8 pt-8 border-t border-surface-variant">
            <h4 className="font-working-title text-md text-on-surface mb-2">Two-Factor Authentication (2FA)</h4>
            
            {mfaMessage.text && (
              <div className={`mb-4 p-3 rounded text-sm ${mfaMessage.type === 'error' ? 'bg-error/10 border border-error/50 text-error' : 'bg-[#121212] border border-[#E8AE3C] text-[#E8AE3C]'}`}>
                {mfaMessage.text}
              </div>
            )}

            {factors.length > 0 && factors.some(f => f.status === 'verified') ? (
              <div className="flex flex-col gap-3 items-start">
                <span className="inline-block px-3 py-1 rounded bg-green-900/30 text-green-400 border border-green-800 text-xs tracking-widest font-mono uppercase">
                  Protected by 2FA
                </span>
                <p className="text-sm text-text-secondary">Your account is secured with an Authenticator App.</p>
                <button
                  className="border border-error/50 text-error font-working-title text-sm px-4 py-2 rounded hover:bg-error/10 transition-colors"
                  onClick={() => disable2FA(factors.find(f => f.status === 'verified').id)}
                >
                  Disable 2FA
                </button>
              </div>
            ) : isEnrolling2FA && qrCode ? (
              <div className="bg-surface-variant p-5 rounded-lg border border-gold-accent/20">
                <p className="text-sm text-on-surface mb-4">
                  1. Scan this QR code with your Authenticator App (Google Authenticator, Authy, etc).
                </p>
                <div 
                  className="bg-white p-2 rounded w-48 h-48 mx-auto mb-4 flex items-center justify-center overflow-hidden"
                  dangerouslySetInnerHTML={{ __html: qrCode }} 
                />
                <p className="text-sm text-on-surface mb-2">
                  2. Enter the 6-digit code from the app to verify.
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    className={`${styles.input} text-center font-mono tracking-widest text-lg`}
                    placeholder="000000"
                    maxLength={6}
                    value={verifyCode}
                    onChange={(e) => setVerifyCode(e.target.value)}
                  />
                  <button
                    className="bg-gold-accent text-background font-working-title text-sm px-6 rounded disabled:opacity-50 whitespace-nowrap"
                    onClick={verify2FA}
                    disabled={verifyCode.length < 6}
                  >
                    Verify Code
                  </button>
                </div>
                <button
                  className="text-text-muted text-xs underline mt-4 hover:text-on-surface"
                  onClick={() => {
                    setIsEnrolling2FA(false);
                    setQrCode("");
                  }}
                >
                  Cancel Enrollment
                </button>
              </div>
            ) : (
              <div>
                <p className="text-sm text-text-secondary mb-4">
                  Add an extra layer of security to your account. You will need an Authenticator App to sign in.
                </p>
                <button
                  className="border border-gold-accent text-gold-accent font-working-title text-sm px-4 py-2 rounded hover:bg-gold-accent hover:text-background transition-colors"
                  onClick={start2FAEnrollment}
                >
                  Enable 2FA App
                </button>
              </div>
            )}
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
