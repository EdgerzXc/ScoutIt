import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentStaff, TIERS } from "@/lib/rbac";
import { blockHash, unblockHash } from "./actions";
import { ShieldAlert, ShieldBan, ShieldCheck, Activity, Radar } from "lucide-react";
import SecuritySpatialMap from "@/components/security/SecuritySpatialMap";

// A7 Phase 1 — Security Center (Ops Manager+). A HUD over the masked-IP
// anomaly log (security_access_logs, populated by the Phase-2 middleware
// guard) and the blocked_access ban list. Raw IPs never exist anywhere in
// this system — only salted hashes (`ip_anon_…`).

async function safe(promise) {
  try {
    const result = await promise;
    if (result.error) throw new Error(result.error.message);
    return { data: result.data ?? [], error: null };
  } catch (err) {
    return { data: [], error: err.message || String(err) };
  }
}

export default async function SecurityCenterPage() {
  const staff = await getCurrentStaff();
  if (!staff || staff.tier < TIERS.OPS_MANAGER) redirect("/dashboard");

  const admin = createAdminClient();
  const since30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [flagged, velocity, history30d, blocked] = await Promise.all([
    safe(
      admin
        .from("security_access_logs")
        .select("id, masked_ip, route_accessed, request_count, is_flagged, flag_reason, last_request_at, city, country, latitude, longitude")
        .eq("is_flagged", true)
        .order("last_request_at", { ascending: false })
        .limit(50)
    ),
    safe(
      admin
        .from("security_access_logs")
        .select("id, masked_ip, route_accessed, request_count, is_flagged, last_request_at, city, country, latitude, longitude")
        .order("request_count", { ascending: false })
        .limit(50)
    ),
    safe(
      admin
        .from("security_access_logs")
        .select("id, masked_ip, route_accessed, request_count, is_flagged, last_request_at, city, country, latitude, longitude")
        .gte("last_request_at", since30d)
        .order("last_request_at", { ascending: false })
        .limit(1000)
    ),
    safe(
      admin
        .from("blocked_access")
        .select("id, type, value, reason, created_at")
        .eq("type", "ip")
        .order("created_at", { ascending: false })
        .limit(100)
    ),
  ]);

  const blockedSet = new Set(blocked.data.map((b) => b.value));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <Radar className="w-5 h-5 text-[#E8AE3C]" />
            Security Center
          </h1>
          <p className="text-[10px] uppercase tracking-wide text-white/40 mt-1">
            Masked-IP anomaly guard · no raw IPs are ever stored
          </p>
        </div>
        <span className="text-xs text-white/40">
          {flagged.data.length} flagged · {blocked.data.length} blocked
        </span>
      </div>

      {(flagged.error || velocity.error) && (
        <div className="text-xs text-white/50 bg-white/5 border border-white/10 rounded-xl p-4">
          Traffic log unavailable ({flagged.error || velocity.error}). The log fills once the
          Phase-2 middleware guard on the public site is enabled — the ban list below already works.
        </div>
      )}

      {/* Sentinel Eye Spatial Heatmap & Location Trends */}
      <SecuritySpatialMap
        velocityData={velocity.data}
        flaggedData={flagged.data}
        history30dData={history30d.data}
        blockedHashes={Array.from(blockedSet)}
      />

      {/* Flagged anomalies */}
      <section className="bg-[#121212] border border-white/5 rounded-xl p-6">
        <h2 className="text-lg font-medium flex items-center gap-2 mb-4">
          <ShieldAlert className="w-4 h-4 text-orange-400" />
          Flagged Anomalies
        </h2>
        {flagged.data.length === 0 ? (
          <p className="text-xs text-white/40">No flagged traffic. Quiet skies.</p>
        ) : (
          <div className="divide-y divide-white/5">
            {flagged.data.map((row) => (
              <TrafficRow key={row.id} row={row} isBlocked={blockedSet.has(row.masked_ip)} />
            ))}
          </div>
        )}
      </section>

      {/* High-velocity traffic */}
      <section className="bg-[#121212] border border-white/5 rounded-xl p-6">
        <h2 className="text-lg font-medium flex items-center gap-2 mb-4">
          <Activity className="w-4 h-4 text-[#E8AE3C]" />
          Highest-Velocity Sources
        </h2>
        {velocity.data.length === 0 ? (
          <p className="text-xs text-white/40">No traffic recorded yet.</p>
        ) : (
          <div className="divide-y divide-white/5">
            {velocity.data.map((row) => (
              <TrafficRow key={row.id} row={row} isBlocked={blockedSet.has(row.masked_ip)} />
            ))}
          </div>
        )}
      </section>

      {/* Ban list */}
      <section className="bg-[#121212] border border-white/5 rounded-xl p-6">
        <h2 className="text-lg font-medium flex items-center gap-2 mb-4">
          <ShieldBan className="w-4 h-4 text-red-400" />
          Blocked Access
        </h2>

        {/* Manual block */}
        <form action={blockHash} className="flex flex-wrap items-end gap-2 mb-5 pb-5 border-b border-white/5">
          <label className="text-xs text-white/50 flex-1 min-w-[220px]">
            Masked IP hash
            <input
              name="maskedIp"
              required
              placeholder="ip_anon_…"
              className="mt-1 w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono placeholder:text-white/20"
            />
          </label>
          <label className="text-xs text-white/50 flex-1 min-w-[220px]">
            Reason (required)
            <input
              name="reason"
              required
              placeholder="e.g. scraper hammering /api/cms"
              className="mt-1 w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/20"
            />
          </label>
          <button className="px-4 py-2 rounded-lg text-sm font-medium bg-red-400/10 hover:bg-red-400/20 text-red-400 border border-red-400/20 transition-colors">
            Block
          </button>
        </form>

        {blocked.data.length === 0 ? (
          <p className="text-xs text-white/40">No active blocks.</p>
        ) : (
          <div className="divide-y divide-white/5">
            {blocked.data.map((b) => (
              <div key={b.id} className="flex items-center gap-3 py-2.5 text-sm">
                <ShieldBan className="w-3.5 h-3.5 text-red-400 shrink-0" />
                <span className="font-mono text-xs text-white/80 truncate">{b.value}</span>
                <span className="text-xs text-white/40 truncate flex-1">
                  {b.reason} · {new Date(b.created_at).toLocaleString()}
                </span>
                <form action={unblockHash}>
                  <input type="hidden" name="blockId" value={b.id} />
                  <input type="hidden" name="maskedIp" value={b.value} />
                  <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 transition-colors">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Unblock
                  </button>
                </form>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function TrafficRow({ row, isBlocked }) {
  return (
    <div className="flex items-center gap-3 py-2.5 text-sm">
      <span className="font-mono text-xs text-white/80 truncate max-w-[200px]">{row.masked_ip}</span>
      <span className="text-xs text-white/50 truncate">{row.route_accessed}</span>
      <span className="text-xs text-[#E8AE3C] font-mono whitespace-nowrap">
        {row.request_count} req
      </span>
      {row.flag_reason && (
        <span className="text-[10px] text-orange-400/80 truncate">{row.flag_reason}</span>
      )}
      <span className="ml-auto text-[10px] text-white/40 whitespace-nowrap">
        {row.last_request_at ? new Date(row.last_request_at).toLocaleString() : "—"}
      </span>
      {isBlocked ? (
        <span className="text-[10px] uppercase tracking-wide text-red-400 border border-red-400/20 bg-red-400/10 rounded-full px-2 py-0.5">
          blocked
        </span>
      ) : (
        <form action={blockHash}>
          <input type="hidden" name="maskedIp" value={row.masked_ip} />
          <input type="hidden" name="reason" value={row.flag_reason || `High velocity: ${row.request_count} requests on ${row.route_accessed}`} />
          <button className="text-[10px] uppercase tracking-wide text-red-400/80 hover:text-red-400 border border-red-400/20 hover:bg-red-400/10 rounded-full px-2 py-0.5 transition-colors">
            block
          </button>
        </form>
      )}
    </div>
  );
}
