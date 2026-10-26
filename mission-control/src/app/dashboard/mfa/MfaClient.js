"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { recordMfaAuditEvent } from "./actions";
import { ShieldCheck, ShieldAlert, KeyRound, Copy, Check, RefreshCw, Smartphone } from "lucide-react";

export default function MfaClient({ initialPosture }) {
  const router = useRouter();
  const [posture, setPosture] = useState(initialPosture);
  const [factors, setFactors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [copied, setCopied] = useState(false);
  const [, startTransition] = useTransition();

  // Enrollment state
  const [enrollmentData, setEnrollmentData] = useState(null); // { id, type, totp: { qr_code, secret, uri } }
  const [verifyCode, setVerifyCode] = useState("");

  // Step-up challenge state for already-enrolled factors
  const [challengeCode, setChallengeCode] = useState("");

  const loadFactors = async () => {
    try {
      if (!supabase?.auth?.mfa?.listFactors) return;
      const { data, error: factorErr } = await supabase.auth.mfa.listFactors();
      if (!factorErr && data) {
        setFactors(data.totp || []);
      }
    } catch (err) {
      console.warn("Could not list MFA factors:", err);
    }
  };

  useEffect(() => {
    loadFactors();
  }, []);

  const handleStartEnrollment = async () => {
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      const { data, error: enrollErr } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: `Staff Authenticator (${posture.email})`,
      });

      if (enrollErr) throw enrollErr;
      setEnrollmentData(data);
      await recordMfaAuditEvent({ action: "enroll_initiated", factorId: data.id });
    } catch (err) {
      setError(err.message || "Failed to initiate TOTP enrollment.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyEnrollment = async (e) => {
    e.preventDefault();
    if (!verifyCode || verifyCode.trim().length !== 6) {
      setError("Please enter a valid 6-digit verification code.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const cleanCode = verifyCode.trim();
      const { data: challengeData, error: chalErr } = await supabase.auth.mfa.challenge({
        factorId: enrollmentData.id,
      });
      if (chalErr) throw chalErr;

      const { error: verifyErr } = await supabase.auth.mfa.verify({
        factorId: enrollmentData.id,
        challengeId: challengeData.id,
        code: cleanCode,
      });
      if (verifyErr) throw verifyErr;

      await recordMfaAuditEvent({
        action: "enroll_completed",
        factorId: enrollmentData.id,
        reason: "Initial enrollment verified",
      });

      setSuccess("TOTP Authenticator successfully configured! Your session is now verified at AAL2.");
      setEnrollmentData(null);
      setVerifyCode("");
      await loadFactors();
      startTransition(() => {
        router.refresh();
      });
    } catch (err) {
      setError(err.message || "Verification code was invalid or expired. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleStepUpChallenge = async (e) => {
    e.preventDefault();
    if (!challengeCode || challengeCode.trim().length !== 6) {
      setError("Please enter your 6-digit TOTP code.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const activeFactor = factors[0];
      if (!activeFactor) throw new Error("No active TOTP factor found on account.");

      const { data: challengeData, error: chalErr } = await supabase.auth.mfa.challenge({
        factorId: activeFactor.id,
      });
      if (chalErr) throw chalErr;

      const { error: verifyErr } = await supabase.auth.mfa.verify({
        factorId: activeFactor.id,
        challengeId: challengeData.id,
        code: challengeCode.trim(),
      });
      if (verifyErr) throw verifyErr;

      await recordMfaAuditEvent({
        action: "session_stepup",
        factorId: activeFactor.id,
        reason: "TOTP session step-up to AAL2",
      });

      setSuccess("Session stepped up to AAL2. High-assurance privileges are now unlocked.");
      setChallengeCode("");
      setPosture((prev) => ({ ...prev, aal: "aal2", mfaRequired: false }));
      startTransition(() => {
        router.refresh();
      });
    } catch (err) {
      setError(err.message || "Invalid TOTP code. Verify device clock synchronization and retry.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopySecret = (secret) => {
    navigator.clipboard.writeText(secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isAal2 = posture.aal === "aal2";

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Posture Overview Card */}
      <div className="p-6 rounded-xl border border-line bg-surface">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono uppercase tracking-wider text-white/60">
                Staff Identity & Access Assurance
              </span>
              <span
                className={`px-2 py-0.5 rounded text-xs font-mono uppercase tracking-wider ${
                  isAal2
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                    : "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                }`}
              >
                {isAal2 ? "AAL2 — MFA Verified" : "AAL1 — Single Factor Only"}
              </span>
            </div>
            <h2 className="text-xl font-medium tracking-tight text-white mt-1">
              Multi-Factor Authentication (MFA)
            </h2>
            <p className="text-sm text-white/60 mt-1">
              Ops Manager (Tier 2) and Super Admin (Tier 3) require Time-based One-Time Password (TOTP)
              multi-factor verification to execute operational mutations.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-xs text-white/60 uppercase font-mono">Assigned Tier</div>
              <div className="text-sm font-mono text-gold">Tier {posture.tier}</div>
            </div>
            <div
              className={`p-3 rounded-lg border ${
                isAal2 ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-400" : "border-amber-500/20 bg-amber-500/5 text-amber-400"
              }`}
            >
              {isAal2 ? <ShieldCheck className="w-6 h-6" /> : <ShieldAlert className="w-6 h-6" />}
            </div>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 text-xs font-mono">
            {error}
          </div>
        )}

        {success && (
          <div className="mt-4 p-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs font-mono">
            {success}
          </div>
        )}
      </div>

      {/* Main Action Area */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Step-up Challenge Card (When enrolled but session is AAL1) */}
        {!isAal2 && factors.length > 0 && !enrollmentData && (
          <div className="p-6 rounded-xl border border-line bg-surface md:col-span-2">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg border border-gold/30 bg-gold/10 text-gold">
                <KeyRound className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <span className="text-xs font-mono uppercase tracking-wider text-gold">
                  Session Step-Up Required
                </span>
                <h3 className="text-base font-medium text-white mt-1">
                  Enter Authenticator TOTP Code
                </h3>
                <p className="text-xs text-white/60 mt-1">
                  Your account has an enrolled authenticator app. Enter the 6-digit code to step up this session to AAL2.
                </p>

                <form onSubmit={handleStepUpChallenge} className="mt-4 flex flex-wrap items-center gap-3">
                  <input
                    type="text"
                    maxLength={6}
                    value={challengeCode}
                    onChange={(e) => setChallengeCode(e.target.value.replace(/\D/g, ""))}
                    placeholder="000000"
                    className="w-36 px-4 py-2 bg-black/60 border border-line rounded-lg text-center font-mono text-lg tracking-widest text-white focus:outline-none focus:border-gold"
                    autoFocus
                  />
                  <button
                    type="submit"
                    disabled={loading || challengeCode.length !== 6}
                    className="px-5 py-2.5 rounded-lg bg-gold text-black font-medium text-xs uppercase tracking-wider hover:bg-gold/90 transition-colors disabled:opacity-50"
                  >
                    {loading ? "Verifying..." : "Verify Session"}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Enrollment Card */}
        <div className="p-6 rounded-xl border border-line bg-surface flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Smartphone className="w-4 h-4 text-gold" />
              <span className="text-xs font-mono uppercase tracking-wider text-white/60">
                Authenticator App Setup
              </span>
            </div>
            <h3 className="text-base font-medium text-white">TOTP Factor Management</h3>
            <p className="text-xs text-white/60 mt-1">
              Supports Google Authenticator, 1Password, Bitwarden, Apple Passwords, or Authy.
            </p>

            {factors.length > 0 && !enrollmentData && (
              <div className="mt-4 space-y-2">
                <div className="text-xs font-mono uppercase tracking-wider text-white/60">Enrolled Devices</div>
                {factors.map((factor) => (
                  <div key={factor.id} className="p-3 rounded-lg border border-line/60 bg-black/30 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-mono text-white/90">{factor.friendly_name || "Authenticator Device"}</div>
                      <div className="text-xs text-white/60 font-mono">Factor ID: {factor.id.slice(0, 12)}...</div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-xs font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      Active
                    </span>
                  </div>
                ))}
              </div>
            )}

            {enrollmentData && (
              <div className="mt-4 p-4 rounded-lg border border-gold/30 bg-black/50 space-y-4">
                <div className="text-xs text-white/80">
                  Scan this QR code with your authenticator app, or manually copy the secret key below:
                </div>

                {enrollmentData.totp.qr_code && (
                  <div className="flex justify-center p-3 bg-white rounded-lg w-fit mx-auto">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={enrollmentData.totp.qr_code}
                      alt="TOTP QR Code"
                      className="w-40 h-40"
                    />
                  </div>
                )}

                <div>
                  <div className="text-xs font-mono uppercase tracking-wider text-white/60 mb-1">
                    Secret Key (Manual Entry)
                  </div>
                  <div className="flex items-center justify-between gap-2 p-2 rounded bg-black/80 border border-line">
                    <code className="text-xs font-mono text-gold break-all">
                      {enrollmentData.totp.secret}
                    </code>
                    <button
                      type="button"
                      onClick={() => handleCopySecret(enrollmentData.totp.secret)}
                      className="p-1.5 rounded hover:bg-white/10 text-white/70 hover:text-white transition-colors"
                      title="Copy Secret"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <form onSubmit={handleVerifyEnrollment} className="pt-2 border-t border-line/60 space-y-3">
                  <label className="block text-xs font-mono uppercase tracking-wider text-white/70">
                    Enter 6-digit confirmation code:
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="text"
                      maxLength={6}
                      value={verifyCode}
                      onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ""))}
                      placeholder="000000"
                      className="w-32 px-3 py-1.5 bg-black/70 border border-line rounded text-center font-mono text-sm tracking-widest text-white focus:outline-none focus:border-gold"
                    />
                    <button
                      type="submit"
                      disabled={loading || verifyCode.length !== 6}
                      className="px-4 py-2 rounded bg-gold text-black text-xs font-medium uppercase tracking-wider hover:bg-gold/90 transition-colors disabled:opacity-50"
                    >
                      {loading ? "Activating..." : "Confirm & Activate"}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-line flex items-center justify-between">
            {!enrollmentData && (
              <button
                type="button"
                onClick={handleStartEnrollment}
                disabled={loading}
                className="px-4 py-2 rounded-lg border border-line hover:border-gold/50 bg-black/40 text-xs font-mono text-white/80 hover:text-white transition-colors"
              >
                {factors.length > 0 ? "+ Enroll New Factor" : "Setup Authenticator App"}
              </button>
            )}
            <button
              type="button"
              onClick={loadFactors}
              className="p-2 rounded text-white/60 hover:text-white/80 transition-colors ml-auto"
              title="Refresh factors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Security Runbook & Break-Glass Card */}
        <div className="p-6 rounded-xl border border-line bg-surface flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <ShieldAlert className="w-4 h-4 text-gold" />
              <span className="text-xs font-mono uppercase tracking-wider text-white/60">
                Governance & Recovery
              </span>
            </div>
            <h3 className="text-base font-medium text-white">Emergency Break-Glass SOP</h3>
            <p className="text-xs text-white/60 mt-1 leading-relaxed">
              If an authenticator device is lost, damaged, or desynchronized:
            </p>

            <ul className="mt-4 space-y-2.5 text-xs text-white/70">
              <li className="flex items-start gap-2">
                <span className="text-gold font-mono">01.</span>
                <span>Secondary channel out-of-band identity attestation is required.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-gold font-mono">02.</span>
                <span>Super Admin deletes the factor via the Supabase Admin API or break-glass SQL.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-gold font-mono">03.</span>
                <span>Every factor removal emits an immutable record in <code className="text-gold font-mono text-xs">mission_control_actions</code>.</span>
              </li>
            </ul>
          </div>

          <div className="mt-6 pt-4 border-t border-line">
            <span className="text-xs font-mono text-white/60">
              Ref: <code className="text-white/60">_SCOUTIT_BRAIN/02_ARCHITECTURE_AND_STRUCTURE/STAFF_MFA_RECOVERY_RUNBOOK.md</code>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
