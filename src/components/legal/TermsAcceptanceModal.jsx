"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

/**
 * Clickwrap Terms Acceptance Modal
 * Mandated under Philippine E-Commerce Act (RA 8792) and DPA (RA 10173).
 * Captures explicit assent before user profile activation.
 */
export default function TermsAcceptanceModal({ user, onAccepted }) {
  const [loading, setLoading] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState(null);

  if (!user) return null;

  async function handleAccept() {
    if (!agreed) {
      setError("You must check the box to agree to the Terms of Service and Privacy Policy.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const timestamp = new Date().toISOString();
      const termsVersion = "1.0-20261024";

      const { error: updateError } = await supabase
        .from("user_profiles")
        .update({
          terms_accepted_at: timestamp,
          terms_version: termsVersion,
          updated_at: timestamp,
        })
        .eq("id", user.id);

      if (updateError) {
        throw updateError;
      }

      if (onAccepted) onAccepted();
    } catch (err) {
      console.error("[TermsAcceptanceModal] Acceptance record failed:", err);
      setError("Failed to record acceptance. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-xl border border-[var(--accent-muted)] bg-[#121212] p-6 shadow-2xl text-[#f0f0f0]">
        <div className="mb-4 flex items-center justify-between border-b border-[#262626] pb-3">
          <span className="font-mono text-xs uppercase tracking-widest text-[var(--accent)]">
            STATUTORY ASSENT // RA 8792
          </span>
          <span className="font-mono text-xs text-[#888888]">v1.0 Compliance</span>
        </div>

        <h2 className="text-xl font-bold tracking-tight text-white mb-2">
          Terms of Service & Privacy Agreement
        </h2>

        <p className="text-sm text-[#cccccc] leading-relaxed mb-4">
          Before continuing on ScoutIt, you must review and accept our updated Terms of Service and Privacy Policy governed under Philippine law (RA 9646, RA 10173, RA 8792).
        </p>

        <div className="mb-4 rounded-lg bg-[#1a1a1a] p-3 text-xs text-[#a0a0a0] space-y-2 border border-[#2a2a2a]">
          <p>
            <strong className="text-white">Core Operational Principles:</strong>
          </p>
          <ul className="list-disc list-inside space-y-1">
            <li>Intelligence First. Transactions Never (RA 9646 Host Isolation).</li>
            <li>Connects are digital utility access credits, non-refundable upon delivery (RA 7394).</li>
            <li>Verification means Procedural Document Extraction matching, not title/appraisal warranty.</li>
            <li>You attest that you are 18 years of age or older (Civil Code Art. 1327).</li>
          </ul>
        </div>

        <div className="mb-6 flex items-start gap-3">
          <input
            type="checkbox"
            id="accept-terms-checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-1 h-4 w-4 rounded border-gray-700 bg-black text-[var(--accent)] focus:ring-[var(--accent)] cursor-pointer"
          />
          <label htmlFor="accept-terms-checkbox" className="text-xs text-[#cccccc] leading-normal cursor-pointer select-none">
            I have read, understood, and agree to the{" "}
            <Link href="/terms" target="_blank" className="text-[var(--accent-bright)] underline hover:text-[var(--accent)]">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy" target="_blank" className="text-[var(--accent-bright)] underline hover:text-[var(--accent)]">
              Privacy Policy
            </Link>.
          </label>
        </div>

        {error && (
          <div className="mb-4 rounded bg-red-900/30 p-2.5 text-xs text-red-300 border border-red-800/50">
            {error}
          </div>
        )}

        <button
          onClick={handleAccept}
          disabled={loading || !agreed}
          className="w-full rounded-lg bg-[var(--accent-bright)] py-2.5 px-4 font-mono text-xs uppercase tracking-widest font-bold text-black transition-all hover:bg-[var(--accent)] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Recording Assent..." : "Accept & Proceed"}
        </button>
      </div>
    </div>
  );
}
