"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";

const TAGS = [
  { id: "buyer", icon: "🏠", title: "Looking to Buy or Rent", desc: "Browse, save, and get deep spatial intelligence." },
  { id: "owner", icon: "📋", title: "I Own Property", desc: "List spaces, manage assets, and receive broker pitches." },
  { id: "broker", icon: "🤝", title: "I'm a Licensed Broker / Agent", desc: "Pitch owners, manage listings, and curate leads." },
  { id: "provider", icon: "📸", title: "I'm a Service Provider", desc: "Architectural photos, spatial research, or event design." },
  { id: "exploring", icon: "🔍", title: "Just Exploring", desc: "I want to see what's out there." }
];

const PROVIDER_SUBTAGS = [
  { id: "photographer", label: "Photographer" },
  { id: "researcher", label: "Site Researcher" },
  { id: "designer", label: "Event Designer" }
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  
  // Data state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    tags: [],
    providerType: "", // If provider is selected
    primaryMode: "",
    locationFocus: "", // Buyer setup
    prcLicense: "",    // Broker setup
  });

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => Math.max(1, s - 1));

  // --- Step 1: Auth ---
  const renderStep1 = () => (
    <div className={styles.stepWrapper}>
      <span className={styles.eyebrow}>Phase 01 // Identity</span>
      <h1 className={styles.heading}>Create your account</h1>
      <p className={styles.subhead}>A unified cryptographic memory for your real estate journey.</p>
      
      <div className={styles.formGroup}>
        <label className={styles.label}>Full Name</label>
        <input 
          className={styles.input} 
          type="text" 
          placeholder="Julian de Ayala"
          value={formData.name}
          onChange={e => setFormData({...formData, name: e.target.value})}
        />
      </div>
      <div className={styles.formGroup}>
        <label className={styles.label}>Email Address</label>
        <input 
          className={styles.input} 
          type="email" 
          placeholder="julian@example.com"
          value={formData.email}
          onChange={e => setFormData({...formData, email: e.target.value})}
        />
      </div>
      <div className={styles.formGroup}>
        <label className={styles.label}>Password</label>
        <input 
          className={styles.input} 
          type="password" 
          placeholder="••••••••"
          value={formData.password}
          onChange={e => setFormData({...formData, password: e.target.value})}
        />
      </div>
      
      <button 
        className={styles.buttonPrimary} 
        onClick={nextStep}
        disabled={!formData.name || !formData.email || !formData.password}
        style={{ opacity: (!formData.name || !formData.email || !formData.password) ? 0.5 : 1 }}
      >
        Continue with Email →
      </button>

      <div className={styles.divider}>Or</div>
      
      <button className={styles.buttonSecondary} onClick={() => {
        // Mock Google Auth
        setFormData({...formData, name: "Google User", email: "user@gmail.com", password: "oauth"});
        nextStep();
      }}>
        Continue with Google
      </button>
    </div>
  );

  // --- Step 2: Intent Tags ---
  const toggleTag = (id) => {
    const current = formData.tags;
    if (current.includes(id)) {
      setFormData({ ...formData, tags: current.filter(t => t !== id), providerType: id === 'provider' ? '' : formData.providerType });
    } else {
      setFormData({ ...formData, tags: [...current, id] });
    }
  };

  const handleStep2Next = () => {
    if (formData.tags.length === 1) {
      // Auto-set primary mode if only one is selected
      setFormData({ ...formData, primaryMode: formData.tags[0] });
      setStep(4); // Skip to step 4
    } else {
      nextStep(); // Go to step 3
    }
  };

  const renderStep2 = () => (
    <div className={styles.stepWrapper}>
      <span className={styles.eyebrow}>Phase 02 // Intent Matrix</span>
      <h1 className={styles.heading}>How will you use ScoutIt?</h1>
      <p className={styles.subhead}>Select all that apply. This sets up your multi-role dashboard capabilities.</p>
      
      <div className={styles.tagGrid}>
        {TAGS.map(tag => {
          const isSelected = formData.tags.includes(tag.id);
          return (
            <div key={tag.id}>
              <div 
                className={`${styles.tagCard} ${isSelected ? styles.selected : ''}`}
                onClick={() => toggleTag(tag.id)}
              >
                <div className={styles.tagIcon}>{tag.icon}</div>
                <div className={styles.tagContent}>
                  <h4>{tag.title}</h4>
                  <p>{tag.desc}</p>
                </div>
              </div>
              
              {tag.id === 'provider' && isSelected && (
                <div className={styles.subSelect}>
                  {PROVIDER_SUBTAGS.map(sub => (
                    <label key={sub.id} className={styles.subSelectLabel}>
                      <input 
                        type="radio" 
                        name="providerType"
                        checked={formData.providerType === sub.id}
                        onChange={() => setFormData({...formData, providerType: sub.id})}
                      />
                      {sub.label}
                    </label>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <button 
        className={styles.buttonPrimary} 
        onClick={handleStep2Next}
        style={{ marginTop: '32px', opacity: formData.tags.length === 0 ? 0.5 : 1 }}
        disabled={formData.tags.length === 0 || (formData.tags.includes('provider') && !formData.providerType)}
      >
        Set Capabilities →
      </button>
    </div>
  );

  // --- Step 3: Primary Mode ---
  const renderStep3 = () => (
    <div className={styles.stepWrapper}>
      <span className={styles.eyebrow}>Phase 03 // Workspace</span>
      <h1 className={styles.heading}>What brings you here today?</h1>
      <p className={styles.subhead}>You have multiple capabilities. Select your primary home base.<br/>(You can switch views anytime with one tap.)</p>
      
      <div className={styles.tagGrid}>
        {formData.tags.map(tagId => {
          const tag = TAGS.find(t => t.id === tagId);
          const isSelected = formData.primaryMode === tagId;
          return (
            <div 
              key={tag.id}
              className={`${styles.tagCard} ${isSelected ? styles.selected : ''}`}
              onClick={() => setFormData({ ...formData, primaryMode: tag.id })}
            >
              <div className={styles.tagIcon}>{tag.icon}</div>
              <div className={styles.tagContent}>
                <h4>{tag.title}</h4>
              </div>
            </div>
          );
        })}
      </div>

      <button 
        className={styles.buttonPrimary} 
        onClick={nextStep}
        style={{ marginTop: '32px', opacity: !formData.primaryMode ? 0.5 : 1 }}
        disabled={!formData.primaryMode}
      >
        Set Primary Mode →
      </button>
    </div>
  );

  // --- Step 4: Micro Setup ---
  const completeOnboarding = () => {
    // 1. Construct final user payload
    const finalUser = {
      ...formData,
      id: `usr-${Date.now()}`,
      created_at: new Date().toISOString(),
      subscription_tier: "free",
      connects_balance: 5,
    };
    
    // 2. Save to local storage (mock USERS_CMS/auth)
    localStorage.setItem("scoutit_user", JSON.stringify(finalUser));
    
    // 3. Redirect to unified dashboard
    router.push("/dashboard");
  };

  const renderStep4 = () => {
    const mode = formData.primaryMode;
    
    if (mode === "exploring") {
      completeOnboarding(); // Skip micro-setup
      return null;
    }

    return (
      <div className={styles.stepWrapper}>
        <span className={styles.eyebrow}>Phase 04 // Calibration</span>
        <h1 className={styles.heading}>One last thing</h1>
        <p className={styles.subhead}>Let's calibrate your dashboard for Day 1.</p>

        <div className={styles.setupCard}>
          {mode === "buyer" && (
            <>
              <h3>What area are you scouting?</h3>
              <p style={{color: 'var(--text-secondary)', fontSize: 14, marginBottom: 24}}>Optional. Helps us curate your feed.</p>
              <div className={styles.formGroup}>
                <input 
                  className={styles.input} 
                  type="text" 
                  placeholder="e.g. BGC, Makati, Siargao"
                  value={formData.locationFocus}
                  onChange={e => setFormData({...formData, locationFocus: e.target.value})}
                />
              </div>
            </>
          )}

          {mode === "owner" && (
            <>
              <h3>Ready to list your property?</h3>
              <p style={{color: 'var(--text-secondary)', fontSize: 14, marginBottom: 24}}>You can set up your asset profile now, or explore the dashboard first.</p>
              <div style={{display: 'flex', gap: 12, flexDirection: 'column'}}>
                <button className={styles.buttonPrimary} onClick={completeOnboarding} style={{marginTop: 0}}>List Property Now</button>
                <button className={styles.buttonSecondary} onClick={completeOnboarding} style={{marginTop: 0}}>I'll do it later</button>
              </div>
            </>
          )}

          {mode === "broker" && (
            <>
              <h3>Verify your License</h3>
              <p style={{color: 'var(--text-secondary)', fontSize: 14, marginBottom: 24}}>To activate Broker Mode and receive inbound pitches, please provide your PRC Real Estate Broker license number.</p>
              <div className={styles.formGroup}>
                <input 
                  className={styles.input} 
                  type="text" 
                  placeholder="PRC-REB-XXXXXXX"
                  value={formData.prcLicense}
                  onChange={e => setFormData({...formData, prcLicense: e.target.value})}
                />
              </div>
            </>
          )}

          {mode === "provider" && (
            <>
              <h3>Set up your {PROVIDER_SUBTAGS.find(s=>s.id === formData.providerType)?.label} profile</h3>
              <p style={{color: 'var(--text-secondary)', fontSize: 14, marginBottom: 24}}>Get your portfolio ready. Profiles that are 100% complete get first placement when gates open.</p>
              <div style={{display: 'flex', gap: 12, flexDirection: 'column'}}>
                <button className={styles.buttonPrimary} onClick={completeOnboarding} style={{marginTop: 0}}>Build Profile</button>
                <button className={styles.buttonSecondary} onClick={completeOnboarding} style={{marginTop: 0}}>Skip for now</button>
              </div>
            </>
          )}
        </div>

        {mode !== "owner" && mode !== "provider" && (
          <button 
            className={styles.buttonPrimary} 
            onClick={completeOnboarding}
            style={{ marginTop: '24px' }}
          >
            Enter ScoutIt →
          </button>
        )}
      </div>
    );
  };

  return (
    <div className={styles.container}>
      {/* Universal Grain Overlay */}
      <div className="grain" aria-hidden="true"></div>

      <header className={styles.topNav}>
        <div className={styles.logo}>Scout<span>IT</span></div>
        <div className={styles.progress}>
          {[1,2,3,4].map(s => (
            <div key={s} className={`${styles.dot} ${step >= s ? styles.active : ''}`} />
          ))}
        </div>
      </header>

      <main className={styles.main}>
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
        {step === 4 && renderStep4()}
      </main>
    </div>
  );
}
