"use client";

import { useState, useEffect } from "react";
import { getUser, signOut } from "@/lib/authClient";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "./page.module.css";
import AtmosphereBackground from "@/components/ui/AtmosphereBackground";
import { Camera, Search, Lock } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import PrivacyShieldPanel from "@/components/profile/PrivacyShieldPanel";
import DeleteAccountPanel from "@/components/profile/DeleteAccountPanel";
import PlanPanel from "@/components/profile/PlanPanel";
import { getCurrentTier } from "@/lib/entitlements";
import { SETTINGS_SECTIONS } from "@/lib/settingsNavigation";
import { canAddRole } from "@/lib/workspaceUnlock";

const SELF_SERVICE_TAGS = [
  { id: 'buyer', label: 'Looking to Buy/Rent', icon: <Search strokeWidth={1.5} size="1em" /> },
  { id: 'owner', label: 'I Own Property', icon: '📋' },
];

// A-137: broker / provider are earned lenses, not one-click tags. Broker
// needs a PRC licence claim (public verification stays a separate staff
// review); provider needs its Services Offered line filled in.
const GATED_TAGS = [
  { id: 'broker', label: 'Licensed Broker', icon: '🤝', requirement: 'PRC licence number required — claim recorded, verified separately by staff.' },
  { id: 'provider', label: 'Service Provider', icon: <Camera strokeWidth={1.5} size="1em" />, requirement: 'Services Offered line required below, so the roster knows what you do.' },
];

const INTENT_TAGS = [...SELF_SERVICE_TAGS, ...GATED_TAGS];

