"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BadgeCheck, Building2, Search } from "lucide-react";
import {
  getSession,
  getUser,
  signInWithOAuth,
  signInWithOtp,
  signInWithPassword,
  resendSignupConfirmation,
  signUp,
  verifyOtp,
} from "@/lib/authClient";
import { supabase } from "@/lib/supabaseClient";
import AtmosphereBackground from "@/components/ui/AtmosphereBackground";
import TurnstileGate from "@/components/ui/TurnstileGate";
import { sanitizeError } from "@/lib/sanitizeError";
import { trackEvent, GA_EVENTS } from "@/lib/analytics";
import {
  isOnboardingComplete,
  isPrcLicenseFormatValid,
  onboardingActiveModes,
  onboardingPrimaryMode,
} from "@/lib/onboardingProfile";

const PRIMARY_ROLES = [
  {
    id: "buyer",
    icon: Search,
    title: "Buyer / Seeker",
    description: "Discover, save, and compare spaces with deeper location intelligence.",
  },
  {
    id: "owner",
    icon: Building2,
    title: "Property Owner",
    description: "Create private drafts, publish listings, and manage your assets.",
  },
  {
    id: "broker",
    icon: BadgeCheck,
    title: "Licensed Broker",
    description: "Build a verified presence, represent listings, and manage opportunities.",
  },
];

function localSessionFromProfile(userId, profile) {
  const primaryMode = onboardingPrimaryMode(profile);
  const tags = onboardingActiveModes(profile);
  if (!primaryMode || tags.length === 0) return null;

  return {
    id: userId,
    name: profile.display_name || "ScoutIt User",
    tags,
    primaryMode,
    prcLicense: profile.prc_license || undefined,
  };
}

