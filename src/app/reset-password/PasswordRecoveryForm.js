"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import TurnstileGate from "@/components/ui/TurnstileGate";
import {
  createPasswordRecoveryClient,
  sendPasswordRecovery,
  verifyPasswordRecovery,
} from "@/lib/passwordRecovery";

const inputClass = "w-full rounded border border-surface-variant bg-background px-3 py-3 text-base text-on-surface focus-visible:outline-2 focus-visible:outline-gold-accent";
const linkClass = "inline-flex min-h-11 items-center text-gold-accent underline hover:text-gold-bright";

export default function PasswordRecoveryForm({ enterCode }) {
  const [stage, setStage] = useState(enterCode ? "code" : "request");
  const [email, setEmail] = useState("");
  const [captchaToken, setCaptchaToken] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const captchaRef = useRef(null);
  const recoveryRef = useRef(null);
  const inFlight = useRef(false);

  function startOver() {
    recoveryRef.current = null;
    setError("");
    setCaptchaToken("");
    setSent(false);
    setStage("request");
  }

  async function submit(event) {
    event.preventDefault();
    if (inFlight.current) return;

    const form = new FormData(event.currentTarget);
    const accountEmail = email.trim();
    const password = form.get("password");
    if (stage !== "request" && password !== form.get("confirmPassword")) {
      setError("The passwords do not match.");
      return;
    }
    if (stage === "request" && !captchaToken) return;

    inFlight.current = true;
    setBusy(true);
    setError("");
    try {
      const auth = recoveryRef.current || createPasswordRecoveryClient();
      if (!auth) throw new Error("Recovery unavailable");

      if (stage === "request") {
        await sendPasswordRecovery(auth, accountEmail, captchaToken);
        setSent(true);
        setStage("code");
        return;
      }

      if (stage === "code") {
        if (!await verifyPasswordRecovery(auth, accountEmail, form.get("code"))) {
          setError("This code is invalid or has expired. Request a new code and try again.");
          return;
        }
        recoveryRef.current = auth;
        setStage("verified");
      }

      const { error: updateError } = await auth.updateUser({ password });
      if (updateError) {
        if (["session_not_found", "session_expired", "bad_jwt"].includes(updateError.code)) {
          startOver();
          setError("Your recovery session expired. Request a new code.");
        } else if (["weak_password", "same_password"].includes(updateError.code)) {
          setError("Choose a stronger password that differs from your current password.");
        } else {
          setError("We could not update your password. Try again in this tab.");
        }
        return;
      }

      try {
        const { error: signOutError } = await auth.signOut({ scope: "global" });
        if (signOutError) setError("Your password changed. Sign out of any other devices you still have open.");
      } catch {
        setError("Your password changed. Sign out of any other devices you still have open.");
      }
      recoveryRef.current = null;
      setStage("done");
    } catch (failure) {
      if (failure?.code === "otp_expired") {
        setError("This code is invalid or has expired. Request a new code and try again.");
      } else if (failure?.status === 429) {
        setError("Too many attempts. Wait a minute and try again.");
      } else if (failure?.code === "captcha_failed") {
        setError("The bot check expired. Complete it again and retry.");
      } else {
        setError("Password recovery is temporarily unavailable. Try again shortly.");
      }
    } finally {
      if (stage === "request") {
        setCaptchaToken("");
        captchaRef.current?.reset();
      }
      setBusy(false);
      inFlight.current = false;
    }
  }

  const requesting = stage === "request";

  return (
    <main id="main-content" tabIndex={-1} className="mx-auto flex min-h-[70dvh] w-full max-w-md items-start px-4 pb-12 pt-28 sm:px-6 sm:pt-32">
      <section className="w-full rounded-lg border border-surface-variant bg-surface/90 p-5 text-on-surface backdrop-blur-md sm:p-8" aria-labelledby="recovery-title">
        <h1 id="recovery-title" className="font-headline-editorial text-3xl sm:text-4xl">
          {stage === "done" ? "Password updated" : "Reset your password"}
        </h1>
        {stage === "done" ? (
          <p className="mt-3 text-sm text-text-secondary" role="status">You can sign in with your new password.</p>
        ) : (
          <>
            {requesting && <p className="mt-3 text-sm text-text-secondary">Enter the email you use for ScoutIt.</p>}
            {stage === "code" && <p className="mt-3 text-sm text-text-secondary" role="status">
              {sent ? "If a ScoutIt account exists for that address, check your inbox and spam folder for a reset code." : "Enter the code from your ScoutIt email and choose a new password."}
            </p>}
            <form method="post" onSubmit={submit} className="mt-5 space-y-4" key={requesting ? "request" : "change"}>
              <fieldset disabled={busy} className="space-y-4">
                {stage !== "verified" && <label className="block space-y-1 text-sm font-semibold">
                  <span>Email address</span>
                  <input className={inputClass} type="email" autoComplete="email" required maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} />
                </label>}
                {requesting && <TurnstileGate ref={captchaRef} action="password-recovery" onToken={setCaptchaToken} onError={setError} />}
                {stage === "code" && <label className="block space-y-1 text-sm font-semibold">
                  <span>Reset code</span>
                  <input className={inputClass} name="code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6,10}" maxLength={10} required />
                </label>}
                {!requesting && <div key="password-fields" className="space-y-4">
                  <label className="block space-y-1 text-sm font-semibold">
                    <span>New password</span>
                    <input className={inputClass} name="password" type="password" autoComplete="new-password" minLength={8} maxLength={128} required />
                  </label>
                  <label className="block space-y-1 text-sm font-semibold">
                    <span>Confirm new password</span>
                    <input className={inputClass} name="confirmPassword" type="password" autoComplete="new-password" minLength={8} maxLength={128} required />
                  </label>
                </div>}
                <button type="submit" disabled={requesting && !captchaToken} className="min-h-11 w-full rounded bg-gold-accent px-4 py-3 font-mono text-xs font-bold uppercase tracking-wider text-background hover:bg-gold-bright disabled:opacity-50">
                  {busy ? "Please wait…" : requesting ? "Email a reset code" : "Save new password"}
                </button>
              </fieldset>
            </form>
            {stage !== "request" && <button type="button" disabled={busy} className={linkClass} onClick={startOver}>Request a new code</button>}
          </>
        )}
        {error && <p className="mt-3 text-sm text-error" role="alert">{error}</p>}
        <div className="mt-2 flex flex-wrap items-center gap-x-5 text-sm">
          <Link href="/onboarding" className={linkClass}>Back to sign-in</Link>
          {requesting && <button type="button" disabled={busy} className={linkClass} onClick={() => { setError(""); setStage("code"); }}>I have a code</button>}
        </div>
      </section>
    </main>
  );
}
