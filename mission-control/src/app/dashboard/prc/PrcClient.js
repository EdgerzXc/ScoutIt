"use client";

import { useState, useTransition } from "react";
import { updatePrcVerificationAction } from "./actions";
import { ShieldCheck, ShieldAlert, Award, Calendar, Search, RefreshCw, CheckCircle2, XCircle, AlertCircle } from "lucide-react";

export default function PrcClient({ initialProfiles, staffTier }) {
  const [profiles, setProfiles] = useState(initialProfiles);
  const [filter, setFilter] = useState("all"); // all, pending, verified
  const [search, setSearch] = useState("");
  const [loadingId, setLoadingId] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [, startTransition] = useTransition();

  const isOpsManager = staffTier >= 2;

  const filtered = profiles.filter((p) => {
    if (filter === "pending" && p.prc_verified) return false;
    if (filter === "verified" && !p.prc_verified) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        p.display_name?.toLowerCase().includes(q) ||
        p.email?.toLowerCase().includes(q) ||
        p.prc_license?.toLowerCase().includes(q) ||
        p.firm?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleToggleVerification = async (profile, newVerified) => {
    if (!isOpsManager) return;
    setError(null);
    setSuccess(null);
    setLoadingId(profile.id);

    try {
      const res = await updatePrcVerificationAction({
        userId: profile.id,
        verified: newVerified,
        prcExpiry: profile.prc_expiry || null,
        reason: newVerified
          ? `Verified PRC license ${profile.prc_license} by staff`
          : `Revoked PRC verification for license ${profile.prc_license}`,
      });

      if (res.error) {
        setError(res.error);
      } else {
        setSuccess(
          newVerified
            ? `PRC license verified for ${profile.display_name}. Public catalogue cache purged.`
            : `PRC verification revoked for ${profile.display_name}.`
        );
        setProfiles((prev) =>
          prev.map((p) =>
            p.id === profile.id
              ? {
                  ...p,
                  prc_verified: newVerified,
                  prc_verified_at: newVerified ? new Date().toISOString() : null,
                }
              : p
          )
        );
      }
    } catch (err) {
      setError(err.message || "Failed to update verification state.");
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Controls & Metrics */}
      <div className="p-6 rounded-xl border border-line bg-surface">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            {["all", "pending", "verified"].map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono uppercase tracking-wider transition-colors ${
                  filter === tab
                    ? "bg-gold text-black font-medium"
                    : "bg-black/40 text-white/60 hover:text-white border border-line"
                }`}
              >
                {tab} ({
                  tab === "all"
                    ? profiles.length
                    : tab === "pending"
                    ? profiles.filter((p) => !p.prc_verified).length
                    : profiles.filter((p) => p.prc_verified).length
                })
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-white/60" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter by name, firm, license..."
              className="w-full pl-9 pr-3 py-1.5 bg-black/60 border border-line rounded-lg text-xs text-white placeholder-white/40 focus:outline-none focus:border-gold"
            />
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

      {/* Profiles Queue */}
      <div className="p-6 rounded-xl border border-line bg-surface">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-line text-white/60 font-mono text-xs uppercase tracking-wider">
                <th className="pb-3">Practitioner</th>
                <th className="pb-3">Firm / Organization</th>
                <th className="pb-3">PRC License #</th>
                <th className="pb-3">DHSUD #</th>
                <th className="pb-3">Expiry Date</th>
                <th className="pb-3">Status</th>
                <th className="pb-3 text-right">Verification Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/40">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-white/60 font-mono">
                    No practitioners matching the current filter.
                  </td>
                </tr>
              ) : (
                filtered.map((profile) => {
                  const isVerified = Boolean(profile.prc_verified);
                  const isBusy = loadingId === profile.id;

                  return (
                    <tr key={profile.id} className="hover:bg-white/[0.02]">
                      <td className="py-3.5">
                        <div className="font-medium text-white">{profile.display_name}</div>
                        <div className="text-xs font-mono text-white/60">{profile.email || profile.id}</div>
                      </td>
                      <td className="py-3.5 text-white/70">{profile.firm || "—"}</td>
                      <td className="py-3.5 font-mono text-gold font-medium">{profile.prc_license}</td>
                      <td className="py-3.5 font-mono text-white/60">{profile.dhsud_number || "—"}</td>
                      <td className="py-3.5 font-mono text-white/60">
                        {profile.prc_expiry || "Not recorded"}
                      </td>
                      <td className="py-3.5">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-mono uppercase tracking-wider ${
                            isVerified
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                              : "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                          }`}
                        >
                          {isVerified ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                          {isVerified ? "Verified" : "Pending Check"}
                        </span>
                      </td>
                      <td className="py-3.5 text-right">
                        {isOpsManager ? (
                          isVerified ? (
                            <button
                              onClick={() => handleToggleVerification(profile, false)}
                              disabled={isBusy}
                              className="px-3 py-1 rounded border border-rose-500/30 bg-rose-500/10 text-rose-400 text-xs font-mono hover:bg-rose-500/20 transition-colors disabled:opacity-50"
                            >
                              {isBusy ? "Updating..." : "Revoke"}
                            </button>
                          ) : (
                            <button
                              onClick={() => handleToggleVerification(profile, true)}
                              disabled={isBusy}
                              className="px-3 py-1 rounded bg-gold text-black text-xs font-mono font-medium hover:bg-gold/90 transition-colors disabled:opacity-50"
                            >
                              {isBusy ? "Verifying..." : "Verify License"}
                            </button>
                          )
                        ) : (
                          <span className="text-xs font-mono text-white/60 uppercase">Tier 2+ required</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
