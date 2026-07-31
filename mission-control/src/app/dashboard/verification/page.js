import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentStaff, TIERS } from "@/lib/rbac";
import {
  createVerificationRequest,
  approveVerification,
  rejectVerification,
} from "./actions";
import { BadgeCheck, ShieldCheck, ShieldX, Clock, Plus } from "lucide-react";

// Trust & Verification Center — the queue that turns claims into verified
// status. Reads verification_requests (service-role). Degrades to an empty
// queue with a friendly note if the 0005 migration has not been applied yet.

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
  prc_license: "PRC License",
  price_verification: "Price Verification",
  identity: "Identity",
  business: "Business",
};

export default async function VerificationPage() {
  const staff = await getCurrentStaff();
  if (!staff) redirect("/?error=NotAuthorized");

  const admin = createAdminClient();
  const [pending, decided] = await Promise.all([
    safe(
      admin
        .from("verification_requests")
        .select("*")
        .eq("status", "pending")
        .order("priority", { ascending: false })
        .order("created_at", { ascending: true })
        .limit(100)
    ),
    safe(
      admin
        .from("verification_requests")
        .select("id, kind, subject_name, status, review_notes, decided_at")
        .neq("status", "pending")
        .order("decided_at", { ascending: false })
        .limit(25)
    ),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <BadgeCheck className="w-5 h-5 text-[#E8AE3C]" />
            Trust &amp; Verification
          </h1>
          <p className="text-[10px] uppercase tracking-wide text-white/40 mt-1">
            PRC licenses · price verification · identity &amp; business
          </p>
        </div>
        <span className="text-xs text-white/40 whitespace-nowrap">{pending.data.length} pending</span>
      </div>

      {pending.error && (
        <div className="text-xs text-white/50 bg-white/5 border border-white/10 rounded-xl p-4">
          Verification queue unavailable ({pending.error}). Apply migration
          <span className="font-mono text-white/70"> 0005_verification_requests.sql </span>
          to activate this module.
        </div>
      )}

      {/* File a new request */}
      <details className="bg-[#121212] border border-white/5 rounded-xl overflow-hidden group">
        <summary className="flex items-center gap-2 px-6 py-4 cursor-pointer text-sm text-white/70 hover:text-white select-none">
          <Plus className="w-4 h-4 text-[#E8AE3C]" />
          File a verification request manually
        </summary>
        <form
          action={createVerificationRequest}
          className="px-6 pb-6 grid grid-cols-1 sm:grid-cols-2 gap-3"
        >
          <label className="text-xs text-white/50">
            Kind
            <select
              name="kind"
              className="mt-1 w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
            >
              <option value="prc_license">PRC License</option>
              <option value="price_verification">Price Verification</option>
              <option value="identity">Identity</option>
              <option value="business">Business</option>
            </select>
          </label>
          <label className="text-xs text-white/50">
            Subject type
            <select
              name="subjectType"
              className="mt-1 w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
            >
              <option value="broker">Broker</option>
              <option value="owner">Owner</option>
              <option value="property">Property</option>
            </select>
          </label>
          <label className="text-xs text-white/50">
            Subject name (required)
            <input
              name="subjectName"
              required
              placeholder="e.g. Maria Santos"
              className="mt-1 w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/20"
            />
          </label>
          <label className="text-xs text-white/50">
            Subject ID (optional)
            <input
              name="subjectId"
              placeholder="usr-… or property slug"
              className="mt-1 w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono placeholder:text-white/20"
            />
          </label>
          <label className="text-xs text-white/50 sm:col-span-2">
            Note (optional)
            <input
              name="note"
              placeholder="e.g. PRC #0123456, expires 2028"
              className="mt-1 w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/20"
            />
          </label>
          <div className="sm:col-span-2">
            <button className="px-4 py-2 rounded-lg text-sm font-medium bg-[rgba(232,174,60,0.10)] hover:bg-[rgba(232,174,60,0.18)] text-[#F7C64E] border border-[rgba(232,174,60,0.25)] transition-colors">
              Add to queue
            </button>
          </div>
        </form>
      </details>

      {/* Pending queue */}
      <section className="space-y-3">
        {pending.data.length === 0 && !pending.error ? (
          <div className="bg-[#121212] border border-white/5 rounded-xl p-8 text-center">
            <ShieldCheck className="w-6 h-6 text-emerald-400 mx-auto mb-3" />
            <p className="text-sm text-white/70">No pending verifications.</p>
          </div>
        ) : (
          pending.data.map((req) => (
            <div key={req.id} className="bg-[#121212] border border-white/5 rounded-xl p-5">
              <div className="flex flex-wrap items-start gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-white/90 truncate">
                      {req.subject_name || "Unnamed subject"}
                    </span>
                    <span className="text-[10px] uppercase tracking-wide text-[#E8AE3C] border border-[rgba(232,174,60,0.25)] bg-[rgba(232,174,60,0.08)] rounded-full px-2 py-0.5">
                      {KIND_LABELS[req.kind] || req.kind}
                    </span>
                    <span className="text-[10px] uppercase tracking-wide text-white/40 border border-white/10 rounded-full px-2 py-0.5">
                      {req.subject_type}
                    </span>
                    {req.priority === "high" && (
                      <span className="text-[10px] uppercase tracking-wide text-orange-400 border border-orange-400/20 bg-orange-400/10 rounded-full px-2 py-0.5">
                        high
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-white/40 mt-1 flex items-center gap-1.5">
                    <Clock className="w-3 h-3" />
                    {new Date(req.created_at).toLocaleString()}
                    {req.subject_id ? ` · ${req.subject_id}` : ""}
                  </div>
                  {req.details?.note && (
                    <p className="text-xs text-white/60 mt-2 bg-black/30 border border-white/5 rounded-lg px-3 py-2">
                      {req.details.note}
                    </p>
                  )}
                </div>
              </div>

              {/* Decision — mobile-first: stacks, goes inline on sm+ */}
              <div className="flex flex-col sm:flex-row gap-2 mt-4">
                <form action={approveVerification} className="sm:contents">
                  <input type="hidden" name="requestId" value={req.id} />
                  <input
                    name="notes"
                    placeholder="Note (optional)"
                    className="flex-1 min-w-0 bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/20"
                  />
                  <button className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-emerald-400/10 hover:bg-emerald-400/20 text-emerald-400 border border-emerald-400/20 transition-colors whitespace-nowrap">
                    <ShieldCheck className="w-4 h-4" />
                    Verify
                  </button>
                </form>
                <form action={rejectVerification} className="flex gap-2">
                  <input type="hidden" name="requestId" value={req.id} />
                  <input
                    name="notes"
                    required
                    placeholder="Reason to reject"
                    className="flex-1 min-w-0 bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/20"
                  />
                  <button className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-red-400/10 hover:bg-red-400/20 text-red-400 border border-red-400/20 transition-colors whitespace-nowrap">
                    <ShieldX className="w-4 h-4" />
                    Reject
                  </button>
                </form>
              </div>
            </div>
          ))
        )}
      </section>

      {/* Recently decided */}
      {decided.data.length > 0 && (
        <section className="bg-[#121212] border border-white/5 rounded-xl p-6">
          <h2 className="text-sm font-medium text-white/70 mb-4">Recently decided</h2>
          <div className="divide-y divide-white/5">
            {decided.data.map((d) => (
              <div key={d.id} className="flex items-center gap-3 py-2.5 text-sm">
                {d.status === "approved" ? (
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                ) : (
                  <ShieldX className="w-3.5 h-3.5 text-red-400 shrink-0" />
                )}
                <span className="text-white/80 truncate">{d.subject_name}</span>
                <span className="text-[10px] uppercase tracking-wide text-white/40">
                  {KIND_LABELS[d.kind] || d.kind}
                </span>
                <span className="ml-auto text-[10px] text-white/30 whitespace-nowrap">
                  {d.decided_at ? new Date(d.decided_at).toLocaleDateString() : "—"}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
