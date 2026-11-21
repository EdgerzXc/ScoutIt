"use client";

import { useEffect, useRef, useState } from "react";
import { updateDsrResolution } from "./actions";
import { DSR_STATUSES } from "@/lib/privacyPolicy.mjs";
import {
  ShieldAlert,
  ShieldCheck,
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  Search,
  Lock,
  AlertTriangle,
} from "lucide-react";

const DECISION_LABELS = {
  under_review: "Save review",
  fulfilled: "Record fulfillment",
  rejected: "Reject request",
};

export default function PrivacyClient({ initialDeletions = [], initialDsrQueue = [], reviewError, deletionError, canVerifyClosedAccount }) {
  const [tab, setTab] = useState("dsr"); // "dsr" | "deletions"
  const [dsrList, setDsrList] = useState(initialDsrQueue);
  const [filter, setFilter] = useState("pending"); // "pending" | "all"
  const [search, setSearch] = useState("");
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [resolutionStatus, setResolutionStatus] = useState("fulfilled");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [toast, setToast] = useState(null);
  const [verifySubject, setVerifySubject] = useState(false);
  const [closedAccountEvent, setClosedAccountEvent] = useState("");
  const dialogRef = useRef(null);
  const openerRef = useRef(null);

  useEffect(() => {
    if (selectedRequest && dialogRef.current && !dialogRef.current.open) dialogRef.current.showModal();
  }, [selectedRequest]);

  const totalDeletions = initialDeletions.filter((item) => item.authRemoved).length;
  const totalDsr = dsrList.length;
  const pendingDsr = dsrList.filter((d) => d.status === DSR_STATUSES.PENDING || d.status === DSR_STATUSES.UNDER_REVIEW).length;
  const breachedDsr = dsrList.filter((d) => (d.status === DSR_STATUSES.PENDING || d.status === DSR_STATUSES.UNDER_REVIEW) && d.isBreached).length;

  const filteredDsr = dsrList.filter((d) => {
    if (filter === "pending" && d.status !== DSR_STATUSES.PENDING && d.status !== DSR_STATUSES.UNDER_REVIEW) {
      return false;
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        d.name?.toLowerCase().includes(q) ||
        d.email?.toLowerCase().includes(q) ||
        d.subject?.toLowerCase().includes(q) ||
        d.message?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const filteredDeletions = initialDeletions.filter((del) => {
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        del.maskedUser?.toLowerCase().includes(q) ||
        del.legalBasis?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleOpenModal = (request, status, button) => {
    openerRef.current = button;
    setSelectedRequest(request);
    setResolutionStatus(status);
    setNotes("");
    setVerifySubject(false);
    setClosedAccountEvent("");
    setActionError(null);
  };

  const handleCloseModal = () => {
    dialogRef.current?.close();
    openerRef.current?.focus();
    setSelectedRequest(null);
    setNotes("");
    setActionError(null);
  };

  const handleSubmitResolution = async (e) => {
    e.preventDefault();
    if (!selectedRequest) return;

    if (!notes.trim() || notes.trim().length < 10) {
      setActionError("Please provide a substantive compliance note (at least 10 characters) for staff audit.");
      return;
    }

    setIsSubmitting(true);
    setActionError(null);

    try {
      const res = await updateDsrResolution({
        requestId: selectedRequest.id,
        revision: selectedRequest.revision,
        status: resolutionStatus,
        resolutionNotes: notes.trim(),
        verifySubject,
        closedAccountEvent: verifySubject && !selectedRequest.signedIn ? closedAccountEvent.trim() : null,
      });

      if (res.success) {
        setDsrList((prev) =>
          prev.map((d) =>
            d.id === selectedRequest.id ? { ...d, status: res.status, revision: res.revision, subjectVerified: res.subjectVerified } : d
          )
        );
        setToast(res.subjectVerified && verifySubject ? "Identity verification recorded." : "Privacy review recorded.");
        handleCloseModal();
        setTimeout(() => setToast(null), 5000);
      } else setActionError(res.error);
    } catch {
      setActionError("Could not confirm the privacy review. Refresh before retrying.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      <div role="status">{toast && (
        <div className="flex items-center gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 text-emerald-400">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <span className="text-sm">{toast}</span>
        </div>
      )}</div>

      {/* Metric Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="rounded-xl border border-white/5 bg-[#121212] p-5">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs uppercase tracking-wider text-white/60">Sign-ins closed</span>
            <Lock className="h-4 w-4 text-[#E8AE3C]" />
          </div>
          <div className="mt-2 text-2xl font-semibold text-white">{totalDeletions}</div>
        </div>

        <div className="rounded-xl border border-white/5 bg-[#121212] p-5">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs uppercase tracking-wider text-white/60">Pending DSRs</span>
            <Clock className="h-4 w-4 text-white/60" />
          </div>
          <div className="mt-2 text-2xl font-semibold text-white">{pendingDsr}</div>
        </div>

        <div className="rounded-xl border border-white/5 bg-[#121212] p-5">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs uppercase tracking-wider text-white/60">Reviews overdue</span>
            <AlertTriangle className="h-4 w-4 text-red-400" />
          </div>
          <div className="mt-2 text-2xl font-semibold text-red-400">{breachedDsr}</div>
        </div>

        <div className="rounded-xl border border-white/5 bg-[#121212] p-5">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs uppercase tracking-wider text-white/60">Internal review target</span>
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-semibold text-emerald-400">15 Days</div>
        </div>
      </div>

      {/* Tabs and Search Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTab("dsr")}
            className={`rounded-lg px-3 py-1.5 text-xs font-mono uppercase tracking-wider transition-colors ${
              tab === "dsr"
                ? "bg-[#E8AE3C] text-black font-semibold"
                : "bg-white/5 text-white/70 hover:bg-white/10"
            }`}
          >
            DSR Queue ({pendingDsr} Pending)
          </button>
          <button
            onClick={() => setTab("deletions")}
            className={`rounded-lg px-3 py-1.5 text-xs font-mono uppercase tracking-wider transition-colors ${
              tab === "deletions"
                ? "bg-[#E8AE3C] text-black font-semibold"
                : "bg-white/5 text-white/70 hover:bg-white/10"
            }`}
          >
            Account deletion audit
          </button>
        </div>

        <div className="flex items-center gap-3">
          {tab === "dsr" && (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setFilter("pending")}
                className={`rounded px-2 py-1 text-xs font-mono uppercase transition-colors ${
                  filter === "pending"
                    ? "bg-white/15 text-white font-semibold"
                    : "text-white/60 hover:text-white"
                }`}
              >
                Pending
              </button>
              <button
                onClick={() => setFilter("all")}
                className={`rounded px-2 py-1 text-xs font-mono uppercase transition-colors ${
                  filter === "all"
                    ? "bg-white/15 text-white font-semibold"
                    : "text-white/60 hover:text-white"
                }`}
              >
                All
              </button>
            </div>
          )}

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/60" />
            <input
              type="text"
              placeholder="Search privacy records..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full sm:w-60 rounded-lg border border-white/10 bg-black/40 pl-9 pr-3 py-1.5 text-xs text-white placeholder-white/40 focus:border-[#E8AE3C] focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Tab: DSR Queue */}
      {tab === "dsr" && (
        <div className="space-y-4">
          {reviewError && <p role="alert" className="text-sm text-red-300">{reviewError}</p>}
          {!reviewError && (filteredDsr.length === 0 ? (
            <div className="rounded-xl border border-white/5 bg-[#121212] p-12 text-center font-mono text-xs text-white/60">
              No Data Subject Requests pending in queue.
            </div>
          ) : (
            filteredDsr.map((req) => (
              <div
                key={req.id}
                className="rounded-xl border border-white/5 bg-[#121212] p-5 transition-colors hover:border-white/10"
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="space-y-2.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-semibold text-white">{req.name}</span>
                      <span className="font-mono text-xs text-white/60">{req.email}</span>
                      <span className="rounded bg-white/5 px-2 py-0.5 font-mono text-xs uppercase text-[#E8AE3C] border border-white/10">
                        {req.requestType.replaceAll("_", " ")}
                      </span>
                      <span className="text-xs text-white/75">{req.status.replaceAll("_", " ")}</span>
                      <span className="text-xs text-white/75">{req.subjectVerified ? "Identity verified" : "Identity unverified"}</span>
                      {req.isBreached ? (
                        <span className="rounded bg-red-500/10 px-2 py-0.5 font-mono text-xs uppercase text-red-400 border border-red-500/20">
                          Review overdue ({Math.abs(req.daysRemaining)}d)
                        </span>
                      ) : req.isUrgent ? (
                        <span className="rounded bg-amber-500/10 px-2 py-0.5 font-mono text-xs uppercase text-amber-400 border border-amber-500/20">
                          Urgent ({req.daysRemaining}d remaining)
                        </span>
                      ) : (
                        <span className="rounded bg-emerald-500/10 px-2 py-0.5 font-mono text-xs uppercase text-emerald-400 border border-emerald-500/20">
                          On Track ({req.daysRemaining}d remaining)
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-white/90 font-medium">{req.subject}</div>
                    <p className="text-xs text-white/70 bg-black/30 p-3 rounded-lg border border-white/5 whitespace-pre-wrap">
                      {req.message}
                    </p>

                    <div className="font-mono text-xs text-white/60">
                      Received {new Date(req.createdAt).toLocaleString()} · Review target{" "}
                      {new Date(req.slaDeadline).toLocaleDateString()}
                    </div>
                  </div>

                  {![DSR_STATUSES.FULFILLED, DSR_STATUSES.REJECTED].includes(req.status) && <div className="shrink-0 flex flex-wrap sm:flex-col gap-2">
                    <button type="button" onClick={(event) => handleOpenModal(req, DSR_STATUSES.UNDER_REVIEW, event.currentTarget)}
                      className="min-h-11 rounded-lg border border-white/20 px-3 py-2 text-sm text-white">Review request</button>
                    {req.requestType !== "erasure" && (req.subjectVerified || req.requestType === "privacy_inquiry") && (
                    <button
                      type="button"
                      onClick={(event) => handleOpenModal(req, "fulfilled", event.currentTarget)}
                      className="min-h-11 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-400 hover:bg-emerald-500/20"
                    >
                      Record fulfillment
                    </button>
                    )}
                    <button
                      type="button"
                      onClick={(event) => handleOpenModal(req, "rejected", event.currentTarget)}
                      className="min-h-11 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400 hover:bg-red-500/20"
                    >
                      Reject request
                    </button>
                  </div>}
                </div>
              </div>
            ))
          ))}
        </div>
      )}

      {/* Tab: Non-PII Deletion Log */}
      {tab === "deletions" && deletionError && <p role="alert" className="text-sm text-red-300">{deletionError}</p>}
      {tab === "deletions" && !deletionError && (
        <div className="overflow-x-auto rounded-xl border border-white/5 bg-[#121212]">
          <table className="w-full text-left text-xs text-white/70">
            <thead className="border-b border-white/5 bg-black/30 font-mono text-xs uppercase tracking-wider text-white/60">
              <tr>
                <th className="px-5 py-3">Masked User Reference</th>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Statutory Basis</th>
                <th className="px-4 py-3">Recorded removals</th>
                <th className="px-5 py-3 text-right">Sign-in status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono text-xs">
              {filteredDeletions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-white/60">
                    No account deletions recorded in audit trail.
                  </td>
                </tr>
              ) : (
                filteredDeletions.map((del) => (
                  <tr key={del.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-3.5 text-white font-medium">
                      {del.maskedUser}
                      {canVerifyClosedAccount && del.authRemoved && <span className="block break-all text-xs text-white/65">Audit {del.id}</span>}
                    </td>
                    <td className="px-4 py-3.5 text-white/60">{new Date(del.timestamp).toLocaleString()}</td>
                    <td className="px-4 py-3.5 text-[#E8AE3C]">{del.legalBasis}</td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1 flex-wrap">
                        {del.erasedSubsystems.map((s) => (
                          <span
                            key={s}
                            className="rounded bg-white/5 px-1.5 py-0.5 text-xs text-white/60 border border-white/5"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <span className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs ${del.authRemoved ? "text-emerald-400" : "text-amber-400"}`}>
                        {del.authRemoved && <CheckCircle2 className="h-3 w-3" />}
                        {del.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Resolution Modal */}
      {selectedRequest && (
        <dialog ref={dialogRef} aria-labelledby="privacy-decision-title"
          onCancel={(event) => { event.preventDefault(); if (!isSubmitting) handleCloseModal(); }}
          className="m-auto max-h-[calc(100dvh_-_2rem)] w-[calc(100%_-_2rem)] max-w-md overflow-y-auto rounded-2xl border border-white/10 bg-[var(--surface)] p-4 text-white backdrop:bg-black/80 sm:p-6">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <h3 id="privacy-decision-title" className="text-base font-semibold text-white">
                {DECISION_LABELS[resolutionStatus]}
              </h3>
              <button onClick={handleCloseModal} disabled={isSubmitting} aria-label="Close review"
                className="min-h-11 min-w-11 text-white/75 hover:text-white">
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitResolution} className="space-y-4 mt-4">
              <div className="text-xs text-white/70 space-y-1.5 rounded-lg border border-white/5 bg-black/30 p-3">
                <div className="flex justify-between">
                  <span className="text-white/60">Requester:</span>
                  <span className="font-semibold text-white">{selectedRequest.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Type:</span>
                  <span className="font-mono text-[#E8AE3C] uppercase">{selectedRequest.requestType}</span>
                </div>
              </div>

              {resolutionStatus === "under_review" && !selectedRequest.subjectVerified && (
                selectedRequest.signedIn ? (
                  <label className="flex min-h-11 items-center gap-2 text-sm text-white/80">
                    <input type="checkbox" checked={verifySubject} disabled={isSubmitting} onChange={(event) => setVerifySubject(event.target.checked)} />
                    I verified the requester’s identity and authority for this signed-in account.
                  </label>
                ) : canVerifyClosedAccount ? (
                  <div className="space-y-2">
                    <label className="flex min-h-11 items-center gap-2 text-sm text-white/80">
                      <input type="checkbox" checked={verifySubject} disabled={isSubmitting} onChange={(event) => setVerifySubject(event.target.checked)} />
                      I independently verified the requester’s identity and authority for the closed account.
                    </label>
                    {verifySubject && <div>
                      <label htmlFor="privacy-closure-audit" className="block text-sm text-white/80">Account closure audit ID</label>
                      <input id="privacy-closure-audit" required maxLength={36} value={closedAccountEvent}
                        onChange={(event) => setClosedAccountEvent(event.target.value)} disabled={isSubmitting}
                        className="min-h-11 w-full rounded-lg border border-white/20 bg-black/40 px-3 text-white" />
                    </div>}
                  </div>
                ) : <p className="text-sm text-white/75">A Super Admin can review identity for a closed account.</p>
              )}
              {selectedRequest.requestType === "erasure" && <p className="text-sm text-white/75">Keep the request open until the erasure evidence has been verified.</p>}

              <div>
                <label htmlFor="privacy-decision-note" className="mb-1.5 block text-sm text-white/80">
                  Review note
                </label>
                <textarea
                  id="privacy-decision-note"
                  required
                  minLength={10}
                  maxLength={1000}
                  disabled={isSubmitting}
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Record the review and reference any evidence without copying personal details."
                  className="w-full rounded-lg border border-white/10 bg-black/40 p-3 text-xs text-white placeholder-white/30 focus:border-[#E8AE3C] focus:outline-none"
                />
              </div>

              {actionError && (
                <div role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
                  {actionError}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={isSubmitting}
                  className="min-h-11 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 hover:bg-white/10"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="min-h-11 rounded-lg bg-[var(--accent-bright)] px-4 py-2 text-sm font-semibold text-black disabled:opacity-55"
                >
                  {isSubmitting ? "Submitting..." : "Confirm Decision"}
                </button>
              </div>
            </form>
          </div>
        </dialog>
      )}
    </div>
  );
}
