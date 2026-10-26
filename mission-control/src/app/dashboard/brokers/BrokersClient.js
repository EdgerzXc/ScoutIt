"use client";

import { useState } from "react";
import { setBrokerLiveStatus, setBrokerLicenseVerification } from "./actions";
import {
  Users,
  ShieldCheck,
  ShieldAlert,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  BadgeCheck,
  Building,
  MapPin,
  ExternalLink,
} from "lucide-react";

export default function BrokersClient({ initialBrokers = [], initialError = null, canMutate = false }) {
  const [brokers, setBrokers] = useState(initialBrokers);
  const [filter, setFilter] = useState("all"); // "all" | "live" | "suspended" | "unverified"
  const [search, setSearch] = useState("");
  const [selectedBroker, setSelectedBroker] = useState(null);
  const [modalType, setModalType] = useState(null); // "takedown" | "restore" | "verify_prc" | "revoke_prc"
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [toast, setToast] = useState(null);

  const totalBrokers = brokers.length;
  const liveBrokers = brokers.filter((b) => b.isLive).length;
  const suspendedBrokers = brokers.filter((b) => !b.isLive).length;
  const verifiedPrcBrokers = brokers.filter((b) => b.isLicenseVerified).length;

  const filteredBrokers = brokers.filter((b) => {
    if (filter === "live" && !b.isLive) return false;
    if (filter === "suspended" && b.isLive) return false;
    if (filter === "unverified" && b.isLicenseVerified) return false;

    if (search.trim()) {
      const q = search.toLowerCase();
      const matchName = b.name?.toLowerCase().includes(q);
      const matchLicense = b.license?.toLowerCase().includes(q);
      const matchSpecialty = b.specialty?.toLowerCase().includes(q);
      const matchLocation = b.location?.toLowerCase().includes(q);
      return matchName || matchLicense || matchSpecialty || matchLocation;
    }
    return true;
  });

  const handleOpenModal = (broker, type) => {
    setSelectedBroker(broker);
    setModalType(type);
    setReason("");
    setActionError(null);
  };

  const handleCloseModal = () => {
    setSelectedBroker(null);
    setModalType(null);
    setReason("");
    setActionError(null);
  };

  const handleSubmitAction = async (e) => {
    e.preventDefault();
    if (!selectedBroker || !modalType) return;

    if (!reason.trim() || reason.trim().length < 10) {
      setActionError("Please provide a substantive reason (at least 10 characters) for staff audit.");
      return;
    }

    setIsSubmitting(true);
    setActionError(null);

    try {
      if (modalType === "takedown" || modalType === "restore") {
        const isLive = modalType === "restore";
        const res = await setBrokerLiveStatus({
          recordId: selectedBroker.recordId,
          brokerId: selectedBroker.brokerId,
          isLive,
          reason: reason.trim(),
        });

        if (res.success) {
          setBrokers((prev) =>
            prev.map((b) =>
              b.recordId === selectedBroker.recordId ? { ...b, isLive } : b
            )
          );
          setToast(
            isLive
              ? `Broker "${selectedBroker.name}" restored to live directory.`
              : `Broker "${selectedBroker.name}" suspended from live directory.`
          );
          handleCloseModal();
          setTimeout(() => setToast(null), 5000);
        }
      } else if (modalType === "verify_prc" || modalType === "revoke_prc") {
        const isVerified = modalType === "verify_prc";
        const res = await setBrokerLicenseVerification({
          recordId: selectedBroker.recordId,
          brokerId: selectedBroker.brokerId,
          isVerified,
          reason: reason.trim(),
        });

        if (res.success) {
          setBrokers((prev) =>
            prev.map((b) =>
              b.recordId === selectedBroker.recordId
                ? { ...b, isLicenseVerified: isVerified }
                : b
            )
          );
          setToast(
            isVerified
              ? `PRC license for "${selectedBroker.name}" marked verified.`
              : `PRC license verification for "${selectedBroker.name}" revoked.`
          );
          handleCloseModal();
          setTimeout(() => setToast(null), 5000);
        }
      }
    } catch (err) {
      setActionError(err.message || "Action failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div className="flex items-center gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 text-emerald-400">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <span className="text-sm">{toast}</span>
        </div>
      )}

      {initialError && (
        <div className="flex items-center gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-amber-400">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <span className="text-sm">Airtable status: {initialError}</span>
        </div>
      )}

      {/* Metric Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="rounded-xl border border-white/5 bg-[#121212] p-5">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs uppercase tracking-wider text-white/60">Total Profiles</span>
            <Users className="h-4 w-4 text-white/60" />
          </div>
          <div className="mt-2 text-2xl font-semibold text-white">{totalBrokers}</div>
          <div className="mt-1 text-xs text-white/60">In Airtable BROKERS_CMS</div>
        </div>

        <div className="rounded-xl border border-white/5 bg-[#121212] p-5">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs uppercase tracking-wider text-white/60">Live on Site</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-semibold text-emerald-400">{liveBrokers}</div>
          <div className="mt-1 text-xs text-white/60">Visible on public directory</div>
        </div>

        <div className="rounded-xl border border-white/5 bg-[#121212] p-5">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs uppercase tracking-wider text-white/60">Suspended / Offline</span>
            <ShieldAlert className="h-4 w-4 text-red-400" />
          </div>
          <div className="mt-2 text-2xl font-semibold text-red-400">{suspendedBrokers}</div>
          <div className="mt-1 text-xs text-white/60">Taken down or draft state</div>
        </div>

        <div className="rounded-xl border border-white/5 bg-[#121212] p-5">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs uppercase tracking-wider text-white/60">PRC Verified</span>
            <BadgeCheck className="h-4 w-4 text-[#E8AE3C]" />
          </div>
          <div className="mt-2 text-2xl font-semibold text-[#E8AE3C]">{verifiedPrcBrokers}</div>
          <div className="mt-1 text-xs text-white/60">RA 9646 license checked</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setFilter("all")}
            className={`rounded-lg px-3 py-1.5 text-xs font-mono uppercase tracking-wider transition-colors ${
              filter === "all"
                ? "bg-[#E8AE3C] text-black font-semibold"
                : "bg-white/5 text-white/70 hover:bg-white/10"
            }`}
          >
            All ({totalBrokers})
          </button>
          <button
            onClick={() => setFilter("live")}
            className={`rounded-lg px-3 py-1.5 text-xs font-mono uppercase tracking-wider transition-colors ${
              filter === "live"
                ? "bg-emerald-400 text-black font-semibold"
                : "bg-white/5 text-white/70 hover:bg-white/10"
            }`}
          >
            Live ({liveBrokers})
          </button>
          <button
            onClick={() => setFilter("suspended")}
            className={`rounded-lg px-3 py-1.5 text-xs font-mono uppercase tracking-wider transition-colors ${
              filter === "suspended"
                ? "bg-red-400 text-black font-semibold"
                : "bg-white/5 text-white/70 hover:bg-white/10"
            }`}
          >
            Suspended ({suspendedBrokers})
          </button>
          <button
            onClick={() => setFilter("unverified")}
            className={`rounded-lg px-3 py-1.5 text-xs font-mono uppercase tracking-wider transition-colors ${
              filter === "unverified"
                ? "bg-amber-400 text-black font-semibold"
                : "bg-white/5 text-white/70 hover:bg-white/10"
            }`}
          >
            Unverified PRC ({totalBrokers - verifiedPrcBrokers})
          </button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/60" />
          <input
            type="text"
            placeholder="Search broker name, license, niche..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-64 rounded-lg border border-white/10 bg-black/40 pl-9 pr-3 py-1.5 text-xs text-white placeholder-white/40 focus:border-[#E8AE3C] focus:outline-none"
          />
        </div>
      </div>

      {/* Brokers Table */}
      {filteredBrokers.length === 0 ? (
        <div className="rounded-xl border border-white/5 bg-[#121212] p-12 text-center">
          <Users className="mx-auto h-8 w-8 text-white/60 mb-3" />
          <div className="text-sm font-medium text-white/80">No brokers found</div>
          <div className="text-xs text-white/60 mt-1">
            No broker profiles match the current filter and search conditions.
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-white/5 bg-[#121212]">
          <table className="w-full text-left text-xs text-white/70">
            <thead className="border-b border-white/5 bg-black/30 font-mono text-xs uppercase tracking-wider text-white/60">
              <tr>
                <th className="px-5 py-3">Broker &amp; Title</th>
                <th className="px-4 py-3">Location &amp; Niche</th>
                <th className="px-4 py-3">PRC License</th>
                <th className="px-4 py-3">Site Status</th>
                {canMutate && <th className="px-5 py-3 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredBrokers.map((b) => (
                <tr key={b.recordId} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      {b.image ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={b.image}
                          alt={b.name}
                          className="h-10 w-10 rounded-full object-cover border border-white/10"
                        />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 border border-white/10 text-white/60 font-mono text-sm">
                          {b.name.charAt(0)}
                        </div>
                      )}
                      <div>
                        <div className="font-medium text-white flex items-center gap-2">
                          <span>{b.name}</span>
                          {b.isExample && (
                            <span className="rounded bg-white/10 px-1.5 py-0.2 font-mono text-xs uppercase text-white/60">
                              Example
                            </span>
                          )}
                        </div>
                        <div className="text-white/60 text-xs mt-0.5">{b.title || "Real Estate Advisor"}</div>
                        {b.supabaseEmail && (
                          <div className="text-white/60 text-xs font-mono mt-0.5 truncate max-w-[200px]">
                            {b.supabaseEmail}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>

                  <td className="px-4 py-4">
                    <div className="flex items-center gap-1.5 text-white/80">
                      <MapPin className="h-3 w-3 text-white/60 shrink-0" />
                      <span>{b.location || "Metro Manila"}</span>
                    </div>
                    {b.niche.length > 0 && (
                      <div className="flex items-center gap-1 flex-wrap mt-1.5">
                        {b.niche.slice(0, 2).map((n) => (
                          <span
                            key={n}
                            className="rounded bg-white/5 px-1.5 py-0.5 font-mono text-xs uppercase text-white/60 border border-white/5"
                          >
                            {n}
                          </span>
                        ))}
                        {b.niche.length > 2 && (
                          <span className="font-mono text-xs text-white/60">+{b.niche.length - 2}</span>
                        )}
                      </div>
                    )}
                  </td>

                  <td className="px-4 py-4">
                    <div className="flex items-center gap-1.5">
                      {b.isLicenseVerified ? (
                        <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 px-2 py-0.5 font-mono text-xs uppercase text-emerald-400 border border-emerald-500/20">
                          <BadgeCheck className="h-3 w-3" />
                          Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded bg-amber-500/10 px-2 py-0.5 font-mono text-xs uppercase text-amber-400 border border-amber-500/20">
                          Unverified
                        </span>
                      )}
                    </div>
                    <div className="font-mono text-xs text-white/60 mt-1">
                      {b.license || "No license on record"}
                    </div>
                  </td>

                  <td className="px-4 py-4">
                    {b.isLive ? (
                      <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 px-2 py-0.5 font-mono text-xs uppercase text-emerald-400 border border-emerald-500/20">
                        <CheckCircle2 className="h-3 w-3" />
                        Live on Site
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded bg-red-500/10 px-2 py-0.5 font-mono text-xs uppercase text-red-400 border border-red-500/20">
                        <XCircle className="h-3 w-3" />
                        Suspended
                      </span>
                    )}
                  </td>

                  {canMutate && (
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Live Status Toggle */}
                        {b.isLive ? (
                          <button
                            type="button"
                            onClick={() => handleOpenModal(b, "takedown")}
                            className="rounded-lg border border-red-500/30 bg-red-500/10 px-2.5 py-1 text-xs text-red-400 hover:bg-red-500/20 transition-colors"
                          >
                            Take Down
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleOpenModal(b, "restore")}
                            className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                          >
                            Restore Live
                          </button>
                        )}

                        {/* PRC Toggle */}
                        {b.isLicenseVerified ? (
                          <button
                            type="button"
                            onClick={() => handleOpenModal(b, "revoke_prc")}
                            className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-white/60 hover:bg-white/10 transition-colors"
                          >
                            Revoke PRC
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleOpenModal(b, "verify_prc")}
                            className="rounded-lg border border-[#E8AE3C]/30 bg-[#E8AE3C]/10 px-2.5 py-1 text-xs text-[#E8AE3C] hover:bg-[#E8AE3C]/20 transition-colors"
                          >
                            Verify PRC
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Confirmation Modal */}
      {selectedBroker && modalType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#121212] p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <h3 className="text-base font-semibold text-white">
                {modalType === "takedown" && "Take Down Broker Profile"}
                {modalType === "restore" && "Restore Broker Profile to Live Site"}
                {modalType === "verify_prc" && "Verify Broker PRC License"}
                {modalType === "revoke_prc" && "Revoke PRC Verification"}
              </h3>
              <button onClick={handleCloseModal} className="text-white/60 hover:text-white transition-colors text-sm">
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitAction} className="space-y-4 mt-4">
              <div className="text-xs text-white/70 space-y-1.5 rounded-lg border border-white/5 bg-black/30 p-3">
                <div className="flex justify-between">
                  <span className="text-white/60">Broker:</span>
                  <span className="font-semibold text-white">{selectedBroker.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">License:</span>
                  <span className="font-mono text-[#E8AE3C]">{selectedBroker.license || "None on record"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Airtable Record:</span>
                  <span className="font-mono text-white/60">{selectedBroker.recordId}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-white/60 mb-1.5">
                  Reason for Staff Audit &amp; Broker Notice (Required)
                </label>
                <textarea
                  required
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Explain why this status is being modified..."
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
                    modalType === "takedown" || modalType === "revoke_prc"
                      ? "bg-red-400 hover:bg-red-300"
                      : "bg-[#E8AE3C] hover:bg-[#F7C64E]"
                  }`}
                >
                  {isSubmitting ? "Applying..." : "Confirm Decision"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
