"use client";

import React, { useState, useEffect } from "react";
import { ShieldCheck, Award, FileCheck, Copy, Check, Lock, ChevronDown, ChevronUp } from "lucide-react";
import { generateResidentPassport, PASSPORT_SCOPES } from "@/lib/scoring/residentPassport";

/**
 * ═══════════════════════════════════════════════════════════════════════
 * A-182: RESIDENT PASSPORT HUD CARD (LUXURY DARK UI)
 * ═══════════════════════════════════════════════════════════════════════
 *
 * Displays the verified Resident Passport & Tenancy Credential on user
 * profiles and dashboards.
 *
 * Enforces:
 * - Honest Blank Rule: Shows neutral "[First-Time Verified Seeker]" badge
 *   without penalizing new users with artificial 0% or 0/5 grades.
 * - Consented Selective Disclosure (RA 10173): User controls when to generate
 *   and attach verified credentials to specific inquiries/deals.
 * - ScoutIt Dark-Luxury Design DNA: 95% black, amber gold accents, mono metrics.
 */
export default function ResidentPassportCard({
  userProfile = {},
  transactionCount = 0,
  reviews = [],
  activeDealId = null,
}) {
  const [showVectors, setShowVectors] = useState(false);
  const [copiedConsent, setCopiedConsent] = useState(false);
  const [remotePassport, setRemotePassport] = useState(null);

  // If explicit props are provided, use in-memory generation; otherwise fetch from live API
  const hasExplicitProps = Boolean(
    userProfile && (userProfile.id || userProfile.full_name || transactionCount > 0 || reviews.length > 0)
  );

  useEffect(() => {
    if (hasExplicitProps) return;
    let cancelled = false;

    fetch("/api/user/resident-passport?scope=consented_application")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data?.passport) {
          setRemotePassport(data.passport);
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [hasExplicitProps]);

  // Generate private passport summary (or use remote live data)
  const passport = remotePassport || generateResidentPassport({
    userProfile,
    transactionCount,
    reviews,
    scope: PASSPORT_SCOPES.CONSENTED_APPLICATION,
    consentedTargetDealId: activeDealId,
  });

  const handleCopyConsentedToken = async () => {
    const shareablePayload = {
      type: "SCOUTIT_RESIDENT_PASSPORT",
      badge: passport.displayBadge,
      tier: passport.tier,
      isHonestBlank: passport.isHonestBlank,
      verifiedTransactions: passport.verifiedTransactions,
      compositeScore: passport.compositeScore,
      vectorBreakdown: passport.vectorBreakdown,
      kycVerified: passport.isKycVerified,
      consentedDealId: activeDealId || "direct_inquiry",
      timestamp: new Date().toISOString(),
      statute: "RA 10173 Consented Tenant Credential",
    };

    try {
      await navigator.clipboard.writeText(JSON.stringify(shareablePayload, null, 2));
      setCopiedConsent(true);
      setTimeout(() => setCopiedConsent(false), 2500);
    } catch {
      // clipboard fallback
    }
  };

  return (
    <div className="w-full bg-surface border border-surface-variant rounded-lg p-5 flex flex-col gap-4 shadow-xl">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-surface-variant pb-3">
        <div className="flex items-center gap-2.5">
          <ShieldCheck size={18} className="text-gold-accent shrink-0" />
          <span className="font-mono text-xs uppercase tracking-widest text-gold-accent font-bold">
            Resident Passport & Trust Credential
          </span>
        </div>
        <div className="flex items-center gap-2">
          {passport.isKycVerified && (
            <span className="px-2 py-0.5 rounded bg-surface-alt border border-surface-variant text-[12px] font-mono text-text-secondary">
              KYC Verified
            </span>
          )}
          <span className="px-2.5 py-0.5 rounded bg-surface-alt border border-gold-accent/30 text-[12px] font-mono text-gold-accent font-semibold">
            {passport.displayBadge}
          </span>
        </div>
      </div>

      {/* Main Metric Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3 bg-surface-alt rounded border border-surface-variant flex flex-col gap-1">
          <span className="font-mono text-[12px] text-text-secondary uppercase">Standing Tier</span>
          <span className="font-headline-editorial text-sm font-bold text-on-surface">
            {passport.isHonestBlank ? "First-Time Seeker" : passport.tier.replace("TIER_", "")}
          </span>
        </div>

        <div className="p-3 bg-surface-alt rounded border border-surface-variant flex flex-col gap-1">
          <span className="font-mono text-[12px] text-text-secondary uppercase">Verified Transactions</span>
          <span className="font-mono text-sm font-bold text-on-surface">
            {passport.verifiedTransactions} Handshake Closures
          </span>
        </div>

        <div className="p-3 bg-surface-alt rounded border border-surface-variant flex flex-col gap-1">
          <span className="font-mono text-[12px] text-text-secondary uppercase">Behavioral Index</span>
          <span className="font-mono text-sm font-bold text-gold-accent">
            {passport.isHonestBlank ? "Honest Blank [Neutral]" : `${passport.compositeScore} / 100`}
          </span>
        </div>
      </div>

      {/* Honest Blank vs Verified Vector Details */}
      {passport.isHonestBlank ? (
        <div className="p-3.5 bg-surface-alt/70 border border-surface-variant rounded flex items-start gap-3">
          <Award size={18} className="text-gold-accent shrink-0 mt-0.5" />
          <div className="flex flex-col gap-1">
            <span className="text-xs font-mono text-on-surface font-semibold">
              Honest Blank Onboarding Rule Active
            </span>
            <p className="text-xs text-text-secondary leading-relaxed">
              First-time luxury seekers are never penalized or graded with an artificial 0/5 score. Your verified identity and completed inquiries will establish your authentic Resident Passport over time.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => setShowVectors(!showVectors)}
            className="flex items-center justify-between py-2 text-xs font-mono text-gold-accent hover:text-gold-bright transition"
          >
            <span>{showVectors ? "Hide Verified Vector Vectors" : "View Verified Tenancy Vector Vectors"}</span>
            {showVectors ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          {showVectors && passport.vectorBreakdown && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 p-3.5 bg-surface-alt rounded border border-surface-variant">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-text-secondary">Payment Punctuality</span>
                <span className="text-on-surface font-bold">{passport.vectorBreakdown.payment_punctuality} / 5.0</span>
              </div>
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-text-secondary">Space Care & Maintenance</span>
                <span className="text-on-surface font-bold">{passport.vectorBreakdown.space_care_maintenance} / 5.0</span>
              </div>
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-text-secondary">Communication & Conduct</span>
                <span className="text-on-surface font-bold">{passport.vectorBreakdown.communication_conduct} / 5.0</span>
              </div>
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-text-secondary">Covenant Adherence</span>
                <span className="text-on-surface font-bold">{passport.vectorBreakdown.lease_covenant_adherence} / 5.0</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* RA 10173 Consented Disclosure Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-surface-variant text-[12px] font-mono text-text-secondary">
        <div className="flex items-center gap-2">
          <Lock size={12} className="text-gold-accent shrink-0" />
          <span>RA 10173 Protected · Not searchable on open web</span>
        </div>

        <button
          type="button"
          onClick={handleCopyConsentedToken}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-surface-alt border border-surface-variant hover:border-gold-accent text-on-surface hover:text-gold-accent transition"
        >
          {copiedConsent ? (
            <>
              <Check size={12} className="text-success" />
              <span>Consent Token Copied</span>
            </>
          ) : (
            <>
              <Copy size={12} />
              <span>Copy Consented Passport Token</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
