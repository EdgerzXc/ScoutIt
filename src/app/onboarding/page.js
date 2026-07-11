"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Camera, Search } from "lucide-react";
import { signUp, signInWithPassword, signInWithOAuth, signInWithOtp, verifyOtp, getSession } from "@/lib/authClient";
import { supabase } from "@/lib/supabaseClient";
import AtmosphereBackground from "@/components/ui/AtmosphereBackground";

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
  const [useOtp, setUseOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  
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

  // dashboard/page.js decides which mode to render (and bounces to /onboarding
  // if the key is missing) purely from localStorage("scoutit_user") — nothing
  // in the real Supabase auth path ever wrote it, so a RETURNING real user who
  // already has a profile hit an infinite onboarding loop the same way a
  // freshly-onboarded one did. Reconstruct the same shape from their saved
  // profile before sending them to /dashboard.
  const persistLocalSession = (userId, profile) => {
    localStorage.setItem("scoutit_user", JSON.stringify({
      id: userId,
      name: profile.display_name || profile.full_name || "ScoutIt User",
      tags: Array.isArray(profile.active_roles) && profile.active_roles.length > 0
        ? profile.active_roles
        : [profile.role || "buyer"],
      primaryMode: profile.role || "buyer",
      providerType: profile.provider_type || undefined,
      prcLicense: profile.prc_license || undefined,
    }));
  };

  // Handle Google Auth Return
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await getSession();
      if (session?.user) {
        // User just logged in via Google OAuth
        setFormData(prev => ({ ...prev, name: session.user.user_metadata?.full_name || "Google User", email: session.user.email }));
        const { data: profile } = await supabase.from('user_profiles').select('*').eq('id', session.user.id).single();
        if (profile && profile.role) {
          persistLocalSession(session.user.id, profile);
          router.push("/dashboard");
        } else {
          setStep(2);
        }
      }
    };
    checkSession();
  }, [router]);

  const handleAuth = async () => {
    try {
      if (useOtp) {
        if (!otpSent) {
          // Send OTP
          const { error } = await signInWithOtp(formData.email);
          if (error) {
            alert(error.message);
            return;
          }
          setOtpSent(true);
          return;
        } else {
          // Verify OTP
          const { data: verifyData, error: verifyError } = await verifyOtp(formData.email, otpCode);
          if (verifyError || !verifyData?.user) {
            alert(verifyError?.message || "Invalid code");
            return;
          }
          // Same profile check
          const { data: profile } = await supabase.from('user_profiles').select('*').eq('id', verifyData.user.id).single();
          if (profile && profile.role) {
            persistLocalSession(verifyData.user.id, profile);
            router.push("/dashboard");
            return;
          } else {
            nextStep();
            return;
          }
        }
      }

      // Try to sign in first with password
      const { data: signInData, error: signInError } = await signInWithPassword(formData.email, formData.password);
      if (!signInError && signInData?.user) {
        // Successful login, check if they have a profile
        const { data: profile } = await supabase.from('user_profiles').select('*').eq('id', signInData.user.id).single();
        if (profile && profile.role) {
          // Profile exists, skip onboarding
          persistLocalSession(signInData.user.id, profile);
          router.push("/dashboard");
          return;
        } else {
          // No profile, proceed to step 2
          nextStep();
          return;
        }
      }

      // If sign in fails, try sign up
      const { data: signUpData, error: signUpError } = await signUp(formData.email, formData.password, { full_name: formData.name });
      if (signUpError) {
        alert(signUpError.message);
        return;
      }
      
      nextStep();
    } catch (e) {
      alert("Authentication failed.");
    }
  };

  const handleGoogleAuth = async () => {
    await signInWithOAuth('google', {
      redirectTo: `${window.location.origin}/onboarding`
    });
  };

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
          <label className="text-sm font-bold text-on-surface">{useOtp && otpSent ? "Verification Code" : "Password"}</label>
          {!useOtp ? (
            <>
              <input 
                className="bg-surface border border-surface-variant rounded px-4 py-3 text-on-surface focus:outline-none focus:border-gold-accent transition-colors" 
                type="password" 
                placeholder="••••••••"
                value={formData.password}
                onChange={e => setFormData({...formData, password: e.target.value})}
              />
              <span className="text-xs text-text-secondary">At least 8 characters.</span>
            </>
          ) : otpSent ? (
            <>
              <input 
                className="bg-surface border border-surface-variant rounded px-4 py-3 text-on-surface focus:outline-none focus:border-gold-accent transition-colors tracking-[0.5em] font-mono text-center text-lg" 
                type="text" 
                maxLength="6"
                placeholder="123456"
                value={otpCode}
                onChange={e => setOtpCode(e.target.value)}
              />
              <span className="text-xs text-text-secondary">Enter the 6-digit code sent to your email.</span>
            </>
          ) : (
            <p className="text-sm text-text-secondary">We will send a magic link and 6-digit code to your email.</p>
          )}
        </div>
      </div>
      
      <button 
        className="w-full bg-gold-accent text-background font-working-title text-base font-bold py-4 px-6 rounded hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed mb-3" 
        onClick={handleAuth}
        disabled={
          !formData.name || 
          !formData.email.includes("@") || 
          (!useOtp && formData.password.length < 8) || 
          (useOtp && otpSent && otpCode.length < 6)
        }
      >
        {useOtp && !otpSent ? "Send Verification Code →" : useOtp && otpSent ? "Verify & Continue →" : "Continue with Email →"}
      </button>

      {!otpSent && (
        <button 
          className="w-full text-text-secondary text-sm font-bold hover:text-gold-accent transition-colors mb-6"
          onClick={() => {
            setUseOtp(!useOtp);
            setOtpSent(false);
          }}
        >
          {useOtp ? "Use a Password instead" : "Use a One-Time Code instead"}
        </button>
      )}

      {/* Google Auth Disabled for MVP - Requires Google Cloud Billing Setup
      <div className="flex items-center text-text-secondary text-sm my-6 gap-4">
        <div className="flex-1 h-px bg-surface-variant"></div>
        <span className="uppercase tracking-widest text-[10px]">Or</span>
        <div className="flex-1 h-px bg-surface-variant"></div>
      </div>
      
      <button
        className="w-full bg-surface border border-surface-variant text-on-surface font-working-title text-base font-bold py-4 px-6 rounded hover:bg-surface-container transition-colors flex items-center justify-center gap-3"
        onClick={handleGoogleAuth}
      >
        <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
        Continue with Google
      </button>
      */}

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
  const completeOnboarding = async (overrides = {}) => {
    // 1. Get current session
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      alert("Session lost. Please try logging in again.");
      return;
    }

    const primaryMode = overrides.primaryMode || formData.primaryMode;
    const tags = formData.tags.length > 0 ? formData.tags : [primaryMode];

    // 2. Call secure server-side endpoint
    try {
      const response = await fetch('/api/auth/complete-onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          name: formData.name,
          role: primaryMode,
          tags,
          providerType: formData.providerType || null,
          prcLicense: formData.prcLicense || null,
        })
      });

      if (!response.ok) {
        throw new Error("Failed to save profile");
      }

      // 3. dashboard/page.js reads localStorage("scoutit_user") to pick which
      // mode to render and redirects to /onboarding if it's missing — nothing
      // in the real Supabase auth path ever wrote this key, so every real
      // signup landed back here in an infinite loop right after finishing
      // onboarding. Mirror the same shape the dev-mock/mode-switcher writes.
      localStorage.setItem("scoutit_user", JSON.stringify({
        id: session.user.id,
        name: formData.name,
        tags,
        primaryMode,
        providerType: formData.providerType || undefined,
        prcLicense: formData.prcLicense || undefined,
      }));

      // 4. Redirect to unified dashboard
      router.push("/dashboard");
    } catch (error) {
      console.error("Profile save error:", error);
      alert("Failed to save profile.");
      return;
    }
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
        <p className="text-text-secondary font-body-md mb-8">Let&apos;s calibrate your dashboard for Day 1.</p>

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
                <button className="w-full bg-surface border border-surface-variant text-on-surface font-working-title text-base font-bold py-3 px-6 rounded hover:bg-surface-container transition-colors" onClick={() => completeOnboarding()}>I&apos;ll do it later</button>
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
              <p className="text-error text-sm mt-3 text-center">That doesn&apos;t look like a PRC license number — it should contain at least 5 digits.</p>
            )}
          </>
        )}
      </div>
    );
  };

  return (
    <div className="relative min-h-screen bg-background text-text-primary flex flex-col">
      <AtmosphereBackground variant="hero" />
      {/* Universal Grain Overlay */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-50 mix-blend-overlay bg-[url('/grain.png')]"></div>

      <header className="relative z-40 p-6 md:p-8 grid grid-cols-3 items-center sticky top-0 bg-background/90 backdrop-blur-md border-b border-surface-variant">
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
            S<span className="text-on-surface">cout</span>IT
          </Link>
        </div>
        <div className="flex items-center justify-end gap-2">
          {[1,2,3,4].map(s => (
            <div key={s} className={`h-1.5 rounded-full transition-all duration-300 ${step >= s ? 'w-6 bg-gold-accent' : 'w-2 bg-surface-variant'}`} />
          ))}
        </div>
      </header>

      <main className="relative z-10 flex-1 flex flex-col justify-center max-w-[600px] mx-auto w-full p-6 md:p-8 py-12">
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
        {step === 4 && renderStep4()}
      </main>
    </div>
  );
}
