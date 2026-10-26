"use client";

import { useState } from "react";
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

export default function PrivacyClient({ initialDeletions = [], initialDsrQueue = [] }) {
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

  const totalDeletions = initialDeletions.length;
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

  const handleOpenModal = (request, status) => {
    setSelectedRequest(request);
    setResolutionStatus(status);
    setNotes("");
    setActionError(null);
  };

  const handleCloseModal = () => {
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
        status: resolutionStatus,
        resolutionNotes: notes.trim(),
      });

      if (res.success) {
        setDsrList((prev) =>
          prev.map((d) =>
            d.id === selectedRequest.id ? { ...d, status: resolutionStatus } : d
          )
        );
        setToast(`Request for ${selectedRequest.email} marked ${resolutionStatus}.`);
        handleCloseModal();
        setTimeout(() => setToast(null), 5000);
      }
    } catch (err) {
      setActionError(err.message || "Failed to update request.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className="flex items-center gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 text-emerald-400">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <span className="text-sm">{toast}</span>
        </div>
      )}

      {/* Metric Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="rounded-xl border border-white/5 bg-[#121212] p-5">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs uppercase tracking-wider text-white/60">Accounts Erased</span>
            <Lock className="h-4 w-4 text-[#E8AE3C]" />
          </div>
          <div className="mt-2 text-2xl font-semibold text-white">{totalDeletions}</div>
          <div className="mt-1 text-xs text-white/60">RA 10173 §16(e) compliant erasures</div>
        </div>

        <div className="rounded-xl border border-white/5 bg-[#121212] p-5">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs uppercase tracking-wider text-white/60">Pending DSRs</span>
            <Clock className="h-4 w-4 text-white/60" />
          </div>
          <div className="mt-2 text-2xl font-semibold text-white">{pendingDsr}</div>
          <div className="mt-1 text-xs text-white/60">Active requests in queue</div>
        </div>

        <div className="rounded-xl border border-white/5 bg-[#121212] p-5">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs uppercase tracking-wider text-white/60">SLA Breached (&gt;15d)</span>
            <AlertTriangle className="h-4 w-4 text-red-400" />
          </div>
          <div className="mt-2 text-2xl font-semibold text-red-400">{breachedDsr}</div>
          <div className="mt-1 text-xs text-white/60">Past statutory 15-day limit</div>
        </div>

        <div className="rounded-xl border border-white/5 bg-[#121212] p-5">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs uppercase tracking-wider text-white/60">Compliance SLA</span>
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-semibold text-emerald-400">15 Days</div>
          <div className="mt-1 text-xs text-white/60">Statutory NPC standard</div>
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
            Non-PII Deletion Log ({totalDeletions})
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
          {filteredDsr.length === 0 ? (
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
                        {req.requestType}
                      </span>
                      {req.isBreached ? (
                        <span className="rounded bg-red-500/10 px-2 py-0.5 font-mono text-xs uppercase text-red-400 border border-red-500/20">
                          SLA Breached ({Math.abs(req.daysRemaining)}d overdue)
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
                      Received: {new Date(req.createdAt).toLocaleString()} · Statutory SLA Deadline:{" "}
                      {new Date(req.slaDeadline).toLocaleDateString()}
                    </div>
                  </div>

                  <div className="shrink-0 flex sm:flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenModal(req, "fulfilled")}
                      className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                    >
                      Fulfill Request
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenModal(req, "rejected")}
                      className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/20 transition-colors"
                    >
                      Reject Request
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab: Non-PII Deletion Log */}
      {tab === "deletions" && (
        <div className="overflow-x-auto rounded-xl border border-white/5 bg-[#121212]">
          <table className="w-full text-left text-xs text-white/70">
            <thead className="border-b border-white/5 bg-black/30 font-mono text-xs uppercase tracking-wider text-white/60">
              <tr>
                <th className="px-5 py-3">Masked User Reference</th>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Statutory Basis</th>
                <th className="px-4 py-3">Purged Subsystems</th>
                <th className="px-5 py-3 text-right">Compliance Status</th>
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
                    <td className="px-5 py-3.5 text-white font-medium">{del.maskedUser}</td>
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
                      <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 px-2 py-0.5 text-xs uppercase text-emerald-400 border border-emerald-500/20">
                        <CheckCircle2 className="h-3 w-3" />
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#121212] p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <h3 className="text-base font-semibold text-white">
                {resolutionStatus === "fulfilled" ? "Fulfill Data Subject Request" : "Reject Data Subject Request"}
              </h3>
              <button onClick={handleCloseModal} className="text-white/60 hover:text-white transition-colors text-sm">
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

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-white/60 mb-1.5">
                  Compliance / Legal Notes (Required for NPC Audit)
                </label>
                <textarea
                  required
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Detail actions taken or grounds for refusal under RA 10173..."
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
                    resolutionStatus === "fulfilled"
                      ? "bg-emerald-400 hover:bg-emerald-300"
                      : "bg-red-400 hover:bg-red-300"
                  }`}
                >
                  {isSubmitting ? "Submitting..." : "Confirm Decision"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
