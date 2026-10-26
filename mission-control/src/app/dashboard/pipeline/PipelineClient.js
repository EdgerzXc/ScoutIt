"use client";

import { useState } from "react";
import { exportWaitlistCsv } from "./actions";
import { isViewingStalled, formatWaitlistRole } from "@/lib/pipelinePolicy.mjs";
import {
  TrendingUp,
  Users,
  Calendar,
  Clock,
  Download,
  AlertTriangle,
  Search,
  ExternalLink,
  Target,
  CheckCircle2,
  Video,
} from "lucide-react";

export default function PipelineClient({
  initialWaitlist = [],
  initialViewings = [],
  initialContacts = [],
  initialBounties = [],
  errors = {},
}) {
  const [tab, setTab] = useState("waitlist"); // "waitlist" | "viewings" | "contacts" | "bounties"
  const [search, setSearch] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState(null);

  const stalledViewings = initialViewings.filter((v) => isViewingStalled(v));
  const activeViewings = initialViewings.filter((v) => ["scheduled", "rescheduled", "confirmed"].includes(v.status));

  // Filter handlers
  const filteredWaitlist = initialWaitlist.filter((w) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      w.email?.toLowerCase().includes(q) ||
      w.role?.toLowerCase().includes(q) ||
      w.source?.toLowerCase().includes(q)
    );
  });

  const filteredViewings = initialViewings.filter((v) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      v.property_id?.toLowerCase().includes(q) ||
      v.status?.toLowerCase().includes(q) ||
      v.host_email?.toLowerCase().includes(q) ||
      v.guest_email?.toLowerCase().includes(q)
    );
  });

  const filteredContacts = initialContacts.filter((c) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      c.full_name?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.company_name?.toLowerCase().includes(q) ||
      c.contact_type?.toLowerCase().includes(q)
    );
  });

  const filteredBounties = initialBounties.filter((b) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      b.target_field?.toLowerCase().includes(q) ||
      b.property_id?.toLowerCase().includes(q) ||
      b.status?.toLowerCase().includes(q)
    );
  });

  const handleExportCsv = async () => {
    setIsExporting(true);
    setExportError(null);
    try {
      const res = await exportWaitlistCsv();
      if (res.success && res.csv) {
        const blob = new Blob([res.csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute(
          "download",
          `scoutit_founding_waitlist_${new Date().toISOString().slice(0, 10)}.csv`
        );
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        setExportError("Export returned empty data.");
      }
    } catch (err) {
      setExportError(err.message || "Failed to export waitlist CSV.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Metric Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="rounded-xl border border-white/5 bg-[#121212] p-5">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs uppercase tracking-wider text-white/60">Founding Waitlist</span>
            <Users className="h-4 w-4 text-[#E8AE3C]" />
          </div>
          <div className="mt-2 text-2xl font-semibold text-white">{initialWaitlist.length}</div>
          <div className="mt-1 text-xs text-white/60">Pre-launch registered members</div>
        </div>

        <div className="rounded-xl border border-white/5 bg-[#121212] p-5">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs uppercase tracking-wider text-white/60">Viewing Bookings</span>
            <Calendar className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-semibold text-white">
            {activeViewings.length}
            {stalledViewings.length > 0 && (
              <span className="ml-2 text-xs font-mono text-amber-400">({stalledViewings.length} stalled)</span>
            )}
          </div>
          <div className="mt-1 text-xs text-white/60">Active calendar appointments</div>
        </div>

        <div className="rounded-xl border border-white/5 bg-[#121212] p-5">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs uppercase tracking-wider text-white/60">Inbound Leads</span>
            <TrendingUp className="h-4 w-4 text-white/60" />
          </div>
          <div className="mt-2 text-2xl font-semibold text-white">{initialContacts.length}</div>
          <div className="mt-1 text-xs text-white/60">CRM prospective tenant contacts</div>
        </div>

        <div className="rounded-xl border border-white/5 bg-[#121212] p-5">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs uppercase tracking-wider text-white/60">QuestIT Bounties</span>
            <Target className="h-4 w-4 text-[#E8AE3C]" />
          </div>
          <div className="mt-2 text-2xl font-semibold text-white">{initialBounties.length}</div>
          <div className="mt-1 text-xs text-white/60">Data enrichment claims on record</div>
        </div>
      </div>

      {exportError && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400">
          {exportError}
        </div>
      )}

      {/* Tabs and Search Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setTab("waitlist")}
            className={`rounded-lg px-3 py-1.5 text-xs font-mono uppercase tracking-wider transition-colors ${
              tab === "waitlist"
                ? "bg-[#E8AE3C] text-black font-semibold"
                : "bg-white/5 text-white/70 hover:bg-white/10"
            }`}
          >
            Waitlist ({initialWaitlist.length})
          </button>
          <button
            onClick={() => setTab("viewings")}
            className={`rounded-lg px-3 py-1.5 text-xs font-mono uppercase tracking-wider transition-colors ${
              tab === "viewings"
                ? "bg-[#E8AE3C] text-black font-semibold"
                : "bg-white/5 text-white/70 hover:bg-white/10"
            }`}
          >
            Viewings ({initialViewings.length})
          </button>
          <button
            onClick={() => setTab("contacts")}
            className={`rounded-lg px-3 py-1.5 text-xs font-mono uppercase tracking-wider transition-colors ${
              tab === "contacts"
                ? "bg-[#E8AE3C] text-black font-semibold"
                : "bg-white/5 text-white/70 hover:bg-white/10"
            }`}
          >
            Leads &amp; Inquiries ({initialContacts.length})
          </button>
          <button
            onClick={() => setTab("bounties")}
            className={`rounded-lg px-3 py-1.5 text-xs font-mono uppercase tracking-wider transition-colors ${
              tab === "bounties"
                ? "bg-[#E8AE3C] text-black font-semibold"
                : "bg-white/5 text-white/70 hover:bg-white/10"
            }`}
          >
            Bounties ({initialBounties.length})
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/60" />
            <input
              type="text"
              placeholder="Search pipeline..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full sm:w-60 rounded-lg border border-white/10 bg-black/40 pl-9 pr-3 py-1.5 text-xs text-white placeholder-white/40 focus:border-[#E8AE3C] focus:outline-none"
            />
          </div>

          {tab === "waitlist" && (
            <button
              onClick={handleExportCsv}
              disabled={isExporting}
              className="flex items-center gap-1.5 rounded-lg border border-[#E8AE3C]/30 bg-[#E8AE3C]/10 px-3 py-1.5 text-xs font-medium text-[#E8AE3C] hover:bg-[#E8AE3C]/20 transition-colors whitespace-nowrap"
            >
              <Download className="h-3.5 w-3.5" />
              {isExporting ? "Exporting..." : "Export CSV"}
            </button>
          )}
        </div>
      </div>

      {/* Tab: Waitlist */}
      {tab === "waitlist" && (
        <div className="overflow-x-auto rounded-xl border border-white/5 bg-[#121212]">
          <table className="w-full text-left text-xs text-white/70">
            <thead className="border-b border-white/5 bg-black/30 font-mono text-xs uppercase tracking-wider text-white/60">
              <tr>
                <th className="px-5 py-3">Email Address</th>
                <th className="px-4 py-3">Role Requested</th>
                <th className="px-4 py-3">Tier</th>
                <th className="px-4 py-3">Acquisition Source</th>
                <th className="px-5 py-3 text-right">Signed Up</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono">
              {filteredWaitlist.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-white/60">
                    No waitlist signups recorded.
                  </td>
                </tr>
              ) : (
                filteredWaitlist.map((w) => (
                  <tr key={w.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-3.5 text-white font-medium">{w.email}</td>
                    <td className="px-4 py-3.5">
                      <span className="rounded bg-white/5 px-2 py-0.5 text-xs text-[#E8AE3C] border border-white/10">
                        {formatWaitlistRole(w.role)}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-white/60">{w.tier || "Founding Member"}</td>
                    <td className="px-4 py-3.5 text-white/60">{w.source || "organic"}</td>
                    <td className="px-5 py-3.5 text-right text-white/60 text-xs">
                      {new Date(w.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab: Viewings */}
      {tab === "viewings" && (
        <div className="overflow-x-auto rounded-xl border border-white/5 bg-[#121212]">
          <table className="w-full text-left text-xs text-white/70">
            <thead className="border-b border-white/5 bg-black/30 font-mono text-xs uppercase tracking-wider text-white/60">
              <tr>
                <th className="px-5 py-3">Scheduled Time</th>
                <th className="px-4 py-3">Property Reference</th>
                <th className="px-4 py-3">Host (Asset/Broker)</th>
                <th className="px-4 py-3">Guest (Client)</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-5 py-3 text-right">Channel</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono">
              {filteredViewings.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-white/60">
                    No viewing appointments scheduled.
                  </td>
                </tr>
              ) : (
                filteredViewings.map((v) => {
                  const isStalled = isViewingStalled(v);
                  return (
                    <tr key={v.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-5 py-3.5 text-white font-medium">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-white/60" />
                          <span>{new Date(v.scheduled_at).toLocaleString()}</span>
                        </div>
                        {isStalled && (
                          <span className="inline-flex items-center gap-1 mt-1 text-xs text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                            <Clock className="h-2.5 w-2.5" /> Overdue / Stalled
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-white/80">{v.property_id || "Direct Consultation"}</td>
                      <td className="px-4 py-3.5">
                        <div className="text-white truncate max-w-[150px]">{v.host_name || "Host"}</div>
                        <div className="text-white/60 text-xs truncate max-w-[150px]">{v.host_email || v.host_id}</div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="text-white truncate max-w-[150px]">{v.guest_name || "Guest"}</div>
                        <div className="text-white/60 text-xs truncate max-w-[150px]">{v.guest_email || v.guest_id}</div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`rounded px-2 py-0.5 text-xs uppercase border ${
                            v.status === "confirmed"
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                              : v.status === "scheduled"
                              ? "bg-[#E8AE3C]/10 text-[#E8AE3C] border-[#E8AE3C]/20"
                              : "bg-white/5 text-white/60 border-white/10"
                          }`}
                        >
                          {v.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        {v.meet_link ? (
                          <a
                            href={v.meet_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-[#E8AE3C] hover:underline"
                          >
                            <Video className="h-3 w-3" /> Meet Link
                          </a>
                        ) : (
                          <span className="text-white/60 text-xs">In-Person</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab: Contacts / Leads */}
      {tab === "contacts" && (
        <div className="overflow-x-auto rounded-xl border border-white/5 bg-[#121212]">
          <table className="w-full text-left text-xs text-white/70">
            <thead className="border-b border-white/5 bg-black/30 font-mono text-xs uppercase tracking-wider text-white/60">
              <tr>
                <th className="px-5 py-3">Lead / Contact</th>
                <th className="px-4 py-3">Company</th>
                <th className="px-4 py-3">Email &amp; Phone</th>
                <th className="px-4 py-3">Contact Type</th>
                <th className="px-4 py-3">Acquisition Source</th>
                <th className="px-5 py-3 text-right">Recorded At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredContacts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-white/60 font-mono">
                    No CRM contacts recorded.
                  </td>
                </tr>
              ) : (
                filteredContacts.map((c) => (
                  <tr key={c.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-3.5 font-medium text-white">{c.full_name}</td>
                    <td className="px-4 py-3.5 text-white/70">{c.company_name || "—"}</td>
                    <td className="px-4 py-3.5 font-mono text-xs">
                      <div className="text-white/80">{c.email || "—"}</div>
                      <div className="text-white/60">{c.phone || "—"}</div>
                    </td>
                    <td className="px-4 py-3.5 font-mono text-xs">
                      <span className="rounded bg-white/5 px-2 py-0.5 text-white/70 border border-white/10 uppercase">
                        {c.contact_type}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 font-mono text-xs text-white/60">{c.source}</td>
                    <td className="px-5 py-3.5 text-right font-mono text-xs text-white/60">
                      {new Date(c.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab: Bounties */}
      {tab === "bounties" && (
        <div className="overflow-x-auto rounded-xl border border-white/5 bg-[#121212]">
          <table className="w-full text-left text-xs text-white/70">
            <thead className="border-b border-white/5 bg-black/30 font-mono text-xs uppercase tracking-wider text-white/60">
              <tr>
                <th className="px-5 py-3">Target Field</th>
                <th className="px-4 py-3">Property Ref</th>
                <th className="px-4 py-3">Researcher</th>
                <th className="px-4 py-3">Payout</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-5 py-3 text-right">Claim Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono">
              {filteredBounties.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-white/60">
                    No data bounty claims on record.
                  </td>
                </tr>
              ) : (
                filteredBounties.map((b) => (
                  <tr key={b.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-3.5 text-white font-medium">{b.target_field}</td>
                    <td className="px-4 py-3.5 text-white/70">{b.property_id}</td>
                    <td className="px-4 py-3.5">
                      <div className="text-white">{b.researcher_name || "Researcher"}</div>
                      <div className="text-white/60 text-xs">{b.researcher_email || b.researcher_user_id}</div>
                    </td>
                    <td className="px-4 py-3.5 text-[#E8AE3C] font-semibold">{b.payout_connects} Connects</td>
                    <td className="px-4 py-3.5">
                      <span className="rounded bg-white/5 px-2 py-0.5 text-xs uppercase text-white/70 border border-white/10">
                        {b.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right text-white/60 text-xs">
                      {new Date(b.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
