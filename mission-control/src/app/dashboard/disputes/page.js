import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentStaff, TIERS } from "@/lib/rbac";
import { openDispute, addDisputeNote, claimDispute, closeDispute } from "./actions";
import { Scale, Plus, MessageSquare, Gavel, CheckCircle2, XCircle, UserCheck } from "lucide-react";

// Disputes Hub — mediation workflow. Reads disputes + dispute_events
// (service-role). Degrades to an empty hub if 0006 is not yet applied.

async function safe(promise) {
  try {
    const result = await promise;
    if (result.error) throw new Error(result.error.message);
    return { data: result.data ?? [], error: null };
  } catch (err) {
    return { data: [], error: err.message || String(err) };
  }
}

const KIND_LABELS = {
  broker_vs_broker: "Broker vs Broker",
  broker_vs_owner: "Broker vs Owner",
  listing_conflict: "Listing Conflict",
  other: "Other",
};

const PRIORITY_STYLE = {
  critical: "text-red-400 border-red-400/25 bg-red-400/10",
  high: "text-orange-400 border-orange-400/25 bg-orange-400/10",
  normal: "text-white/70 border-white/10",
  low: "text-white/70 border-white/10",
};

export default async function DisputesPage() {
  const staff = await getCurrentStaff();
  if (!staff) redirect("/?error=NotAuthorized");
  const canClose = staff.tier >= TIERS.OPS_MANAGER;

  const admin = createAdminClient();
  const active = await safe(
    admin
      .from("disputes")
      .select("*")
      .in("status", ["open", "investigating"])
      .order("priority", { ascending: false })
      .order("created_at", { ascending: true })
      .limit(50)
  );

  const ids = active.data.map((d) => d.id);
  const events = ids.length
    ? await safe(
        admin
          .from("dispute_events")
          .select("id, dispute_id, author_email, event_type, body, created_at")
          .in("dispute_id", ids)
          .order("created_at", { ascending: true })
      )
    : { data: [], error: null };

  const closed = await safe(
    admin
      .from("disputes")
      .select("id, kind, title, status, resolution, resolved_at")
      .in("status", ["resolved", "dismissed"])
      .order("resolved_at", { ascending: false })
      .limit(15)
  );

  const eventsByDispute = {};
  for (const ev of events.data) {
    (eventsByDispute[ev.dispute_id] ||= []).push(ev);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <Scale className="w-5 h-5 text-[#E8AE3C]" />
            Disputes Hub
          </h1>
          <p className="text-[12px] uppercase tracking-wide text-white/70 mt-1">
            Broker &amp; owner conflicts · mediation &amp; resolution
          </p>
        </div>
        <span className="text-xs text-white/70 whitespace-nowrap">{active.data.length} active</span>
      </div>

      {active.error && (
        <div className="text-xs text-white/70 bg-white/5 border border-white/10 rounded-xl p-4">
          Disputes unavailable ({active.error}). Apply migration
          <span className="font-mono text-white/70"> 0006_disputes.sql </span>
          to activate this module.
        </div>
      )}

      {/* Philippine RESA Law (RA 9646) AI Compliance Guidance */}
      <div className="bg-black/60 border border-[rgba(232,174,60,0.25)] rounded-xl p-5 space-y-2">
        <h3 className="text-xs font-mono uppercase tracking-widest text-[#E8AE3C] flex items-center gap-2">
          <Gavel className="w-4 h-4 text-[#E8AE3C]" />
          Philippine RESA Law (RA 9646) Legal Mediation Standard
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-white/70 pt-1">
          <div className="bg-white/5 border border-white/5 rounded-lg p-3">
            <div className="font-semibold text-white mb-1">Sec. 29 · PRC License Mandate</div>
            <p className="text-[12px] text-white/70">Only PRC-licensed real estate brokers or accredited salespersons are legally entitled to claim commission split disputes.</p>
          </div>
          <div className="bg-white/5 border border-white/5 rounded-lg p-3">
            <div className="font-semibold text-white mb-1">Sec. 31 · Written Authority</div>
            <p className="text-[12px] text-white/70">Exclusive listing disputes require signed Authority to Negotiate (ATS/ATP) from the verified owner.</p>
          </div>
          <div className="bg-white/5 border border-white/5 rounded-lg p-3">
            <div className="font-semibold text-white mb-1">Display-Only Rule</div>
            <p className="text-[12px] text-white/70">ScoutIt is a display-only briefing platform; platform handshakes do not substitute for formal PRC sales agreements.</p>
          </div>
        </div>
      </div>

      {/* Open a new dispute */}
      <details className="bg-[#121212] border border-white/5 rounded-xl overflow-hidden">
        <summary className="flex items-center gap-2 px-6 py-4 cursor-pointer text-sm text-white/70 hover:text-white select-none">
          <Plus className="w-4 h-4 text-[#E8AE3C]" />
          Log a new dispute
        </summary>
        <form action={openDispute} className="px-6 pb-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="text-xs text-white/70 sm:col-span-2">
            Title (required)
            <input
              name="title"
              required
              placeholder="e.g. Two brokers claim the same BGC unit"
              className="mt-1 w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/70"
            />
          </label>
          <label className="text-xs text-white/70">
            Kind
            <select name="kind" className="mt-1 w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white">
              <option value="broker_vs_broker">Broker vs Broker</option>
              <option value="broker_vs_owner">Broker vs Owner</option>
              <option value="listing_conflict">Listing Conflict</option>
              <option value="other">Other</option>
            </select>
          </label>
          <label className="text-xs text-white/70">
            Priority
            <select name="priority" className="mt-1 w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white" defaultValue="normal">
              <option value="low">Low</option>
              <option value="normal">Normal</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </label>
          <label className="text-xs text-white/70">
            Complainant
            <input name="complainant" placeholder="who raised it" className="mt-1 w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/70" />
          </label>
          <label className="text-xs text-white/70">
            Respondent
            <input name="respondent" placeholder="the other party" className="mt-1 w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/70" />
          </label>
          <label className="text-xs text-white/70 sm:col-span-2">
            Property reference (optional)
            <input name="propertyRef" placeholder="property slug / id" className="mt-1 w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono placeholder:text-white/70" />
          </label>
          <label className="text-xs text-white/70 sm:col-span-2">
            Description
            <textarea name="description" rows={2} placeholder="What happened?" className="mt-1 w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/70" />
          </label>
          <div className="sm:col-span-2">
            <button className="px-4 py-2 rounded-lg text-sm font-medium bg-[rgba(232,174,60,0.10)] hover:bg-[rgba(232,174,60,0.18)] text-[#F7C64E] border border-[rgba(232,174,60,0.25)] transition-colors">
              Open dispute
            </button>
          </div>
        </form>
      </details>

      {/* Active disputes */}
      {active.data.length === 0 && !active.error ? (
        <div className="bg-[#121212] border border-white/5 rounded-xl p-8 text-center">
          <Gavel className="w-6 h-6 text-[#E8AE3C] mx-auto mb-3" />
          <p className="text-sm text-white/70">No active disputes. The peace holds.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {active.data.map((d) => (
            <div key={d.id} className="bg-[#121212] border border-white/5 rounded-xl p-5">
              <div className="flex flex-wrap items-start gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-white/90">{d.title}</span>
                    <span className="text-[12px] uppercase tracking-wide text-[#E8AE3C] border border-[rgba(232,174,60,0.25)] bg-[rgba(232,174,60,0.08)] rounded-full px-2 py-0.5">
                      {KIND_LABELS[d.kind] || d.kind}
                    </span>
                    <span className={`text-[12px] uppercase tracking-wide border rounded-full px-2 py-0.5 ${PRIORITY_STYLE[d.priority] || PRIORITY_STYLE.normal}`}>
                      {d.priority}
                    </span>
                    <span className="text-[12px] uppercase tracking-wide text-white/70 border border-white/10 rounded-full px-2 py-0.5">
                      {d.status}
                    </span>
                  </div>
                  {d.description && <p className="text-xs text-white/60 mt-2">{d.description}</p>}
                  <div className="text-[12px] text-white/70 mt-2 flex flex-wrap gap-x-3 gap-y-1">
                    {d.complainant && <span>Complainant: {d.complainant}</span>}
                    {d.respondent && <span>Respondent: {d.respondent}</span>}
                    {d.property_ref && <span className="font-mono">{d.property_ref}</span>}
                  </div>
                </div>
                {d.status === "open" && (
                  <form action={claimDispute}>
                    <input type="hidden" name="disputeId" value={d.id} />
                    <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 transition-colors whitespace-nowrap">
                      <UserCheck className="w-3.5 h-3.5" />
                      Take mediation
                    </button>
                  </form>
                )}
              </div>

              {/* Mediation thread */}
              {(eventsByDispute[d.id] || []).length > 0 && (
                <div className="mt-4 pl-3 border-l border-white/10 space-y-2">
                  {eventsByDispute[d.id].map((ev) => (
                    <div key={ev.id} className="text-xs">
                      <span className="text-white/70">
                        {new Date(ev.created_at).toLocaleString()} · {ev.author_email || "system"} ·{" "}
                        <span className="uppercase tracking-wide text-white/70">{ev.event_type}</span>
                      </span>
                      <p className="text-white/70">{ev.body}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Add note */}
              <form action={addDisputeNote} className="flex gap-2 mt-4">
                <input type="hidden" name="disputeId" value={d.id} />
                <input
                  name="body"
                  required
                  placeholder="Add a mediation note…"
                  className="flex-1 min-w-0 bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/70"
                />
                <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 transition-colors whitespace-nowrap">
                  <MessageSquare className="w-3.5 h-3.5" />
                  Note
                </button>
              </form>

              {/* Close (Ops Manager+) */}
              {canClose && (
                <form action={closeDispute} className="flex flex-col sm:flex-row gap-2 mt-3 pt-3 border-t border-white/5">
                  <input type="hidden" name="disputeId" value={d.id} />
                  <input
                    name="resolution"
                    required
                    placeholder="Resolution summary (required)"
                    className="flex-1 min-w-0 bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/70"
                  />
                  <div className="flex gap-2">
                    <button
                      name="outcome"
                      value="resolved"
                      className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-emerald-400/10 hover:bg-emerald-400/20 text-emerald-400 border border-emerald-400/20 transition-colors whitespace-nowrap"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Resolve
                    </button>
                    <button
                      name="outcome"
                      value="dismissed"
                      className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-white/5 hover:bg-white/10 text-white/60 border border-white/10 transition-colors whitespace-nowrap"
                    >
                      <XCircle className="w-4 h-4" />
                      Dismiss
                    </button>
                  </div>
                </form>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Recently closed */}
      {closed.data.length > 0 && (
        <section className="bg-[#121212] border border-white/5 rounded-xl p-6">
          <h2 className="text-sm font-medium text-white/70 mb-4">Recently closed</h2>
          <div className="divide-y divide-white/5">
            {closed.data.map((d) => (
              <div key={d.id} className="flex items-center gap-3 py-2.5 text-sm">
                {d.status === "resolved" ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                ) : (
                  <XCircle className="w-3.5 h-3.5 text-white/70 shrink-0" />
                )}
                <span className="text-white/80 truncate">{d.title}</span>
                <span className="text-[12px] uppercase tracking-wide text-white/70 whitespace-nowrap">
                  {d.status}
                </span>
                <span className="ml-auto text-[12px] text-white/70 whitespace-nowrap">
                  {d.resolved_at ? new Date(d.resolved_at).toLocaleDateString() : "—"}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
