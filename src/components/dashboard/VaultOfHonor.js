"use client";

import { useState, useEffect, useCallback } from "react";
import { Lock, ArrowRightLeft, ShieldCheck, Sparkles, X, AlertCircle, CheckCircle2 } from "lucide-react";
import { BADGE_REGISTRY } from "@/lib/badges";
import { formatCharterSeatLabel, PIONEER_PERKS } from "@/lib/BadgeEngine";
import { supabase } from "@/lib/supabaseClient";
import InfoTip from "@/components/ui/InfoTip";

export default function VaultOfHonor() {
  const [unlockedBadges, setUnlockedBadges] = useState([]);
  const [userBadgesData, setUserBadgesData] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Transfer Modal State
  const [transferTarget, setTransferTarget] = useState(null);
  const [recipientInput, setRecipientInput] = useState("");
  const [transferConfirmed, setTransferConfirmed] = useState(false);
  const [transferSubmitting, setTransferSubmitting] = useState(false);
  const [transferFeedback, setTransferFeedback] = useState(null);

  // Application Modal State
  const [applyModalBadge, setApplyModalBadge] = useState(null);
  const [applicantName, setApplicantName] = useState("");
  const [applicantOrg, setApplicantOrg] = useState("");
  const [proofReference, setProofReference] = useState("");
  const [statement, setStatement] = useState("");
  const [applySubmitting, setApplySubmitting] = useState(false);
  const [applyFeedback, setApplyFeedback] = useState(null);

  const loadBadges = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: rows, error } = await supabase
          .from("user_badges")
          .select("badge_id, seat_number, is_transferable, transfer_locked_until, earned_at")
          .eq("user_id", session.user.id);

        if (!error && Array.isArray(rows)) {
          setUserBadgesData(rows);
          setUnlockedBadges(rows.map((r) => r.badge_id));
          return;
        }
      }

      // Dev-toolbox mock user fallback
      const userStr = typeof window !== "undefined" ? localStorage.getItem("scoutit_user") : null;
      if (userStr) {
        const user = JSON.parse(userStr);
        const badges = Array.isArray(user?.badges) ? user.badges : [];
        setUserBadgesData(badges);
        setUnlockedBadges(badges.map((b) => b.id || b.badge_id));
      }
    } catch (err) {
      console.warn("[VaultOfHonor] badge load error:", err?.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isLoaded) {
      loadBadges();
    }
  }, [isLoaded, loadBadges]);

  const handleOpenTransfer = (badge, badgeData) => {
    setTransferTarget({ badge, badgeData });
    setRecipientInput("");
    setTransferConfirmed(false);
    setTransferFeedback(null);
  };

  const handleCloseTransfer = () => {
    setTransferTarget(null);
    setRecipientInput("");
    setTransferConfirmed(false);
    setTransferFeedback(null);
  };

  const handleExecuteTransfer = async (e) => {
    e.preventDefault();
    if (!transferTarget || !recipientInput.trim() || !transferConfirmed) return;

    setTransferSubmitting(true);
    setTransferFeedback(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        setTransferFeedback({ type: "error", message: "Please sign in to execute a charter transfer." });
        setTransferSubmitting(false);
        return;
      }

      const res = await fetch("/api/badges/transfer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          badgeId: transferTarget.badge.id,
          recipientInput: recipientInput.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setTransferFeedback({
          type: "error",
          message: data.error || "Failed to transfer charter. Please verify recipient qualification.",
        });
      } else {
        setTransferFeedback({
          type: "success",
          message: data.message || `Charter successfully transferred to ${data.recipientEmail || "recipient"}!`,
        });
        await loadBadges();
        setTimeout(() => {
          handleCloseTransfer();
        }, 2200);
      }
    } catch (err) {
      setTransferFeedback({
        type: "error",
        message: err.message || "Network error while transferring charter.",
      });
    } finally {
      setTransferSubmitting(false);
    }
  };

  const handleOpenApply = (badge) => {
    setApplyModalBadge(badge);
    setApplicantName("");
    setApplicantOrg("");
    setProofReference("");
    setStatement("");
    setApplyFeedback(null);
  };

  const handleCloseApply = () => {
    setApplyModalBadge(null);
    setApplicantName("");
    setApplicantOrg("");
    setProofReference("");
    setStatement("");
    setApplyFeedback(null);
  };

  const handleExecuteApply = async (e) => {
    e.preventDefault();
    if (!applyModalBadge) return;

    setApplySubmitting(true);
    setApplyFeedback(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        setApplyFeedback({ type: "error", message: "Please sign in to submit a charter dossier." });
        setApplySubmitting(false);
        return;
      }

      const res = await fetch("/api/badges/apply", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          badgeId: applyModalBadge.id,
          fullName: applicantName.trim(),
          organization: applicantOrg.trim(),
          licenseNumber: proofReference.trim(),
          statement: statement.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setApplyFeedback({
          type: "error",
          message: data.error || "Failed to submit charter application.",
        });
      } else {
        setApplyFeedback({
          type: "success",
          message: data.message || "Charter dossier submitted! Mission Control staff will review your application.",
        });
        setTimeout(() => {
          handleCloseApply();
        }, 2500);
      }
    } catch (err) {
      setApplyFeedback({
        type: "error",
        message: err.message || "Network error while submitting dossier.",
      });
    } finally {
      setApplySubmitting(false);
    }
  };

  return (
    <div className="w-full mb-12 animate-[fadeIn_0.5s_ease-out]">
      <div className="flex items-end justify-between mb-6">
        <div>
          <h2 className="font-headline-editorial text-2xl text-on-surface flex flex-wrap items-center gap-3">
            <span>
              Milestones & Achievements <InfoTip tipId="vaultMilestones" label="About milestones and achievements" />
            </span>
            <span className="font-label-caps tracking-widest text-[12px] text-gold-accent px-2 py-1 bg-gold-accent/10 border border-gold-accent/30 rounded">
              {unlockedBadges.length} / {BADGE_REGISTRY.length} UNLOCKED
            </span>
          </h2>
          <p className="text-sm text-text-secondary mt-1">
            Badges and Pioneer Charters you earn appear here. Pioneer Charters are strictly 1 per verified account.
          </p>
        </div>
      </div>

      {!isLoaded ? (
        <button
          type="button"
          onClick={() => setIsLoaded(true)}
          className="w-full rounded-xl border border-surface-variant hover:border-gold-accent/50 bg-background py-10 flex flex-col items-center justify-center gap-2 transition group"
        >
          <span className="font-label-caps tracking-widest text-[12px] text-gold-accent group-hover:text-gold-accent-bright">
            Tap to Load
          </span>
          <span className="text-sm text-text-secondary">View your milestones & achievements</span>
        </button>
      ) : (
        <div className="space-y-6">
          {isLoading && (
            <p className="text-xs font-mono uppercase tracking-widest text-text-muted">
              Syncing Vault ledger...
            </p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {BADGE_REGISTRY.map((badge) => {
              const isUnlocked = unlockedBadges.includes(badge.id);
              const badgeData = userBadgesData.find((b) => (b.badge_id || b.id) === badge.id);
              const Icon = badge.icon;
              const seatLabel = badgeData?.seat_number ? formatCharterSeatLabel(badgeData.seat_number) : null;
              const perks = PIONEER_PERKS[badge.id] || null;
              const isTransferable = Boolean(badgeData?.is_transferable);

              return (
                <div
                  key={badge.id}
                  className={`relative group rounded-xl border p-5 flex flex-col text-center transition duration-200 overflow-hidden min-h-[240px] justify-between ${
                    isUnlocked
                      ? "bg-gradient-to-b from-surface-alt to-background border-gold-accent/40 hover:border-gold-accent shadow-[0_0_15px_rgba(var(--accent-rgb),0.05)] hover:shadow-[0_0_25px_rgba(var(--accent-rgb),0.15)]"
                      : "bg-background border-surface-variant hover:border-surface-variant/80"
                  }`}
                >
                  {/* Background Glow for Unlocked */}
                  {isUnlocked && (
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-gold-accent/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"></div>
                  )}

                  {/* Header Row: Seat & Rarity */}
                  <div className="relative z-10 w-full flex items-center justify-between text-left mb-3">
                    <span className="font-label-caps text-[12px] tracking-widest uppercase text-gold-accent">
                      {badge.rarity}
                    </span>
                    {seatLabel && (
                      <span className="font-mono text-[12px] uppercase tracking-wider px-2 py-0.5 rounded border border-accent text-accent bg-accent/10">
                        {seatLabel}
                      </span>
                    )}
                  </div>

                  {/* Icon Container */}
                  <div className="relative z-10 w-full flex flex-col items-center">
                    <div
                      className={`relative w-14 h-14 mb-3 flex items-center justify-center transition-transform duration-200 ${
                        isUnlocked ? "group-hover:scale-105" : ""
                      }`}
                    >
                      <div
                        className={`absolute inset-0 rounded-full border-2 border-dashed ${
                          isUnlocked ? "border-gold-accent animate-[spin_10s_linear_infinite]" : "border-surface-variant"
                        }`}
                      ></div>
                      <div
                        className={`absolute inset-1 rounded-full flex items-center justify-center ${
                          isUnlocked ? "bg-surface border border-gold-accent/50" : "bg-background"
                        }`}
                      >
                        <Icon
                          strokeWidth={isUnlocked ? 1.5 : 1}
                          size="1.4em"
                          className={`transition duration-200 ${
                            isUnlocked
                              ? "text-gold-accent drop-shadow-[0_0_8px_rgba(var(--accent-rgb),0.6)]"
                              : "text-surface-alt"
                          }`}
                        />
                      </div>
                      {!isUnlocked && (
                        <div className="absolute inset-0 flex items-center justify-center bg-background/50 rounded-full backdrop-blur-[1px]">
                          <Lock size="1em" className="text-text-muted" strokeWidth={1.5} />
                        </div>
                      )}
                    </div>

                    <h3 className={`font-working-title text-sm mb-1 ${isUnlocked ? "text-on-surface" : "text-text-muted"}`}>
                      {badge.name}
                    </h3>

                    <div
                      className={`text-[12px] leading-relaxed transition duration-300 mb-3 ${
                        isUnlocked
                          ? "text-text-secondary"
                          : "text-text-muted/60 group-hover:text-text-secondary"
                      }`}
                    >
                      {isUnlocked ? badge.description : badge.unlockCondition}
                    </div>

                    {/* Operational Perks Badges (if pioneer) */}
                    {isUnlocked && perks && (
                      <div className="w-full pt-2 border-t border-border flex flex-wrap justify-center gap-1 mb-2">
                        {perks.queue_priority && (
                          <span className="font-mono text-[12px] uppercase px-1.5 py-0.5 rounded border border-accent-muted bg-surface2 text-accent">
                            Queue Priority
                          </span>
                        )}
                        {perks.rate_lock_percent && (
                          <span className="font-mono text-[12px] uppercase px-1.5 py-0.5 rounded border border-accent-muted bg-surface2 text-accent">
                            {perks.rate_lock_percent}% Rate Lock
                          </span>
                        )}
                        {perks.white_label_pdf && (
                          <span className="font-mono text-[12px] uppercase px-1.5 py-0.5 rounded border border-border bg-surface2 text-text-secondary">
                            White-Label PDF
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions Row */}
                  <div className="relative z-10 w-full pt-2 mt-auto">
                    {isUnlocked && isTransferable ? (
                      <button
                        type="button"
                        onClick={() => handleOpenTransfer(badge, badgeData)}
                        className="w-full py-2 px-3 rounded border border-accent-muted hover:border-accent bg-surface2 hover:bg-surface text-accent font-mono text-[12px] uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors min-h-[44px]"
                      >
                        <ArrowRightLeft size={14} />
                        <span>Transfer Charter</span>
                      </button>
                    ) : !isUnlocked && badge.isPioneer ? (
                      <button
                        type="button"
                        onClick={() => handleOpenApply(badge)}
                        className="w-full py-2 px-3 rounded border border-border hover:border-accent-muted bg-surface hover:bg-surface2 text-text-secondary hover:text-text-primary font-mono text-[12px] uppercase tracking-wider transition-colors min-h-[44px]"
                      >
                        Apply for Charter →
                      </button>
                    ) : null}
                  </div>

                  {/* Scanline Effect on Locked */}
                  {!isUnlocked && (
                    <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_50%,rgba(var(--bg-rgb),0.5)_50%)] bg-[length:100%_4px] opacity-10 pointer-events-none mix-blend-overlay"></div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TRANSFER CHARTER MODAL */}
      {transferTarget && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
          <div className="relative w-full max-w-lg bg-surface border border-accent-muted rounded-2xl p-6 shadow-2xl text-left">
            <button
              type="button"
              onClick={handleCloseTransfer}
              className="absolute top-4 right-4 p-2 text-text-muted hover:text-text-primary rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Close transfer modal"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-2 mb-2 text-accent font-mono text-xs uppercase tracking-widest">
              <ArrowRightLeft size={16} />
              <span>Permanent Charter Transfer</span>
            </div>

            <h3 className="font-headline-editorial text-xl text-text-primary mb-2">
              Transfer {transferTarget.badge.name}
            </h3>

            {transferTarget.badgeData?.seat_number && (
              <p className="font-mono text-xs text-accent mb-4">
                {formatCharterSeatLabel(transferTarget.badgeData.seat_number)}
              </p>
            )}

            <div className="p-3.5 rounded-xl border border-red-500/30 bg-red-950/20 text-xs text-text-secondary leading-relaxed mb-5">
              <strong className="text-text-primary block mb-1">Irrevocable Atomic Transfer:</strong>
              Transferring this charter permanently relinquishes your Founding Charter seat and all associated perks
              (queue priority, subscription rate lock, white-label exports, and gold seal). The recipient must hold a
              verified ScoutIt account and cannot already hold any Pioneer Charter.
            </div>

            {transferFeedback && (
              <div
                className={`p-3 rounded-lg text-xs font-mono mb-4 flex items-center gap-2 ${
                  transferFeedback.type === "success"
                    ? "border border-green-500/40 bg-green-950/20 text-green-300"
                    : "border border-red-500/40 bg-red-950/20 text-red-300"
                }`}
              >
                {transferFeedback.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                <span>{transferFeedback.message}</span>
              </div>
            )}

            <form onSubmit={handleExecuteTransfer} className="space-y-4">
              <div>
                <label className="block font-mono text-xs uppercase tracking-wider text-text-secondary mb-1.5">
                  Recipient Email or User ID
                </label>
                <input
                  type="text"
                  required
                  value={recipientInput}
                  onChange={(e) => setRecipientInput(e.target.value)}
                  placeholder="broker@luxuryrealty.ph or user-uuid"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-border bg-surface2 text-text-primary text-sm focus:outline-none focus:border-accent"
                />
              </div>

              <label className="flex items-start gap-3 p-3 rounded-lg border border-border bg-surface2/50 cursor-pointer text-xs text-text-secondary leading-relaxed">
                <input
                  type="checkbox"
                  required
                  checked={transferConfirmed}
                  onChange={(e) => setTransferConfirmed(e.target.checked)}
                  className="mt-0.5 rounded border-border text-accent focus:ring-accent"
                />
                <span>
                  I confirm this transfer is permanent, non-refundable, and compliant with ScoutIt Pioneer charter limits
                  (1 pioneer badge per account).
                </span>
              </label>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCloseTransfer}
                  className="px-4 py-2 rounded-lg border border-border text-text-secondary hover:text-text-primary font-mono text-xs uppercase tracking-wider min-h-[44px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={transferSubmitting || !transferConfirmed || !recipientInput.trim()}
                  className="px-5 py-2 rounded-lg border border-accent bg-accent text-on-accent font-mono text-xs uppercase tracking-wider font-semibold hover:bg-accent-bright transition-colors disabled:opacity-50 min-h-[44px]"
                >
                  {transferSubmitting ? "Transferring..." : "Confirm Transfer →"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* APPLY FOR CHARTER DOSSIER MODAL */}
      {applyModalBadge && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
          <div className="relative w-full max-w-lg bg-surface border border-accent-muted rounded-2xl p-6 shadow-2xl text-left">
            <button
              type="button"
              onClick={handleCloseApply}
              className="absolute top-4 right-4 p-2 text-text-muted hover:text-text-primary rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Close application modal"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-2 mb-2 text-accent font-mono text-xs uppercase tracking-widest">
              <Sparkles size={16} />
              <span>Charter Candidate Dossier</span>
            </div>

            <h3 className="font-headline-editorial text-xl text-text-primary mb-1">
              Apply for {applyModalBadge.name}
            </h3>

            <p className="text-xs text-text-secondary mb-4 leading-relaxed">
              Founding Charters require verified real estate caliber and active participation. Each verified account may
              hold at most 1 Pioneer Charter across all roles.
            </p>

            {applyFeedback && (
              <div
                className={`p-3 rounded-lg text-xs font-mono mb-4 flex items-center gap-2 ${
                  applyFeedback.type === "success"
                    ? "border border-green-500/40 bg-green-950/20 text-green-300"
                    : "border border-red-500/40 bg-red-950/20 text-red-300"
                }`}
              >
                {applyFeedback.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                <span>{applyFeedback.message}</span>
              </div>
            )}

            <form onSubmit={handleExecuteApply} className="space-y-3.5">
              <div>
                <label className="block font-mono text-xs uppercase tracking-wider text-text-secondary mb-1">
                  Full Name / Legal Signatory
                </label>
                <input
                  type="text"
                  required
                  value={applicantName}
                  onChange={(e) => setApplicantName(e.target.value)}
                  placeholder="Maria Santos"
                  className="w-full px-3.5 py-2 rounded-lg border border-border bg-surface2 text-text-primary text-sm focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="block font-mono text-xs uppercase tracking-wider text-text-secondary mb-1">
                  Organization / Agency / Developer
                </label>
                <input
                  type="text"
                  value={applicantOrg}
                  onChange={(e) => setApplicantOrg(e.target.value)}
                  placeholder="Ayala Land Premier / Santos Knight Frank"
                  className="w-full px-3.5 py-2 rounded-lg border border-border bg-surface2 text-text-primary text-sm focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="block font-mono text-xs uppercase tracking-wider text-text-secondary mb-1">
                  License / Title / Proof Reference
                </label>
                <input
                  type="text"
                  required
                  value={proofReference}
                  onChange={(e) => setProofReference(e.target.value)}
                  placeholder="PRC #0012345 or TCT #009-87654"
                  className="w-full px-3.5 py-2 rounded-lg border border-border bg-surface2 text-text-primary text-sm focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="block font-mono text-xs uppercase tracking-wider text-text-secondary mb-1">
                  Statement of Caliber & Trophy Focus
                </label>
                <textarea
                  rows={3}
                  required
                  value={statement}
                  onChange={(e) => setStatement(e.target.value)}
                  placeholder="Briefly state your active portfolio in BGC, Makati CBD, or Ortigas, and why you should hold a permanent charter seat."
                  className="w-full px-3.5 py-2 rounded-lg border border-border bg-surface2 text-text-primary text-sm focus:outline-none focus:border-accent"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCloseApply}
                  className="px-4 py-2 rounded-lg border border-border text-text-secondary hover:text-text-primary font-mono text-xs uppercase tracking-wider min-h-[44px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={applySubmitting || !applicantName.trim() || !proofReference.trim()}
                  className="px-5 py-2 rounded-lg border border-accent bg-accent text-on-accent font-mono text-xs uppercase tracking-wider font-semibold hover:bg-accent-bright transition-colors disabled:opacity-50 min-h-[44px]"
                >
                  {applySubmitting ? "Submitting..." : "Submit Dossier →"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