export default function OnboardingPage() {
  const router = useRouter();
  const turnstileRef = useRef(null);
  const [step, setStep] = useState(1);
  const [useOtp, setUseOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [confirmNewAccount, setConfirmNewAccount] = useState(false);
  const [emailConfirmationSent, setEmailConfirmationSent] = useState(false);
  const [confirmationBusy, setConfirmationBusy] = useState(false);
  const [captchaToken, setCaptchaToken] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    dateOfBirth: "",
    email: "",
    password: "",
    primaryMode: "",
    locationFocus: "",
    prcLicense: "",
  });

  const showToast = (message, type = "error") => {
    setToast({ message, type });
    window.setTimeout(() => setToast(null), 5000);
  };

  const resetCaptcha = () => turnstileRef.current?.reset();

  const continueAuthenticatedUser = async (user) => {
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (isOnboardingComplete(profile)) {
      router.replace("/dashboard");
      return;
    }

    setFormData((current) => ({
      ...current,
      name: profile?.display_name || user.user_metadata?.full_name || current.name,
      email: user.email || current.email,
      dateOfBirth: profile?.date_of_birth || current.dateOfBirth,
      primaryMode: onboardingPrimaryMode(profile) || current.primaryMode,
      locationFocus: profile?.location_focus || current.locationFocus,
      prcLicense: profile?.prc_license || current.prcLicense,
    }));
    setStep(2);
  };

  useEffect(() => {
    let active = true;
    const checkSession = async () => {
      const { data: { user } } = await getUser();
      if (active && user) await continueAuthenticatedUser(user);
    };
    checkSession();
    return () => { active = false; };
    // Authentication return is checked once when this page mounts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setEmail = (email) => {
    setConfirmNewAccount(false);
    setEmailConfirmationSent(false);
    setFormData((current) => ({ ...current, email }));
  };

  const handleAuth = async () => {
    try {
      if (useOtp) {
        if (!otpSent) {
          const { error } = await signInWithOtp(formData.email, captchaToken);
          if (error) throw error;
          setOtpSent(true);
          showToast("Check your email for the secure sign-in code.", "success");
          return;
        }

        const { data, error } = await verifyOtp(formData.email, otpCode);
        if (error || !data?.user) throw error || new Error("Invalid code.");
        await continueAuthenticatedUser(data.user);
        return;
      }

      const { data: signInData, error: signInError } = await signInWithPassword(
        formData.email,
        formData.password,
        captchaToken,
      );
      if (!signInError && signInData?.user) {
        await continueAuthenticatedUser(signInData.user);
        return;
      }

      if (signInError?.message?.toLowerCase().includes("email not confirmed")) {
        setEmailConfirmationSent(true);
        setConfirmNewAccount(false);
        resetCaptcha();
        return;
      }

      // Supabase deliberately returns the same failure for an unknown email and
      // a wrong password. Require a second, explicit click before signup so a
      // typo cannot silently create a separate empty account.
      if (!confirmNewAccount) {
        setConfirmNewAccount(true);
        resetCaptcha();
        return;
      }

      const freshToken = await turnstileRef.current?.refresh();
      const { data: signUpData, error: signUpError } = await signUp(
        formData.email,
        formData.password,
        null,
        freshToken || "",
        window.location.origin + "/onboarding",
      );
      if (signUpError) throw signUpError;

      if (signUpData?.session?.user) {
        await continueAuthenticatedUser(signUpData.session.user);
      } else {
        setEmailConfirmationSent(true);
        setConfirmNewAccount(false);
        resetCaptcha();
      }
    } catch (error) {
      resetCaptcha();
      showToast(sanitizeError(error, "Authentication failed."));
    }
  };

  const handleResendConfirmation = async () => {
    setConfirmationBusy(true);
    try {
      const freshToken = await turnstileRef.current?.refresh();
      const { error } = await resendSignupConfirmation(
        formData.email,
        freshToken || "",
        window.location.origin + "/onboarding",
      );
      if (error) throw error;
      showToast("A fresh confirmation email is on its way.", "success");
    } catch (error) {
      showToast(sanitizeError(error, "We could not resend the confirmation email."));
    } finally {
      resetCaptcha();
      setConfirmationBusy(false);
    }
  };

  const handleDifferentEmail = () => {
    setEmailConfirmationSent(false);
    setConfirmNewAccount(false);
    setOtpSent(false);
    setOtpCode("");
    setFormData((current) => ({ ...current, email: "", password: "" }));
    resetCaptcha();
  };

  const handleGoogleAuth = async () => {
    try {
      const { error } = await signInWithOAuth("google", {
        redirectTo: window.location.origin + "/onboarding",
      });
      if (error) throw error;
    } catch (error) {
      showToast(sanitizeError(error, "Google sign-in is temporarily unavailable."));
    }
  };

  const completeOnboarding = async ({ openOwnerWizard = false } = {}) => {
    setSaving(true);
    try {
      const { data: { session } } = await getSession();
      if (!session?.user) throw new Error("Session lost. Please sign in again.");

      const response = await fetch("/api/auth/complete-onboarding", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + session.access_token,
        },
        body: JSON.stringify({
          name: formData.name,
          role: formData.primaryMode,
          dateOfBirth: formData.dateOfBirth,
          locationFocus: formData.locationFocus,
          prcLicense: formData.prcLicense,
        }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || "Failed to save profile.");

      // The verified Supabase session and profile remain the identity source;
      // authentication/profile data is never copied into browser storage.
      if (openOwnerWizard) localStorage.setItem("scoutit_open_wizard", "1");
      trackEvent(GA_EVENTS.SIGNUP_COMPLETED, { role: formData.primaryMode, opened_owner_wizard: Boolean(openOwnerWizard) });
      router.replace("/dashboard");
    } catch (error) {
      console.error("Profile save error:", error);
      showToast(error instanceof Error ? error.message : "Failed to save profile.");
    } finally {
      setSaving(false);
    }
  };

  const renderAuth = () => (
    <div className="flex flex-col animate-[fadeIn_0.5s_ease-out]">
      <span className="text-gold-accent font-label-caps text-[12px] tracking-widest uppercase mb-4">Phase 01 // Secure access</span>
      <h1 className="font-headline-editorial text-4xl md:text-5xl text-on-surface mb-2">Sign in or create an account</h1>
      <p className="text-text-secondary font-body-md mb-8">Authenticate first. New email accounts must be confirmed before private profile setup.</p>
      <aside className="mb-6 rounded-lg border border-gold-accent/30 bg-gold-accent/5 p-4" aria-label="Invited human-testing notice">
        <p className="font-label-caps text-[10px] uppercase tracking-widest text-gold-accent">Invited human-testing pilot</p>
        <p className="mt-2 text-sm leading-6 text-text-secondary">
          Invited testers should use a testing email they control. Your ScoutIt
          testing account is temporary and will be deleted at the real public
          launch; the external email account remains yours.
        </p>
        <p className="mt-2 text-xs leading-5 text-text-muted">
          Use sample phone, profile, listing, and public contact details. Payments,
          subscriptions, upgrades, and Connect purchases are not active.
        </p>
      </aside>

      <div className="flex flex-col gap-5 mb-6">
        <label className="flex flex-col gap-2 text-sm font-bold text-on-surface">
          Email address
          <input className="bg-surface border border-surface-variant rounded px-4 py-3 text-on-surface focus:outline-none focus:border-gold-accent" type="email" autoComplete="email" value={formData.email} onChange={(event) => setEmail(event.target.value)} />
        </label>
        <label className="flex flex-col gap-2 text-sm font-bold text-on-surface">
          {useOtp && otpSent ? "Verification code" : "Password"}
          {!useOtp ? (
            <input className="bg-surface border border-surface-variant rounded px-4 py-3 text-on-surface focus:outline-none focus:border-gold-accent" type="password" autoComplete="current-password" minLength={8} value={formData.password} onChange={(event) => setFormData({ ...formData, password: event.target.value })} />
          ) : otpSent ? (
            <input className="bg-surface border border-surface-variant rounded px-4 py-3 text-on-surface text-center tracking-[0.5em] font-mono focus:outline-none focus:border-gold-accent" inputMode="numeric" maxLength={6} value={otpCode} onChange={(event) => setOtpCode(event.target.value.replace(/\D/g, ""))} />
          ) : (
            <span className="font-normal text-text-secondary">We will email a secure code and sign-in link.</span>
          )}
        </label>
      </div>

      {confirmNewAccount && (
        <div className="mb-4 rounded border border-gold-accent/30 bg-gold-accent/5 p-4">
          <p className="font-label-caps text-[10px] tracking-widest text-gold-accent uppercase mb-2">Confirm new account</p>
          <p className="text-sm text-text-secondary leading-relaxed">We could not sign in <strong className="text-on-surface break-all">{formData.email}</strong>. Correct the password if this account exists, or press the button again to create a new account at this exact address.</p>
          <p className="text-xs text-text-muted leading-relaxed mt-3">Email confirmation is required before private profile setup. Confirm that this address is correct; the link can expire and account access cannot continue until it is verified.</p>
        </div>
      )}

      {emailConfirmationSent && (
        <div className="mb-4 rounded border border-success/40 bg-success/5 p-4" role="status">
          <p className="font-label-caps text-[10px] tracking-widest text-success uppercase mb-2">Confirm your email</p>
          <p className="text-sm text-text-secondary">We sent a confirmation link to <strong className="text-on-surface break-all">{formData.email}</strong>. Open it, then return here to finish your profile.</p>
          <p className="text-xs text-text-muted leading-relaxed mt-3">If your link expired, request a fresh one. If this is the wrong address, change it before creating another account.</p>
          <div className="flex flex-wrap gap-3 mt-4">
            <button type="button" className="min-h-11 px-4 rounded border border-success/40 text-success text-xs font-bold disabled:opacity-50" disabled={confirmationBusy || !captchaToken} onClick={handleResendConfirmation}>
              {confirmationBusy ? "Sendingâ€¦" : "Resend confirmation email"}
            </button>
            <button type="button" className="min-h-11 px-4 rounded border border-surface-variant text-on-surface text-xs font-bold" onClick={handleDifferentEmail}>
              Use a different email
            </button>
          </div>
        </div>
      )}

      <div className="mb-4 flex justify-center">
        <TurnstileGate ref={turnstileRef} onToken={setCaptchaToken} onError={showToast} />
      </div>
      <button className="w-full bg-gold-accent text-background font-working-title font-bold py-4 px-6 rounded disabled:opacity-50 mb-3" onClick={handleAuth} disabled={!formData.email.includes("@") || (!useOtp && formData.password.length < 8) || (useOtp && otpSent && otpCode.length !== 6) || !captchaToken}>
        {useOtp && !otpSent ? "Send verification code →" : useOtp && otpSent ? "Verify and continue →" : confirmNewAccount ? "Yes — create my account →" : "Sign in with email →"}
      </button>
      {!otpSent && (
        <button className="w-full text-text-secondary text-sm font-bold hover:text-gold-accent mb-6" onClick={() => { setUseOtp(!useOtp); setConfirmNewAccount(false); }}>
          {useOtp ? "Sign in with a password" : "Sign in with a code"}
        </button>
      )}
      <div className="flex items-center text-text-secondary text-sm my-5 gap-4"><div className="flex-1 h-px bg-surface-variant" /><span className="uppercase tracking-widest text-[10px]">Or</span><div className="flex-1 h-px bg-surface-variant" /></div>
      <button className="w-full bg-surface border border-surface-variant text-on-surface font-working-title font-bold py-4 px-6 rounded hover:bg-surface-container flex items-center justify-center gap-3" onClick={handleGoogleAuth}>
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09A6.6 6.6 0 0 1 5.49 12c0-.73.13-1.43.35-2.09V7.07H2.18A10.9 10.9 0 0 0 1 12c0 1.78.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15A10.97 10.97 0 0 0 2.18 7.07l3.66 2.84A6.5 6.5 0 0 1 12 5.38z" fill="#EA4335"/></svg>
        Continue with Google
      </button>
    </div>
  );

  const renderProfile = () => (
    <div className="flex flex-col animate-[fadeIn_0.5s_ease-out]">
      <span className="text-gold-accent font-label-caps text-[12px] tracking-widest uppercase mb-4">Phase 02 // Private profile</span>
      <h1 className="font-headline-editorial text-4xl md:text-5xl text-on-surface mb-2">Tell us who you are</h1>
      <p className="text-text-secondary font-body-md mb-8">Your birth date is used only for the 18+ eligibility check and is never shown publicly.</p>
      <div className="flex flex-col gap-5 mb-8">
        <label className="flex flex-col gap-2 text-sm font-bold text-on-surface">
          Full name
          <input className="bg-surface border border-surface-variant rounded px-4 py-3 text-on-surface focus:outline-none focus:border-gold-accent" autoComplete="name" maxLength={120} value={formData.name} onChange={(event) => setFormData({ ...formData, name: event.target.value })} />
        </label>
        <label className="flex flex-col gap-2 text-sm font-bold text-on-surface">
          Date of birth
          <input className="bg-surface border border-surface-variant rounded px-4 py-3 text-base text-on-surface focus:outline-none focus:border-gold-accent" type="date" max={new Date().toISOString().slice(0, 10)} value={formData.dateOfBirth} onChange={(event) => setFormData({ ...formData, dateOfBirth: event.target.value })} />
          <span className="font-normal text-[11px] text-text-muted">Required. ScoutIt is for adults 18 and over.</span>
        </label>
      </div>
      <button className="w-full bg-gold-accent text-background font-working-title font-bold py-4 px-6 rounded disabled:opacity-50" onClick={() => setStep(3)} disabled={!formData.name.trim() || !formData.dateOfBirth}>Choose my role →</button>
    </div>
  );

  const renderRole = () => (
    <div className="flex flex-col animate-[fadeIn_0.5s_ease-out]">
      <span className="text-gold-accent font-label-caps text-[12px] tracking-widest uppercase mb-4">Phase 03 // Primary role</span>
      <h1 className="font-headline-editorial text-4xl md:text-5xl text-on-surface mb-2">How will you start?</h1>
      <p className="text-text-secondary font-body-md mb-8">Choose one primary role now. You can request additional roles later.</p>
      <div className="grid grid-cols-1 gap-4 mb-8">
        {PRIMARY_ROLES.map(({ id, icon: Icon, title, description }) => {
          const selected = formData.primaryMode === id;
          return (
            <button key={id} type="button" aria-pressed={selected} className={"p-5 rounded border text-left transition-all flex items-start gap-4 " + (selected ? "bg-surface-container-low border-gold-accent" : "bg-surface border-surface-variant hover:border-text-secondary")} onClick={() => setFormData({ ...formData, primaryMode: id })}>
              <Icon className="text-gold-accent mt-1 shrink-0" size={26} strokeWidth={1.5} />
              <span><strong className="font-working-title text-lg text-on-surface block mb-1">{title}</strong><span className="text-text-secondary text-sm leading-snug">{description}</span></span>
            </button>
          );
        })}
      </div>
      <button className="w-full bg-gold-accent text-background font-working-title font-bold py-4 px-6 rounded disabled:opacity-50" onClick={() => setStep(4)} disabled={!formData.primaryMode}>Continue setup →</button>
    </div>
  );

  const renderCalibration = () => {
    const mode = formData.primaryMode;
    return (
      <div className="flex flex-col animate-[fadeIn_0.5s_ease-out]">
        <span className="text-gold-accent font-label-caps text-[12px] tracking-widest uppercase mb-4">Phase 04 // Calibration</span>
        <h1 className="font-headline-editorial text-4xl md:text-5xl text-on-surface mb-2">One last thing</h1>
        <p className="text-text-secondary font-body-md mb-8">Set up the workspace you chose.</p>
        <div className="bg-surface-alt border border-surface-variant rounded-lg p-6 md:p-8 mb-8">
          {mode === "buyer" && <><h3 className="font-working-title text-xl text-on-surface mb-2">Where are you scouting?</h3><p className="text-text-secondary text-sm mb-6">Optional and private. This helps personalize your discovery feed.</p><input className="bg-surface border border-surface-variant rounded px-4 py-3 text-on-surface focus:outline-none focus:border-gold-accent w-full" maxLength={160} placeholder="e.g. BGC, Makati, Siargao" value={formData.locationFocus} onChange={(event) => setFormData({ ...formData, locationFocus: event.target.value })} /></>}
          {mode === "owner" && <><h3 className="font-working-title text-xl text-on-surface mb-2">Ready to list a property?</h3><p className="text-text-secondary text-sm">You can open the listing builder immediately after your account setup succeeds, or explore the dashboard first.</p></>}
          {mode === "broker" && <><h3 className="font-working-title text-xl text-on-surface mb-2">Broker license</h3><p className="text-text-secondary text-sm mb-6">Enter your PRC Real Estate Broker license number. This records your claim; public verification remains a separate review.</p><input className="bg-surface border border-surface-variant rounded px-4 py-3 text-on-surface focus:outline-none focus:border-gold-accent w-full uppercase" maxLength={80} placeholder="PRC-REB-XXXXXXX" value={formData.prcLicense} onChange={(event) => setFormData({ ...formData, prcLicense: event.target.value })} />{formData.prcLicense && !isPrcLicenseFormatValid(formData.prcLicense) && <p className="text-error text-sm mt-3">Enter a license number containing at least five digits.</p>}</>}
        </div>
        {mode === "owner" ? (
          <div className="flex flex-col gap-3"><button className="w-full bg-gold-accent text-background font-working-title font-bold py-4 px-6 rounded disabled:opacity-50" disabled={saving} onClick={() => completeOnboarding({ openOwnerWizard: true })}>Create my first listing →</button><button className="w-full bg-surface border border-surface-variant text-on-surface font-working-title font-bold py-4 px-6 rounded disabled:opacity-50" disabled={saving} onClick={() => completeOnboarding()}>Explore dashboard first</button></div>
        ) : (
          <button className="w-full bg-gold-accent text-background font-working-title font-bold py-4 px-6 rounded disabled:opacity-50" disabled={saving || (mode === "broker" && !isPrcLicenseFormatValid(formData.prcLicense))} onClick={() => completeOnboarding()}>{saving ? "Securing profile…" : "Enter my dashboard →"}</button>
        )}
      </div>
    );
  };

  return (
    <div className="relative min-h-screen bg-background text-text-primary flex flex-col">
      <AtmosphereBackground variant="hero" />
      {toast && <div role="status" aria-live="polite" className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] bg-surface border border-gold-accent/50 text-on-surface px-6 py-3 rounded-full shadow-2xl"><span className="text-sm font-working-title">{toast.message}</span></div>}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-50 mix-blend-overlay bg-[url('/grain.png')]" />
      <header className="relative z-40 p-6 md:p-8 grid grid-cols-3 items-center sticky top-0 bg-background/90 backdrop-blur-md border-b border-surface-variant">
        <button onClick={() => step === 1 ? router.back() : setStep((current) => current - 1)} className="justify-self-start text-text-secondary hover:text-gold-accent text-sm font-bold tracking-widest uppercase">← Back</button>
        <Link href="/" className="justify-self-center font-display-md text-2xl text-gold-accent tracking-tighter">S<span className="text-on-surface">cout</span>IT</Link>
        <div className="justify-self-end flex gap-2">{[1, 2, 3, 4].map((phase) => <div key={phase} className={"h-1.5 rounded-full transition-all " + (step >= phase ? "w-6 bg-gold-accent" : "w-2 bg-surface-variant")} />)}</div>
      </header>
      <main className="relative z-10 flex-1 flex flex-col justify-center max-w-[600px] mx-auto w-full p-6 md:p-8 py-12">
        {step === 1 && renderAuth()}
        {step === 2 && renderProfile()}
        {step === 3 && renderRole()}
        {step === 4 && renderCalibration()}
      </main>
    </div>
  );
}