export default function SettingsPage() {
  const router = useRouter();

  // Real sign-out. Previously this button only cleared the app's profile
  // cache and left the Supabase session (and its refresh token) live — see
  // the header of signOut() in lib/authClient.js. Redirects regardless of
  // the result: local state is torn down either way.
  const handleSignOut = async () => {
    await signOut();
    router.push("/onboarding");
  };
  const [name, setName] = useState("");
  const [tags, setTags] = useState([]);
  const [primaryMode, setPrimaryMode] = useState("");
  // A-137: the roles the account held when this screen loaded. Only *adding*
  // a gated lens is verified; removing one is always allowed.
  const [initialTags, setInitialTags] = useState([]);
  // A-137: PRC claim typed here when adding the broker lens. The browser can
  // never read or write prc_license directly (U-022 server-only grant), so a
  // returning broker is never asked to re-prove — this field only gates the
  // moment broker is *added*, and is then stated through
  // POST /api/broker/credential after the profile save.
  const [brokerClaim, setBrokerClaim] = useState("");
  // Read in an effect, not during render: getCurrentTier() touches
  // localStorage, which does not exist on the server and would break SSR.
  // Only used to say whether the shield is already on by default — never to
  // decide whether the control is shown (Standing Rule 10).
  const [shieldTier, setShieldTier] = useState(null);
  useEffect(() => { setShieldTier(getCurrentTier()); }, []);
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
    async function loadSettings() {
      const [factorsResult, userResult] = await Promise.all([
        supabase.auth.mfa.listFactors(),
        getUser(),
      ]);
      if (factorsResult.data?.totp) setFactors(factorsResult.data.totp);

      const user = userResult.data?.user;
      if (!user) {
        router.replace("/onboarding");
        return;
      }
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("display_name,active_roles,primary_mode,role,headline,bio,location,firm,service")
        .eq("id", user.id)
        .maybeSingle();
      if (!profile) return;

      setName(profile.display_name || "");
      const nextTags = Array.isArray(profile.active_roles) ? profile.active_roles : [];
      setTags(nextTags);
      setInitialTags(nextTags);
      setPrimaryMode(profile.primary_mode || profile.role || nextTags[0] || "");
      setPublicProfile((current) => ({
        ...current,
        headline: profile.headline || "",
        bio: profile.bio || "",
        location: profile.location || "",
        firm: profile.firm || "",
        service: profile.service || "",
      }));
    }
    loadSettings();
  }, [router]);

  const setField = (field, value) => setPublicProfile(p => ({ ...p, [field]: value }));

  const toggleTag = (id) => {
    setTags(prev => 
      prev.includes(id) 
        ? prev.filter(t => t !== id)
        : [...prev, id]
    );
  };

  const handleSave = async () => {
    setSecurityMessage({ type: "", text: "" });
    // A-137: gated lenses are earned, not toggled. Only newly ADDED lenses
    // are checked — removing one is always allowed, and buyer / owner pass
    // with no evidence. The refusal names the task, not a wall.
    const addedRoles = tags.filter((t) => !initialTags.includes(t));
    for (const role of addedRoles) {
      const evidence = role === "broker"
        ? { prcLicense: brokerClaim }
        : { services: publicProfile.service };
      const gate = canAddRole(role, evidence);
      if (!gate.ok) {
        const suffix = role === "broker"
          ? " This records your claim; public verification stays a separate staff review."
          : "";
        setSecurityMessage({ type: "error", text: `${gate.reason}${suffix}` });
        return;
      }
    }
    const { data: { user }, error: userError } = await getUser();
    if (userError || !user) {
      router.replace("/onboarding");
      return;
    }
    
    const nextPrimaryMode = tags.includes(primaryMode) ? primaryMode : tags[0];
    const { error } = await supabase
      .from("user_profiles")
      .update({
        display_name: name.trim(),
        active_roles: tags,
        primary_mode: nextPrimaryMode,
        headline: publicProfile.headline.trim() || null,
        bio: publicProfile.bio.trim() || null,
        location: publicProfile.location.trim() || null,
        firm: publicProfile.firm.trim() || null,
        service: publicProfile.service.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);


    if (error) {
      setSecurityMessage({ type: "error", text: "Profile update failed. Please try again." });
      return;
    }

    // A-137: the profile save above grants the lens; this states the PRC
    // claim through the only writer allowed to touch it
    // (POST /api/broker/credential), which also forces prc_verified = false
    // server-side. Without this, a self-added broker badge would mean nothing.
    if (tags.includes("broker") && !initialTags.includes("broker") && brokerClaim.trim() !== "") {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const res = await fetch("/api/broker/credential", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
          },
          body: JSON.stringify({ prcLicense: brokerClaim.trim() }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setSecurityMessage({ type: "error", text: data.error || "Workspace saved, but the PRC claim could not be recorded. Re-enter it below and save again." });
          return;
        }
      } catch {
        setSecurityMessage({ type: "error", text: "Workspace saved, but the PRC claim could not be recorded. Check your connection and save again." });
        return;
      }
    }
    
    // Supabase is the only persistent profile store.
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
        <div className={styles.intro}>
          <span className={styles.eyebrow}>Control centre</span>
          <h1 className={styles.title}>Settings</h1>
          <p>Manage your account, public presence, privacy, security, and browsing experience.</p>
        </div>

        <nav className={styles.settingsNav} aria-label="Settings sections">
          {SETTINGS_SECTIONS.map((section) => (
            <a key={section.id} href={section.href}>
              {section.label}
            </a>
          ))}
        </nav>

        <section id="account" className={styles.settingsSection} tabIndex="-1">
          <div className={styles.sectionHeader}>
            <span>Account</span>
            <h2>Identity & workspaces</h2>
            <p>Your private account name and the ScoutIt workspaces attached to it.</p>
          </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Display Name</label>
          <input 
            type="text" 
            className={styles.input} 
            aria-label="Display name"
            value={name} 
            onChange={(e) => setName(e.target.value)} 
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label} style={{marginTop: 16}}>Your workspaces</label>
          <p style={{color: 'var(--text-secondary)', fontSize: 13, marginBottom: 16}}>
            Buyer and owner are ready when you are. The dashboard switcher shows only the workspaces you hold.
          </p>

          <div className={styles.tagGrid}>
            {SELF_SERVICE_TAGS.map(tag => (
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

        <div className={styles.formGroup}>
          <label className={styles.label} style={{marginTop: 16}}>Need another lens?</label>
          <p style={{color: 'var(--text-secondary)', fontSize: 13, marginBottom: 16}}>
            Broker and provider workspaces are earned by verification, not toggled. Add yours here and save — the dashboard switcher stays clean until then.
          </p>

          <div className={styles.tagGrid}>
            {GATED_TAGS.map(tag => {
              const held = tags.includes(tag.id);
              const newlyAdding = held && !initialTags.includes(tag.id);
              const heldNote = tag.id === 'broker'
                ? "Held — licence changes re-verify in the Broker workspace."
                : "Held — keep your Services Offered line below up to date.";
              return (
                <div key={tag.id}>
                  <div
                    className={`${styles.tagCard} ${held ? styles.selected : ''}`}
                    onClick={() => toggleTag(tag.id)}
                  >
                    <span className={styles.tagIcon}>{tag.icon}</span>
                    <span style={{fontSize: 14}}>{tag.label}</span>
                  </div>
                  <p style={{color: 'var(--text-secondary)', fontSize: 12, marginTop: 8}}>
                    {held && !newlyAdding ? heldNote : (held ? tag.requirement : `Locked — select to begin: ${tag.requirement}`)}
                  </p>
                  {tag.id === 'broker' && newlyAdding && (
                    <>
                      <label className={styles.label} style={{fontSize: 13, marginTop: 12}}>PRC licence number</label>
                      <input
                        type="text"
                        className={styles.input}
                        placeholder="PRC-REB-XXXXXXX"
                        aria-label="PRC licence number"
                        maxLength={80}
                        value={brokerClaim}
                        onChange={(e) => setBrokerClaim(e.target.value)}
                      />
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        </section>

        <section id="public-profile" className={styles.settingsSection} tabIndex="-1">
          <div className={styles.sectionHeader}>
            <span>Public profile</span>
            <h2>How ScoutIt introduces you</h2>
            <p>Edit the public facts people see before they choose to connect.</p>
          </div>

        {/* ── Public Card Editor ── */}
        <div className={styles.formGroup}>
          <label className={styles.label} style={{marginTop: 24}}>Your Public Card</label>
          <p style={{color: 'var(--text-secondary)', fontSize: 13, marginBottom: 16}}>
            This is how you appear in public directories and lists. A complete card gets noticed first.
          </p>

          <label htmlFor="public-profile-headline" className={styles.label} style={{fontSize: 13}}>Headline</label>
          <input
            id="public-profile-headline"
            type="text"
            className={styles.input}
            placeholder={tags.includes('broker') ? "e.g. Makati CBD specialist — 10 yrs in commercial leasing" : "One line that says what you're about"}
            maxLength={80}
            value={publicProfile.headline}
            onChange={(e) => setField('headline', e.target.value)}
          />

          <label htmlFor="public-profile-bio" className={styles.label} style={{fontSize: 13, marginTop: 12}}>About You</label>
          <textarea
            id="public-profile-bio"
            className={styles.input}
            style={{minHeight: 90, resize: 'vertical', fontFamily: 'inherit'}}
            placeholder="A short bio. What should owners, brokers, or clients know about you?"
            maxLength={300}
            value={publicProfile.bio}
            onChange={(e) => setField('bio', e.target.value)}
          />

          <label htmlFor="public-profile-location" className={styles.label} style={{fontSize: 13, marginTop: 12}}>Location</label>
          <input
            id="public-profile-location"
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
                aria-label="Firm or affiliation"
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
                aria-label="Services offered"
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
                    <span key={t} className="font-label-caps text-[12px] tracking-widest uppercase text-gold-accent border border-gold-accent/30 px-2 py-0.5 rounded-full">{tag.label}</span>
                  ) : null;
                })}
                {publicProfile.location && (
                  <span className="font-label-caps text-[12px] tracking-widest uppercase text-text-secondary border border-surface-variant px-2 py-0.5 rounded-full">📍 {publicProfile.location}</span>
                )}
              </div>
              {publicProfile.bio && <p className="text-xs text-text-secondary mt-2 italic line-clamp-2">{publicProfile.bio}</p>}
              {tags.includes('broker') && publicProfile.firm && <p className="text-xs text-text-secondary mt-1">{publicProfile.firm}</p>}
              {tags.includes('provider') && publicProfile.service && <p className="text-xs text-text-secondary mt-1">{publicProfile.service}</p>}
            </div>
          </div>
        </div>


        </section>

        {/* A-136 — saves the name, role tags and public card above it. It
            used to sit below Password/2FA, which it does not save. */}
        <button
          className={styles.buttonPrimary}
          onClick={handleSave}
          disabled={tags.length === 0}
        >
          Save name & profile
        </button>

        {/* ── Privacy & Anonymity Shield (W13 · C19 · §46.8) ──
            Placed ABOVE Security & Login deliberately. Privacy is the thing a
            ScoutIt user is anxious about; burying it under password fields
            makes it feel like an advanced setting rather than a promise.

            ⚠️ No tier is passed as a permission — only as a hint about what
            the user's DEFAULT already is. Standing Rule 10: never gate a
            privacy control behind a tier. The role decides who sees it, and
            brokers correctly see nothing (being found is their whole value). */}
        <section id="privacy" className={styles.settingsSection} tabIndex="-1">
          <div className={styles.sectionHeader}>
            <span>Privacy</span>
            <h2>Visibility & anonymity</h2>
            <p>Choose what ScoutIt may reveal. Privacy controls never require a paid tier.</p>
          </div>
          <PrivacyShieldPanel
            role={tags.includes('broker') ? 'broker' : (tags.includes('owner') ? 'owner' : 'seeker')}
            tier={shieldTier}
            activeRoles={tags}
          />
        </section>

        {/* ── Plan & Connects (A-135) ── read from the account, never from
            localStorage. Plan name only: no price until pricing is final. */}
        <section id="plan" className={styles.settingsSection} tabIndex="-1">
          <div className={styles.sectionHeader}>
            <span>Plan & Connects</span>
            <h2>Your plan</h2>
            <p>What your account is on, and the Connects you hold.</p>
          </div>
          <PlanPanel />
        </section>

        {/* ── Security & Login ── */}
        <section id="security" className={styles.settingsSection} tabIndex="-1" style={{ padding: 24 }}>
          <div className="flex items-center gap-3 mb-2">
            <Lock className="text-on-surface" size={20} />
            <h2 className="font-display text-lg text-on-surface">Security & Login</h2>
          </div>
          <p style={{color: 'var(--text-secondary)', fontSize: 13, marginBottom: 16}}>
            Update your password or enable Two-Factor Authentication (2FA) to secure your properties.
          </p>

          <label className={styles.label} style={{fontSize: 13}}>New Password</label>
          <input
            type="password"
            className={styles.input}
            placeholder="At least 6 characters"
            aria-label="New password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />

          <label className={styles.label} style={{fontSize: 13, marginTop: 12}}>Confirm New Password</label>
          <input
            type="password"
            className={styles.input}
            placeholder="Re-type new password"
            aria-label="Confirm new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />

          {securityMessage.text && (
            <div className={`mt-3 p-3 rounded text-sm ${securityMessage.type === 'error' ? 'bg-error/10 border border-error/50 text-error' : 'bg-surface border border-gold-accent text-gold-accent'}`}>
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
            <h3 className="font-working-title text-md text-on-surface mb-2">Two-Factor Authentication (2FA)</h3>
            
            {mfaMessage.text && (
              <div className={`mb-4 p-3 rounded text-sm ${mfaMessage.type === 'error' ? 'bg-error/10 border border-error/50 text-error' : 'bg-surface border border-gold-accent text-gold-accent'}`}>
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
                {/* §25.5 flagged this as "trace the source; safe if
                    server-generated SVG, XSS if any user input reaches it —
                    NOT YET VERIFIED."
                    VERIFIED 2026-08-06: SAFE. 'qrCode' is assigned exactly
                    once, from 'data.totp.qr_code' on the Supabase MFA enroll
                    response — an SVG string generated by Supabase from the
                    TOTP secret. No user-supplied value reaches it.
                    ⚠️ If this ever becomes settable from anything a user
                    types, it must stop using dangerouslySetInnerHTML. */}
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
                    aria-label="Authenticator verification code"
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
        </section>

        {/* ── Delete account (A-126) ── RA 10173 §16(e). The route existed and
            nothing could reach it; this is the way in. */}
        <section id="delete-account" className={styles.settingsSection} tabIndex="-1">
          <div className={styles.sectionHeader}>
            <span>Delete account</span>
            <h2>Your right to erasure</h2>
            <p>Delete your private data and close your sign-in. You see exactly what goes and what stays before you confirm.</p>
          </div>
          <DeleteAccountPanel />
        </section>

        <button
          className="w-full mt-4 border border-surface-variant text-text-secondary hover:text-error hover:border-error/50 font-working-title text-sm py-3 rounded transition-colors"
          onClick={handleSignOut}
        >
          🚪 Sign Out
        </button>
      </main>
    </div>
  );
}
