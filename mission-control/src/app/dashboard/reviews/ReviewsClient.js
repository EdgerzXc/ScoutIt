"use client";

import { useState } from "react";
import { resolveReviewDispute } from "./actions";
import {
  REVIEW_DISPUTE_OUTCOMES,
  daysPending,
  isStalledDispute,
} from "@/lib/reviewDisputePolicy.mjs";
import {
  Scale,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Clock,
  User,
  CheckCircle2,
  XCircle,
  FileText,
  Search,
} from "lucide-react";

export default function ReviewsClient({ reviews = [], initialError = null }) {
  const [filter, setFilter] = useState("disputed"); // "disputed" | "all" | "stalled"
  const [search, setSearch] = useState("");
  const [selectedReview, setSelectedReview] = useState(null);
  const [actionOutcome, setActionOutcome] = useState(null); // "uphold_review" | "remove_review"
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [successToast, setSuccessToast] = useState(null);

  const filteredReviews = reviews.filter((r) => {
    const isStalled = isStalledDispute(r.disputed_at);
    if (filter === "disputed" && !r.is_disputed) return false;
    if (filter === "stalled" && (!r.is_disputed || !isStalled)) return false;

    if (search.trim()) {
      const q = search.toLowerCase();
      const matchId = r.id?.toLowerCase().includes(q);
      const matchReason = r.dispute_reason?.toLowerCase().includes(q);
      const matchFeedback = r.feedback?.toLowerCase().includes(q);
      const matchReviewer = r.reviewer_email?.toLowerCase().includes(q);
      const matchTarget = r.target_email?.toLowerCase().includes(q);
      return matchId || matchReason || matchFeedback || matchReviewer || matchTarget;
    }
    return true;
  });

  const totalDisputed = reviews.filter((r) => r.is_disputed).length;
  const totalStalled = reviews.filter((r) => r.is_disputed && isStalledDispute(r.disputed_at)).length;
  const totalResolved = reviews.filter((r) => !r.is_disputed && r.dispute_resolution).length;

  const handleOpenModal = (review, outcome) => {
    setSelectedReview(review);
    setActionOutcome(outcome);
    setReason("");
    setActionError(null);
  };

  const handleCloseModal = () => {
    setSelectedReview(null);
    setActionOutcome(null);
    setReason("");
    setActionError(null);
  };

  const handleSubmitResolution = async (e) => {
    e.preventDefault();
    if (!selectedReview || !actionOutcome) return;

    if (!reason.trim() || reason.trim().length < 10) {
      setActionError("Please provide a substantive reason (at least 10 characters) for staff audit.");
      return;
    }

    setIsSubmitting(true);
    setActionError(null);

    try {
      const res = await resolveReviewDispute({
        reviewId: selectedReview.id,
        outcome: actionOutcome,
        reason: reason.trim(),
      });

      if (res.success) {
        setSuccessToast(
          actionOutcome === REVIEW_DISPUTE_OUTCOMES.UPHOLD_REVIEW
            ? "Review upheld: dispute dismissed and standing recomputed."
            : "Review quarantined: dispute upheld and review excluded from standing."
        );
        handleCloseModal();
        setTimeout(() => setSuccessToast(null), 5000);
      } else {
        setActionError(res.error || "Failed to resolve dispute.");
      }
    } catch (err) {
      setActionError(err.message || "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {successToast && (
        <div className="flex items-center gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 text-emerald-400">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <span className="text-sm">{successToast}</span>
        </div>
      )}

      {initialError && (
        <div className="flex items-center gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-amber-400">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <span className="text-sm">Database status: {initialError}</span>
        </div>
      )}

      {/* Metric Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-white/5 bg-[#121212] p-5">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs uppercase tracking-wider text-white/60">Active Disputes</span>
            <Scale className="h-4 w-4 text-[#E8AE3C]" />
          </div>
          <div className="mt-2 text-2xl font-semibold text-white">{totalDisputed}</div>
          <div className="mt-1 text-xs text-white/60">Quarantined from behavioral scoring</div>
        </div>

        <div className="rounded-xl border border-white/5 bg-[#121212] p-5">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs uppercase tracking-wider text-white/60">Stalled (&gt; 7 Days)</span>
            <Clock className="h-4 w-4 text-amber-400" />
          </div>
          <div className="mt-2 text-2xl font-semibold text-amber-400">{totalStalled}</div>
          <div className="mt-1 text-xs text-white/60">Pending arbitration past SLA</div>
        </div>

        <div className="rounded-xl border border-white/5 bg-[#121212] p-5">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs uppercase tracking-wider text-white/60">Resolved by Staff</span>
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-semibold text-white">{totalResolved}</div>
          <div className="mt-1 text-xs text-white/60">Arbitrated reviews on record</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilter("disputed")}
            className={`rounded-lg px-3 py-1.5 text-xs font-mono uppercase tracking-wider transition-colors ${
              filter === "disputed"
                ? "bg-[#E8AE3C] text-black font-semibold"
                : "bg-white/5 text-white/70 hover:bg-white/10"
            }`}
          >
            Active Disputes ({totalDisputed})
          </button>
          <button
            onClick={() => setFilter("stalled")}
            className={`rounded-lg px-3 py-1.5 text-xs font-mono uppercase tracking-wider transition-colors ${
              filter === "stalled"
                ? "bg-amber-400 text-black font-semibold"
                : "bg-white/5 text-white/70 hover:bg-white/10"
            }`}
          >
            Stalled SLA ({totalStalled})
          </button>
          <button
            onClick={() => setFilter("all")}
            className={`rounded-lg px-3 py-1.5 text-xs font-mono uppercase tracking-wider transition-colors ${
              filter === "all"
                ? "bg-[#E8AE3C] text-black font-semibold"
                : "bg-white/5 text-white/70 hover:bg-white/10"
            }`}
          >
            All History ({reviews.length})
          </button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/60" />
          <input
            type="text"
            placeholder="Search dispute text, party..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-64 rounded-lg border border-white/10 bg-black/40 pl-9 pr-3 py-1.5 text-xs text-white placeholder-white/40 focus:border-[#E8AE3C] focus:outline-none"
          />
        </div>
      </div>

      {/* Disputes List */}
      {filteredReviews.length === 0 ? (
        <div className="rounded-xl border border-white/5 bg-[#121212] p-12 text-center">
          <Scale className="mx-auto h-8 w-8 text-white/60 mb-3" />
          <div className="text-sm font-medium text-white/80">No review disputes found</div>
          <div className="text-xs text-white/60 mt-1">
            {filter === "disputed"
              ? "All behavioral reviews are currently in good standing."
              : "No records match the current filter criteria."}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReviews.map((r) => {
            const days = daysPending(r.disputed_at);
            const isStalled = isStalledDispute(r.disputed_at);
            const vectors = r.vectors || {};

            return (
              <div
                key={r.id}
                className="rounded-xl border border-white/5 bg-[#121212] p-5 transition-colors hover:border-white/10"
              >
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  {/* Left Column: Parties & Meta */}
                  <div className="space-y-3 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs text-[#E8AE3C] uppercase tracking-wider">
                        Review {r.id.slice(0, 8)}
                      </span>
                      {r.is_disputed ? (
                        <span className="inline-flex items-center gap-1 rounded bg-amber-500/10 px-2 py-0.5 font-mono text-xs uppercase tracking-wider text-amber-400 border border-amber-500/20">
                          <ShieldAlert className="h-3 w-3" />
                          Quarantined
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 px-2 py-0.5 font-mono text-xs uppercase tracking-wider text-emerald-400 border border-emerald-500/20">
                          <ShieldCheck className="h-3 w-3" />
                          Active Standing
                        </span>
                      )}

                      {isStalled && r.is_disputed && (
                        <span className="inline-flex items-center gap-1 rounded bg-red-500/10 px-2 py-0.5 font-mono text-xs uppercase tracking-wider text-red-400 border border-red-500/20">
                          <Clock className="h-3 w-3" />
                          Stalled ({days}d)
                        </span>
                      )}

                      <span className="text-xs text-white/60 font-mono">
                        {r.disputed_at
                          ? `Disputed ${new Date(r.disputed_at).toLocaleDateString()}`
                          : `Submitted ${new Date(r.submitted_at || r.created_at).toLocaleDateString()}`}
                      </span>
                    </div>

                    {/* Parties info */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="rounded border border-white/5 bg-black/20 p-2.5">
                        <div className="text-white/60 font-mono text-xs uppercase">Author / Reviewer</div>
                        <div className="text-white/90 font-medium truncate mt-0.5">
                          {r.reviewer_name || r.reviewer_email || r.reviewer_id}
                        </div>
                      </div>
                      <div className="rounded border border-white/5 bg-black/20 p-2.5">
                        <div className="text-white/60 font-mono text-xs uppercase">Target User (Disputant)</div>
                        <div className="text-white/90 font-medium truncate mt-0.5">
                          {r.target_name || r.target_email || r.target_user_id}
                        </div>
                      </div>
                    </div>

                    {/* Dispute Reason & Feedback */}
                    <div className="space-y-2 text-xs">
                      {r.dispute_reason && (
                        <div className="rounded border border-amber-500/15 bg-amber-500/5 p-3">
                          <span className="font-mono text-xs uppercase tracking-wider text-amber-400 block mb-1">
                            Dispute Ground:
                          </span>
                          <p className="text-white/80 italic">&quot;{r.dispute_reason}&quot;</p>
                        </div>
                      )}

                      <div className="rounded border border-white/5 bg-black/30 p-3">
                        <span className="font-mono text-xs uppercase tracking-wider text-white/60 block mb-1">
                          Review Feedback:
                        </span>
                        <p className="text-white/90">{r.feedback || "No written narrative provided."}</p>
                      </div>

                      {r.dispute_resolution && (
                        <div className="rounded border border-emerald-500/15 bg-emerald-500/5 p-3">
                          <span className="font-mono text-xs uppercase tracking-wider text-emerald-400 block mb-1">
                            Staff Resolution:
                          </span>
                          <p className="text-white/80">{r.dispute_resolution}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Vectors & Arbitration Actions */}
                  <div className="w-full lg:w-72 shrink-0 space-y-4 border-t lg:border-t-0 lg:border-l border-white/5 pt-4 lg:pt-0 lg:pl-5">
                    {/* Vectors Summary */}
                    <div>
                      <div className="font-mono text-xs uppercase tracking-wider text-white/60 mb-2">
                        Evaluation Vectors
                      </div>
                      <div className="space-y-1.5 text-xs font-mono">
                        <div className="flex justify-between items-center text-white/70">
                          <span>Payment</span>
                          <span className="text-[#E8AE3C] font-semibold">{vectors.payment_punctuality || "—"}/5</span>
                        </div>
                        <div className="flex justify-between items-center text-white/70">
                          <span>Space Care</span>
                          <span className="text-[#E8AE3C] font-semibold">{vectors.space_care_maintenance || "—"}/5</span>
                        </div>
                        <div className="flex justify-between items-center text-white/70">
                          <span>Conduct</span>
                          <span className="text-[#E8AE3C] font-semibold">{vectors.communication_conduct || "—"}/5</span>
                        </div>
                        <div className="flex justify-between items-center text-white/70">
                          <span>Covenants</span>
                          <span className="text-[#E8AE3C] font-semibold">{vectors.lease_covenant_adherence || "—"}/5</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions if disputed */}
                    {r.is_disputed && (
                      <div className="space-y-2 pt-2 border-t border-white/5">
                        <div className="font-mono text-xs uppercase tracking-wider text-white/60 mb-1">
                          Arbitration Actions (Ops Manager+)
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenModal(r, REVIEW_DISPUTE_OUTCOMES.UPHOLD_REVIEW)}
                            className="flex items-center justify-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-medium text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Uphold Review
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenModal(r, REVIEW_DISPUTE_OUTCOMES.REMOVE_REVIEW)}
                            className="flex items-center justify-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-medium text-red-400 hover:bg-red-500/20 transition-colors"
                          >
                            <XCircle className="h-3.5 w-3.5" />
                            Remove Review
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal for Resolution */}
      {selectedReview && actionOutcome && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#121212] p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Scale className="h-5 w-5 text-[#E8AE3C]" />
                <h3 className="text-base font-semibold text-white">
                  {actionOutcome === REVIEW_DISPUTE_OUTCOMES.UPHOLD_REVIEW
                    ? "Uphold Review (Dismiss Dispute)"
                    : "Remove Review (Uphold Dispute)"}
                </h3>
              </div>
              <button
                onClick={handleCloseModal}
                className="text-white/60 hover:text-white transition-colors text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitResolution} className="space-y-4 mt-4">
              <div className="text-xs text-white/70 space-y-2 rounded-lg border border-white/5 bg-black/30 p-3">
                <div className="flex justify-between">
                  <span className="text-white/60">Review ID:</span>
                  <span className="font-mono text-[#E8AE3C]">{selectedReview.id.slice(0, 12)}...</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Action Effect:</span>
                  <span className="font-semibold text-white">
                    {actionOutcome === REVIEW_DISPUTE_OUTCOMES.UPHOLD_REVIEW
                      ? "Restores review to user's standing and recomputes trust score"
                      : "Permanently quarantines review from user's trust score"}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-white/60 mb-1.5">
                  Arbitration Reason (Required for Staff Audit & Parties)
                </label>
                <textarea
                  required
                  rows={4}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Explain why this review is being upheld or quarantined following investigation..."
                  className="w-full rounded-lg border border-white/10 bg-black/40 p-3 text-xs text-white placeholder-white/30 focus:border-[#E8AE3C] focus:outline-none"
                />
              </div>

              {actionError && (
                <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400">
                  {actionError}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={isSubmitting}
                  className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-white/80 hover:bg-white/10 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`rounded-lg px-4 py-2 text-xs font-semibold text-black transition-colors ${
                    actionOutcome === REVIEW_DISPUTE_OUTCOMES.UPHOLD_REVIEW
                      ? "bg-emerald-400 hover:bg-emerald-300"
                      : "bg-[#E8AE3C] hover:bg-[#F7C64E]"
                  }`}
                >
                  {isSubmitting ? "Submitting Decision..." : "Confirm Resolution"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
