"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Camera, Search } from "lucide-react";

const TAGS = [
  { id: "buyer", icon: "🏠", title: "Looking to Buy or Rent", desc: "Browse, save, and get deep spatial intelligence." },
  { id: "owner", icon: "📋", title: "I Own Property", desc: "List spaces, manage assets, and receive broker pitches." },
  { id: "broker", icon: "🤝", title: "I'm a Licensed Broker / Agent", desc: "Pitch owners, manage listings, and curate leads." },
  { id: "provider", icon: <Camera strokeWidth={1.5} size="1em" />, title: "I'm a Service Provider", desc: "Architectural photos, spatial research, or event design." },
  { id: "exploring", icon: <Search strokeWidth={1.5} size="1em" />, title: "Just Exploring", desc: "I want to see what's out there." }
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
    <div className="flex flex-col animate-[fadeIn_0.5s_ease-out]">
      <span className="text-gold-accent font-label-caps text-[12px] tracking-widest uppercase mb-4 block">Phase 01 // Identity</span>
      <h1 className="font-headline-editorial text-4xl md:text-5xl text-on-surface mb-2">Create your account</h1>
      <p className="text-text-secondary font-body-md mb-8">One place for your whole real estate journey.</p>
      
      <div className="flex flex-col gap-5 mb-8">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-bold text-on-surface">Full Name</label>
          <input 
            className="bg-surface border border-surface-variant rounded px-4 py-3 text-on-surface focus:outline-none focus:border-gold-accent transition-colors" 
            type="text" 
            placeholder="Julian de Ayala"
            value={formData.name}
            onChange={e => setFormData({...formData, name: e.target.value})}
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-sm font-bold text-on-surface">Email Address</label>
          <input 
            className="bg-surface border border-surface-variant rounded px-4 py-3 text-on-surface focus:outline-none focus:border-gold-accent transition-colors" 
            type="email" 
            placeholder="julian@example.com"
            value={formData.email}
            onChange={e => setFormData({...formData, email: e.target.value})}
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-sm font-bold text-on-surface">Password</label>
          <input 
            className="bg-surface border border-surface-variant rounded px-4 py-3 text-on-surface focus:outline-none focus:border-gold-accent transition-colors" 
            type="password" 
            placeholder="••••••••"
            value={formData.password}
            onChange={e => setFormData({...formData, password: e.target.value})}
          />
          <span className="text-xs text-text-secondary">At least 8 characters.</span>
        </div>
      </div>
      
      <button 
        className="w-full bg-gold-accent text-background font-working-title text-base font-bold py-4 px-6 rounded hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed" 
        onClick={nextStep}
        disabled={!formData.name || !formData.email.includes("@") || formData.password.length < 8}
      >
        Continue with Email →
      </button>

      <div className="flex items-center text-text-secondary text-sm my-6 gap-4">
        <div className="flex-1 h-px bg-surface-variant"></div>
        <span className="uppercase tracking-widest text-[10px]">Or</span>
        <div className="flex-1 h-px bg-surface-variant"></div>
      </div>
      
      <button
        className="w-full bg-surface border border-surface-variant text-on-surface font-working-title text-base font-bold py-4 px-6 rounded hover:bg-surface-container transition-colors"
        onClick={() => {
          // Mock Google Auth
          setFormData({...formData, name: "Google User", email: "user@gmail.com", password: "oauth"});
          nextStep();
        }}
      >
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
      const onlyMode = formData.tags[0];
      if (onlyMode === "exploring") {
        // Exploring skips micro-setup entirely — straight to the feed
        completeOnboarding({ primaryMode: onlyMode });
        return;
      }
      // Auto-set primary mode if only one is selected
      setFormData({ ...formData, primaryMode: onlyMode });
      setStep(4); // Skip to step 4
    } else {
      nextStep(); // Go to step 3
    }
  };

  const handleStep3Next = () => {
    if (formData.primaryMode === "exploring") {
      completeOnboarding();
    } else {
      nextStep();
    }
  };

  const renderStep2 = () => (
    <div className="flex flex-col animate-[fadeIn_0.5s_ease-out]">
      <span className="text-gold-accent font-label-caps text-[12px] tracking-widest uppercase mb-4 block">Phase 02 // Intent Matrix</span>
      <h1 className="font-headline-editorial text-4xl md:text-5xl text-on-surface mb-2">How will you use ScoutIt?</h1>
      <p className="text-text-secondary font-body-md mb-8">Select all that apply. This sets up your multi-role dashboard capabilities.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {TAGS.map(tag => {
          const isSelected = formData.tags.includes(tag.id);
          return (
            <div key={tag.id} className="flex flex-col gap-2">
              <div 
                className={`p-5 rounded border transition-all cursor-pointer flex items-start gap-4 ${isSelected ? 'bg-surface-container-low border-gold-accent' : 'bg-surface border-surface-variant hover:border-text-secondary'}`}
                onClick={() => toggleTag(tag.id)}
              >
                <div className="text-3xl mt-1">{tag.icon}</div>
                <div className="flex-1">
                  <h4 className="font-working-title text-lg text-on-surface mb-1">{tag.title}</h4>
                  <p className="text-text-secondary text-sm leading-snug">{tag.desc}</p>
                </div>
              </div>
              
              {tag.id === 'provider' && isSelected && (
                <div className="pl-14 flex flex-col gap-3 mt-2 mb-2 animate-[fadeIn_0.3s_ease-out]">
                  {PROVIDER_SUBTAGS.map(sub => (
                    <label key={sub.id} className="flex items-center gap-3 text-on-surface cursor-pointer group">
                      <input 
                        type="radio" 
                        name="providerType"
                        className="w-5 h-5 accent-gold-accent bg-surface border-surface-variant cursor-pointer"
                        checked={formData.providerType === sub.id}
                        onChange={() => setFormData({...formData, providerType: sub.id})}
                      />
                      <span className="group-hover:text-gold-accent transition-colors">{sub.label}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <button 
        className="w-full bg-gold-accent text-background font-working-title text-base font-bold py-4 px-6 rounded hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed" 
        onClick={handleStep2Next}
        disabled={formData.tags.length === 0 || (formData.tags.includes('provider') && !formData.providerType)}
      >
        Set Capabilities →
      </button>
    </div>
  );

  // --- Step 3: Primary Mode ---
  const renderStep3 = () => (
    <div className="flex flex-col animate-[fadeIn_0.5s_ease-out]">
      <span className="text-gold-accent font-label-caps text-[12px] tracking-widest uppercase mb-4 block">Phase 03 // Workspace</span>
      <h1 className="font-headline-editorial text-4xl md:text-5xl text-on-surface mb-2">What brings you here today?</h1>
      <p className="text-text-secondary font-body-md mb-8">You can switch anytime. This just sets your home base.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {formData.tags.map(tagId => {
          const tag = TAGS.find(t => t.id === tagId);
          const isSelected = formData.primaryMode === tagId;
          return (
            <div 
              key={tag.id}
              className={`p-5 rounded border transition-all cursor-pointer flex items-center gap-4 ${isSelected ? 'bg-surface-container-low border-gold-accent' : 'bg-surface border-surface-variant hover:border-text-secondary'}`}
              onClick={() => setFormData({ ...formData, primaryMode: tag.id })}
            >
              <div className="text-3xl">{tag.icon}</div>
              <div className="flex-1">
                <h4 className="font-working-title text-lg text-on-surface">{tag.title}</h4>
              </div>
            </div>
          );
        })}
      </div>

      <button 
        className="w-full bg-gold-accent text-background font-working-title text-base font-bold py-4 px-6 rounded hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed" 
        onClick={handleStep3Next}
        disabled={!formData.primaryMode}
      >
        Set Primary Mode →
      </button>
    </div>
  );

  // --- Step 4: Micro Setup ---
  const completeOnboarding = (overrides = {}) => {
    // 1. Construct final user payload matching USERS_CMS architecture
    const finalUser = {
      ...formData,
      ...overrides,
      id: `usr-${Date.now()}`,
      created_at: new Date().toISOString(),
      subscription_tier: "free",
      connects_balance: 5,
      profile_completeness: 20, // starts at 20%
    };
    
    // 2. Save to local storage (mock USERS_CMS/auth)
    localStorage.setItem("scoutit_user", JSON.stringify(finalUser));
    
    // 3. Redirect to unified dashboard
    router.push("/dashboard");
  };

  // PRC format check only (per spec — not validity): letters/dash prefix optional + 5+ digits
  const prcFormatOk = /(\d{5,})/.test(formData.prcLicense);

  const renderStep4 = () => {
    const mode = formData.primaryMode;
    if (mode === "exploring") return null; // handled before reaching step 4

    return (
      <div className="flex flex-col animate-[fadeIn_0.5s_ease-out]">
        <span className="text-gold-accent font-label-caps text-[12px] tracking-widest uppercase mb-4 block">Phase 04 // Calibration</span>
        <h1 className="font-headline-editorial text-4xl md:text-5xl text-on-surface mb-2">One last thing</h1>
        <p className="text-text-secondary font-body-md mb-8">Let's calibrate your dashboard for Day 1.</p>

        <div className="bg-surface-alt border border-surface-variant rounded-lg p-6 md:p-8 mb-8">
          {mode === "buyer" && (
            <>
              <h3 className="font-working-title text-xl text-on-surface mb-2">What area are you scouting?</h3>
              <p className="text-text-secondary text-sm mb-6">Optional. Helps us curate your feed.</p>
              <div className="flex flex-col gap-2">
                <input 
                  className="bg-surface border border-surface-variant rounded px-4 py-3 text-on-surface focus:outline-none focus:border-gold-accent transition-colors w-full" 
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
              <h3 className="font-working-title text-xl text-on-surface mb-2">Ready to list your property?</h3>
              <p className="text-text-secondary text-sm mb-6">You can set up your asset profile now, or explore the dashboard first.</p>
              <div className="flex flex-col gap-3">
                <button className="w-full bg-gold-accent text-background font-working-title text-base font-bold py-3 px-6 rounded hover:opacity-90 transition-opacity" onClick={() => { localStorage.setItem("scoutit_open_wizard", "1"); completeOnboarding(); }}>List Property Now</button>
                <button className="w-full bg-surface border border-surface-variant text-on-surface font-working-title text-base font-bold py-3 px-6 rounded hover:bg-surface-container transition-colors" onClick={() => completeOnboarding()}>I'll do it later</button>
              </div>
            </>
          )}

          {mode === "broker" && (
            <>
              <h3 className="font-working-title text-xl text-on-surface mb-2">Verify your License</h3>
              <p className="text-text-secondary text-sm mb-6">To activate Broker Mode and receive inbound pitches, please provide your PRC Real Estate Broker license number.</p>
              <div className="flex flex-col gap-2">
                <input 
                  className="bg-surface border border-surface-variant rounded px-4 py-3 text-on-surface focus:outline-none focus:border-gold-accent transition-colors w-full uppercase" 
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
              <h3 className="font-working-title text-xl text-on-surface mb-2">Set up your {PROVIDER_SUBTAGS.find(s=>s.id === formData.providerType)?.label} profile</h3>
              <p className="text-text-secondary text-sm mb-6">Get your portfolio ready. Profiles that are 100% complete get first placement when gates open.</p>
              <div className="flex flex-col gap-3">
                <button className="w-full bg-gold-accent text-background font-working-title text-base font-bold py-3 px-6 rounded hover:opacity-90 transition-opacity" onClick={() => completeOnboarding()}>Build Profile</button>
                <button className="w-full bg-surface border border-surface-variant text-on-surface font-working-title text-base font-bold py-3 px-6 rounded hover:bg-surface-container transition-colors" onClick={() => completeOnboarding()}>Skip for now</button>
              </div>
            </>
          )}
        </div>

        {mode !== "owner" && mode !== "provider" && (
          <>
            <button
              className="w-full bg-gold-accent text-background font-working-title text-base font-bold py-4 px-6 rounded hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => completeOnboarding()}
              disabled={mode === "broker" && !prcFormatOk}
            >
              Enter ScoutIt →
            </button>
            {mode === "broker" && !prcFormatOk && formData.prcLicense.length > 0 && (
              <p className="text-error text-sm mt-3 text-center">That doesn't look like a PRC license number — it should contain at least 5 digits.</p>
            )}
          </>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background text-text-primary flex flex-col">
      {/* Universal Grain Overlay */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-50 mix-blend-overlay bg-[url('/grain.png')]"></div>

      <header className="p-6 md:p-8 grid grid-cols-3 items-center sticky top-0 bg-background/90 backdrop-blur-md z-40 border-b border-surface-variant">
        <div className="flex items-center justify-start">
          <button 
            onClick={() => router.back()} 
            className="text-text-secondary hover:text-gold-accent transition-colors text-sm font-bold tracking-widest uppercase flex items-center gap-2"
          >
            ← Back
          </button>
        </div>
        <div className="flex justify-center">
          <Link href="/" className="font-display-md text-2xl text-gold-accent tracking-tighter hover:opacity-80 transition-opacity">
            Scout<span className="text-on-surface">IT</span>
          </Link>
        </div>
        <div className="flex items-center justify-end gap-2">
          {[1,2,3,4].map(s => (
            <div key={s} className={`h-1.5 rounded-full transition-all duration-300 ${step >= s ? 'w-6 bg-gold-accent' : 'w-2 bg-surface-variant'}`} />
          ))}
        </div>
      </header>

      <main className="flex-1 flex flex-col justify-center max-w-[600px] mx-auto w-full p-6 md:p-8 py-12">
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
        {step === 4 && renderStep4()}
      </main>
    </div>
  );
}
