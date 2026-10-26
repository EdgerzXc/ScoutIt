"use client";

import { useState, useEffect, useRef } from "react";
import { getUser, signOut } from "@/lib/authClient";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "./page.module.css";
import AtmosphereBackground from "@/components/ui/AtmosphereBackground";
import InfoTip from "@/components/ui/InfoTip";
import { Camera, Search, Lock, ArrowLeft } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import PrivacyShieldPanel from "@/components/profile/PrivacyShieldPanel";
import NotificationPreferencesPanel from "@/components/profile/NotificationPreferencesPanel";
import DeleteAccountPanel from "@/components/profile/DeleteAccountPanel";
import PlanPanel from "@/components/profile/PlanPanel";
import { getCurrentTier } from "@/lib/entitlements";
import { SETTINGS_SECTIONS } from "@/lib/settingsNavigation";
import { canAddRole } from "@/lib/workspaceUnlock";
import { normalizeDashboardModes, pickPrimaryRole } from "@/lib/dashboardModes";

const SELF_SERVICE_TAGS = [
  { id: 'buyer', label: 'Looking to Buy / Rent', icon: <Search strokeWidth={1.5} size="1.1em" /> },
  { id: 'owner', label: 'Property Owner / Landlord', icon: '📋' },
];

// A-137: broker / provider are earned lenses, not one-click tags. Broker
// needs a PRC licence claim (public verification stays a separate staff
// review); provider needs its Services Offered line filled in.
const GATED_TAGS = [
  { id: 'broker', label: 'Licensed Real Estate Broker', icon: '🤝', requirement: 'PRC licence number required. Enter your license number below; our team verifies it.' },
  { id: 'provider', label: 'Real Estate Service Provider', icon: <Camera strokeWidth={1.5} size="1.1em" />, requirement: 'Please describe the services you offer below (e.g. photography, appraisal, staging).' },
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

  // Active section tracking for smooth navigation & mobile pill scroll
  const [activeSection, setActiveSection] = useState("account");
  const navContainerRef = useRef(null);
  const navItemRefs = useRef({});

  // Feedback states
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

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
        // A-146: keep the deep link across the auth bounce.
        router.replace("/onboarding?next=%2Fsettings");
        return;
      }
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("display_name,active_roles,primary_mode,role,headline,bio,location,firm,service")
        .eq("id", user.id)
        .maybeSingle();
      if (!profile) return;

      setName(profile.display_name || "");
      // A-146: normalize on load — a legacy "seeker" tag otherwise matches no
      // workspace card and the primary falls back by insertion order.
      const nextTags = normalizeDashboardModes(profile.active_roles, profile.primary_mode || profile.role);
      setTags(nextTags);
      setInitialTags(nextTags);
      setPrimaryMode(pickPrimaryRole(nextTags, profile.primary_mode || profile.role));
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

  // Scrollspy observer for active section detection & mobile centering
  useEffect(() => {
    const sectionIds = SETTINGS_SECTIONS.map((s) => s.id);
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

        if (visible.length > 0) {
          const currentId = visible[0].target.id;
          setActiveSection(currentId);
          const navEl = navItemRefs.current[currentId];
          if (navEl && navContainerRef.current) {
            navEl.scrollIntoView({
              behavior: "smooth",
              block: "nearest",
              inline: "center",
            });
          }
        }
      },
      {
        rootMargin: "-100px 0px -55% 0px",
        threshold: [0, 0.2, 0.5],
      }
    );

    sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const handleNavClick = (e, id) => {
    e.preventDefault();
    const target = document.getElementById(id);
    if (target) {
      target.scrollIntoView({ behavior: "smooth" });
      setActiveSection(id);
      if (typeof window !== "undefined") {
        window.history.replaceState(null, "", `#${id}`);
      }
    }
  };

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
    setSaveSuccess(false);
    setIsSaving(true);

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
        setIsSaving(false);
        const suffix = role === "broker"
          ? " This records your claim; public verification stays a separate staff review."
          : "";
        setSecurityMessage({ type: "error", text: `${gate.reason}${suffix}` });
        return;
      }
    }
    const { data: { user }, error: userError } = await getUser();
    if (userError || !user) {
      setIsSaving(false);
      // A-146: keep the deep link across the auth bounce.
      router.replace("/onboarding?next=%2Fsettings");
      return;
    }

    // A-146: the lens must never be held without its credential. State the
    // PRC claim FIRST through POST /api/broker/credential (which forces
    // prc_verified = false server-side); only a recorded claim earns the
    // lens in the profile save below. Previously the save ran first, so a
    // failed claim left the broker lens held with nothing behind it.
    if (tags.includes("broker") && !initialTags.includes("broker")) {
      if (!brokerClaim.trim()) {
        setIsSaving(false);
        setSecurityMessage({ type: "error", text: "Enter your PRC licence number to add the broker workspace. This records your claim; public verification stays a separate staff review." });
        return;
      }
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
          setIsSaving(false);
          setSecurityMessage({ type: "error", text: data.error || "The PRC claim could not be recorded. The broker workspace was not added." });
          return;
        }
      } catch {
        setIsSaving(false);
        setSecurityMessage({ type: "error", text: "The PRC claim could not be recorded. Check your connection; the broker workspace was not added." });
        return;
      }
    }
    
    const nextPrimaryMode = pickPrimaryRole(tags, primaryMode);
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

    setIsSaving(false);

    if (error) {
      setSecurityMessage({ type: "error", text: "Profile update failed. Please try again." });
      return;
    }

    // A-146: the PRC claim is stated BEFORE the profile save above, so a
    // failed claim never leaves the broker lens held with nothing behind it.
    
    // Update initialTags so subsequent edits understand what is already held
    setInitialTags(tags);
    setSaveSuccess(true);
    // Supabase is the only persistent profile store.
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
      console.error("Auth update error:", error);
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
        <Link href="/dashboard" className={styles.backBtn}>
          <ArrowLeft size={15} />
          Back to Dashboard
        </Link>
      </header>

      <main className={styles.content}>
        <div className={styles.intro}>
          <span className={styles.eyebrow}>Account Controls</span>
          <h1 className={styles.title}>Settings</h1>
          <p>Manage your account details, public profile, privacy, alerts, and security in one place.</p>
        </div>

        <nav
          ref={navContainerRef}
          className={styles.settingsNav}
          aria-label="Settings sections"
        >
          {SETTINGS_SECTIONS.map((section) => (
            <a
              key={section.id}
              href={section.href}
              ref={(el) => {
                navItemRefs.current[section.id] = el;
              }}
              className={activeSection === section.id ? styles.navLinkActive : ""}
              onClick={(e) => handleNavClick(e, section.id)}
            >
              {section.label}
            </a>
          ))}
        </nav>

        {/* ── Section 1: Account ── */}
        <section id="account" className={styles.settingsSection} tabIndex="-1">
          <div className={styles.sectionHeader}>
            <span>Account</span>
            <h2>Your Details & Roles</h2>
            <p>Set your display name and choose the roles you use on ScoutIt.</p>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label} style={{display: 'inline-flex', alignItems: 'center', gap: 6}}>
              Display Name <InfoTip tipId="settingsDisplayName" label="About display name" />
            </label>
            <input 
              type="text" 
              className={styles.input} 
              aria-label="Display name"
              placeholder="Your full name or display name"
              value={name} 
              onChange={(e) => setName(e.target.value)} 
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label} style={{marginTop: 16, display: 'inline-flex', alignItems: 'center', gap: 6}}>
              Your Roles <InfoTip tipId="settingsWorkspaces" label="About your roles and workspaces" />
            </label>
            <p style={{color: 'var(--text-secondary)', fontSize: 13, marginBottom: 16}}>
              Choose the roles that fit what you do. You can easily switch between your active workspaces from your dashboard.
            </p>

            <div className={styles.tagGrid}>
              {SELF_SERVICE_TAGS.map(tag => (
                <div
                  key={tag.id}
                  className={`${styles.tagCard} ${tags.includes(tag.id) ? styles.selected : ''}`}
                  onClick={() => toggleTag(tag.id)}
                  role="checkbox"
                  aria-checked={tags.includes(tag.id)}
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') toggleTag(tag.id); }}
                >
                  <span className={styles.tagIcon}>{tag.icon}</span>
                  <span style={{fontSize: 14, fontWeight: 500}}>{tag.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label} style={{marginTop: 16}}>Need another lens?</label>
            <p style={{color: 'var(--text-secondary)', fontSize: 13, marginBottom: 16}}>
              Licensed brokers and verified service providers require brief verification to activate. Select a role below to get started.
            </p>

            <div className={styles.tagGrid}>
              {GATED_TAGS.map(tag => {
                const held = tags.includes(tag.id);
                const newlyAdding = held && !initialTags.includes(tag.id);
                const heldNote = tag.id === 'broker'
                  ? "Active role. License updates can be submitted from your Broker workspace."
                  : "Active role. Keep your Services Offered description below updated.";
                return (
                  <div key={tag.id}>
                    <div
                      className={`${styles.tagCard} ${held ? styles.selected : ''}`}
                      onClick={() => toggleTag(tag.id)}
                      role="checkbox"
                      aria-checked={held}
                      tabIndex={0}
                      onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') toggleTag(tag.id); }}
                    >
                      <span className={styles.tagIcon}>{tag.icon}</span>
                      <span style={{fontSize: 14, fontWeight: 500}}>{tag.label}</span>
                    </div>
                    <p style={{color: 'var(--text-secondary)', fontSize: 12, marginTop: 8, lineHeight: 1.5}}>
                      {held && !newlyAdding ? heldNote : (held ? tag.requirement : `Tap to select: ${tag.requirement}`)}
                    </p>
                    {tag.id === 'broker' && newlyAdding && (
                      <div style={{marginTop: 12}}>
                        <label className={styles.label} style={{fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 6}}>
                          PRC licence number <InfoTip tipId="settingsPrcLicense" label="About PRC licence requirement" />
                        </label>
                        <input
                          type="text"
                          className={styles.input}
                          placeholder="PRC-REB-XXXXXXX"
                          aria-label="PRC licence number"
                          maxLength={80}
                          value={brokerClaim}
                          onChange={(e) => setBrokerClaim(e.target.value)}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── Section 2: Public Profile ── */}
        <section id="public-profile" className={styles.settingsSection} tabIndex="-1">
          <div className={styles.sectionHeader}>
            <span>Public Profile</span>
            <h2>Public Profile Card</h2>
            <p>The details other members see when they view your profile or listings.</p>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label} style={{marginTop: 12}}>Your Public Card</label>
            <p style={{color: 'var(--text-secondary)', fontSize: 13, marginBottom: 16}}>
              A complete profile helps you connect with buyers, owners, and brokers faster.
            </p>

            <label htmlFor="public-profile-headline" className={styles.label} style={{fontSize: 12}}>Headline</label>
            <input
              id="public-profile-headline"
              type="text"
              className={styles.input}
              placeholder={tags.includes('broker') ? "e.g. Commercial Leasing Specialist in BGC & Makati" : "A short line describing what you do"}
              maxLength={80}
              value={publicProfile.headline}
              onChange={(e) => setField('headline', e.target.value)}
            />

            <label htmlFor="public-profile-bio" className={styles.label} style={{fontSize: 12, marginTop: 14}}>About You</label>
            <textarea
              id="public-profile-bio"
              className={styles.input}
              style={{minHeight: 96, resize: 'vertical', fontFamily: 'inherit'}}
              placeholder="Brief summary. What should owners, brokers, or clients know about you?"
              maxLength={300}
              value={publicProfile.bio}
              onChange={(e) => setField('bio', e.target.value)}
            />

            <label htmlFor="public-profile-location" className={styles.label} style={{fontSize: 12, marginTop: 14}}>Location</label>
            <input
              id="public-profile-location"
              type="text"
              className={styles.input}
              placeholder="e.g. Metro Manila, Cebu, or Bonifacio Global City"
              value={publicProfile.location}
              onChange={(e) => setField('location', e.target.value)}
            />

            {tags.includes('broker') && (
              <>
                <label className={styles.label} style={{fontSize: 12, marginTop: 14}}>Company or Agency</label>
                <input
                  type="text"
                  className={styles.input}
                  placeholder="e.g. Santos Realty Group, or Independent"
                  aria-label="Firm or affiliation"
                  value={publicProfile.firm}
                  onChange={(e) => setField('firm', e.target.value)}
                />
              </>
            )}

            {tags.includes('provider') && (
              <>
                <label className={styles.label} style={{fontSize: 12, marginTop: 14, display: 'inline-flex', alignItems: 'center', gap: 6}}>
                  Services Offered <InfoTip tipId="settingsServicesOffered" label="About services offered" />
                </label>
                <input
                  type="text"
                  className={styles.input}
                  placeholder="e.g. Architectural photography, 3D tours, staging, appraisals"
                  aria-label="Services offered"
                  value={publicProfile.service}
                  onChange={(e) => setField('service', e.target.value)}
                />
              </>
            )}
          </div>

          {/* ── Live Preview ── */}
          <div className={styles.formGroup}>
            <label className={styles.label} style={{display: 'inline-flex', alignItems: 'center', gap: 6}}>
              Preview: How others see your card <InfoTip tipId="settingsPublicCard" label="About public card preview" />
            </label>
            <div style={{
              background: 'var(--surface2)',
              border: '1px solid var(--accent-muted)',
              borderRadius: 8,
              padding: 20,
              marginTop: 8,
              display: 'flex',
              gap: 16,
              alignItems: 'flex-start'
            }}>
              <div style={{
                width: 52,
                height: 52,
                borderRadius: '50%',
                background: 'var(--surface)',
                border: '2px solid var(--accent)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: 18,
                color: 'var(--text-primary)',
                flexShrink: 0
              }}>
                {name ? name.substring(0,2).toUpperCase() : '?'}
              </div>
              <div style={{flex: 1, minWidth: 0}}>
                <div style={{fontFamily: 'var(--font-display)', fontSize: 18, color: 'var(--text-primary)', fontWeight: 600}}>
                  {name || "Your Name"}
                </div>
                <div style={{fontSize: 14, color: 'var(--accent-bright)', marginTop: 2}}>
                  {publicProfile.headline || "Your headline will appear here"}
                </div>
                <div style={{display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10}}>
                  {tags.map(t => {
                    const tag = INTENT_TAGS.find(x => x.id === t);
                    return tag ? (
                      <span key={t} style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 12,
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                        color: 'var(--accent-bright)',
                        border: '1px solid rgba(var(--accent-rgb), 0.35)',
                        background: 'rgba(var(--accent-rgb), 0.08)',
                        padding: '2px 8px',
                        borderRadius: 9999
                      }}>
                        {tag.label}
                      </span>
                    ) : null;
                  })}
                  {publicProfile.location && (
                    <span style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 12,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      color: 'var(--text-secondary)',
                      border: '1px solid var(--border-solid)',
                      padding: '2px 8px',
                      borderRadius: 9999
                    }}>
                      📍 {publicProfile.location}
                    </span>
                  )}
                </div>
                {publicProfile.bio && (
                  <p style={{fontSize: 13, color: 'var(--text-secondary)', marginTop: 8, fontStyle: 'italic', lineHeight: 1.5}}>
                    {publicProfile.bio}
                  </p>
                )}
                {tags.includes('broker') && publicProfile.firm && (
                  <p style={{fontSize: 12, color: 'var(--text-muted)', marginTop: 4}}>
                    🏢 {publicProfile.firm}
                  </p>
                )}
                {tags.includes('provider') && publicProfile.service && (
                  <p style={{fontSize: 12, color: 'var(--text-muted)', marginTop: 4}}>
                    🛠 {publicProfile.service}
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* A-136 — saves the name, role tags and public card above it. It
            used to sit below Password/2FA, which it does not save. */}
        <button
          className={styles.buttonPrimary}
          onClick={handleSave}
          disabled={tags.length === 0 || isSaving}
        >
          {isSaving ? "Saving changes..." : "Save Profile Changes"}
        </button>

        {saveSuccess && (
          <div className={styles.saveSuccessBanner} role="status">
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span className={styles.saveSuccessIcon}>✓</span>
              <span>Your profile changes have been saved.</span>
            </div>
            <Link href="/dashboard" className={styles.saveSuccessLink}>
              Go to Dashboard →
            </Link>
          </div>
        )}

        {securityMessage.text && (
          <div style={{
            marginTop: 12,
            padding: "12px 16px",
            borderRadius: 6,
            fontSize: 13,
            backgroundColor: securityMessage.type === 'error' ? 'rgba(220, 53, 69, 0.1)' : 'rgba(var(--accent-rgb), 0.1)',
            border: securityMessage.type === 'error' ? '1px solid rgba(220, 53, 69, 0.4)' : '1px solid var(--accent)',
            color: securityMessage.type === 'error' ? 'var(--red)' : 'var(--accent-bright)'
          }}>
            {securityMessage.text}
          </div>
        )}

        {/* ── Section 3: Privacy & Visibility ── */}
        <section id="privacy" className={styles.settingsSection} tabIndex="-1">
          <div className={styles.sectionHeader}>
            <span>Privacy</span>
            <h2>Privacy & Visibility</h2>
            <p>Choose what information is visible to other members. All privacy features are free for all accounts.</p>
          </div>
          <PrivacyShieldPanel
            role={tags.includes('broker') ? 'broker' : (tags.includes('owner') ? 'owner' : 'seeker')}
            tier={shieldTier}
            activeRoles={tags}
          />
        </section>

        {/* ── Section 4: Notifications ── */}
        <section id="notifications" className={styles.settingsSection} tabIndex="-1">
          <div className={styles.sectionHeader}>
            <span>Notifications</span>
            <h2>Email & Alerts</h2>
            <p>Control what emails and alerts you receive from ScoutIt.</p>
          </div>
          <NotificationPreferencesPanel />
        </section>

        {/* ── Section 5: Plan & Connects ── */}
        <section id="plan" className={styles.settingsSection} tabIndex="-1">
          <div className={styles.sectionHeader}>
            <span>Plan & Connects</span>
            <h2>Your Plan & Connects</h2>
            <p>View your active membership plan and available Connects balance.</p>
          </div>
          <PlanPanel />
        </section>

        {/* ── Section 6: Security & Login ── */}
        <section id="security" className={styles.settingsSection} tabIndex="-1">
          <div className={styles.sectionHeader}>
            <span>Security</span>
            <h2>Password & Two-Step Verification</h2>
            <p>Keep your account safe by updating your password or enabling an authenticator app.</p>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>New Password</label>
            <input
              type="password"
              className={styles.input}
              placeholder="At least 6 characters"
              aria-label="New password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />

            <label className={styles.label} style={{marginTop: 12}}>Confirm New Password</label>
            <input
              type="password"
              className={styles.input}
              placeholder="Re-type new password"
              aria-label="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />

            <div style={{marginTop: 14}}>
              <button
                className="bg-on-surface text-background font-working-title text-sm px-5 py-3 rounded disabled:opacity-50"
                style={{minHeight: 44, cursor: 'pointer', borderRadius: 6}}
                onClick={handlePasswordUpdate}
                disabled={isUpdatingPassword || !newPassword || !confirmPassword}
              >
                {isUpdatingPassword ? "Updating password..." : "Update Password"}
              </button>
            </div>
          </div>

          {/* 2FA Section */}
          <div style={{marginTop: 32, paddingTop: 24, borderTop: '1px solid var(--border-subtle, var(--border))'}}>
            <h3 style={{fontFamily: 'var(--font-display)', fontSize: 18, color: 'var(--text-primary)', marginBottom: 6, display: 'inline-flex', alignItems: 'center', gap: 6}}>
              Two-Factor Authentication (2FA) <InfoTip tipId="settingsTwoFactor" label="About two-factor authentication" />
            </h3>
            <p style={{color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.6, marginBottom: 16}}>
              Add an extra layer of protection to your account using an authenticator app (such as Google Authenticator, Microsoft Authenticator, or 1Password).
            </p>

            {mfaMessage.text && (
              <div style={{
                marginBottom: 16,
                padding: "12px 16px",
                borderRadius: 6,
                fontSize: 13,
                backgroundColor: mfaMessage.type === 'error' ? 'rgba(220, 53, 69, 0.1)' : 'rgba(var(--accent-rgb), 0.1)',
                border: mfaMessage.type === 'error' ? '1px solid rgba(220, 53, 69, 0.4)' : '1px solid var(--accent)',
                color: mfaMessage.type === 'error' ? 'var(--red)' : 'var(--accent-bright)'
              }}>
                {mfaMessage.text}
              </div>
            )}

            {factors.length > 0 && factors.some(f => f.status === 'verified') ? (
              <div style={{display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'flex-start'}}>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '4px 10px',
                  borderRadius: 4,
                  background: 'rgba(40, 167, 69, 0.15)',
                  color: '#48d374',
                  border: '1px solid rgba(40, 167, 69, 0.4)',
                  fontSize: 12,
                  fontFamily: 'var(--font-mono)',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase'
                }}>
                  ✓ Protected by Two-Factor Authentication
                </span>
                <p style={{fontSize: 13, color: 'var(--text-secondary)'}}>
                  Your account is secured. An authenticator code is required when signing in.
                </p>
                <button
                  style={{
                    minHeight: 44,
                    padding: '0 16px',
                    borderRadius: 6,
                    border: '1px solid rgba(220, 53, 69, 0.4)',
                    color: 'var(--red)',
                    background: 'transparent',
                    fontSize: 13,
                    fontFamily: 'var(--font-mono)',
                    cursor: 'pointer'
                  }}
                  onClick={() => disable2FA(factors.find(f => f.status === 'verified').id)}
                >
                  Disable 2FA
                </button>
              </div>
            ) : isEnrolling2FA && qrCode ? (
              <div style={{
                background: 'var(--surface2)',
                padding: 20,
                borderRadius: 8,
                border: '1px solid var(--border-solid)'
              }}>
                <p style={{fontSize: 14, color: 'var(--text-primary)', marginBottom: 12}}>
                  1. Scan this QR code with your Authenticator App:
                </p>
                <div
                  style={{background: '#ffffff', padding: 12, borderRadius: 8, width: 200, height: 200, margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden'}}
                  dangerouslySetInnerHTML={{ __html: qrCode }}
                />
                <p style={{fontSize: 14, color: 'var(--text-primary)', marginBottom: 8}}>
                  2. Enter the 6-digit code shown in your app:
                </p>
                <div style={{display: 'flex', gap: 8, flexWrap: 'wrap'}}>
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    className={styles.input}
                    style={{width: 140, textAlign: 'center', fontFamily: 'var(--font-mono)', letterSpacing: '0.12em', fontSize: 18}}
                    placeholder="000000"
                    maxLength={6}
                    aria-label="Authenticator verification code"
                    value={verifyCode}
                    onChange={(e) => setVerifyCode(e.target.value)}
                  />
                  <button
                    className="bg-gold-accent text-background font-working-title text-sm px-6 rounded disabled:opacity-50"
                    style={{minHeight: 44, cursor: 'pointer', borderRadius: 6}}
                    onClick={verify2FA}
                    disabled={verifyCode.length < 6}
                  >
                    Verify & Activate
                  </button>
                </div>
                <button
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    fontSize: 12,
                    textDecoration: 'underline',
                    marginTop: 14,
                    cursor: 'pointer',
                    padding: 0
                  }}
                  onClick={() => {
                    setIsEnrolling2FA(false);
                    setQrCode("");
                  }}
                >
                  Cancel setup
                </button>
              </div>
            ) : (
              <div>
                <p style={{fontSize: 13, color: 'var(--text-secondary)', marginBottom: 14}}>
                  Add extra defense against unauthorized logins. You will use an authenticator app when signing in.
                </p>
                <button
                  style={{
                    minHeight: 44,
                    padding: '0 18px',
                    borderRadius: 6,
                    border: '1px solid var(--accent)',
                    color: 'var(--accent-bright)',
                    background: 'rgba(var(--accent-rgb), 0.08)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 12,
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    cursor: 'pointer'
                  }}
                  onClick={start2FAEnrollment}
                >
                  Enable Two-Factor Authentication
                </button>
              </div>
            )}
          </div>
        </section>

        {/* ── Section 7: Delete Account ── */}
        <section id="delete-account" className={styles.settingsSection} tabIndex="-1">
          <div className={styles.sectionHeader}>
            <span>Delete Account</span>
            <h2>Close Account & Delete Data</h2>
            <p>Permanently delete your personal profile and close your ScoutIt account under Philippine Data Privacy laws (RA 10173).</p>
          </div>
          <DeleteAccountPanel />
        </section>

        <button
          className={styles.signOutButton}
          onClick={handleSignOut}
        >
          Sign Out of ScoutIt
        </button>
      </main>
    </div>
  );
}
